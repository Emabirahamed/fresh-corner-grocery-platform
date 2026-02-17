import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp.slice(-8)}${random}`;
};

// Place order
router.post('/place', authMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    const { deliveryAddress, deliveryPhone, deliveryName, paymentMethod = 'cod', notes } = req.body;

    if (!deliveryAddress || !deliveryPhone || !deliveryName) {
      return res.status(400).json({ success: false, message: 'ডেলিভারি তথ্য সম্পূর্ণ করুন' });
    }

    await client.query('BEGIN');

    const cart = await client.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (cart.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'কার্ট খালি' });
    }

    const cartId = cart.rows[0].id;
    const cartItems = await client.query(
      `SELECT ci.*, p.name_bn, p.price, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'কার্টে কোনো পণ্য নেই' });
    }

    for (const item of cartItems.rows) {
      if (item.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `${item.name_bn} - পর্যাপ্ত স্টক নেই` });
      }
    }

    const subtotal = cartItems.rows.reduce((sum, item) =>
      sum + (parseFloat(item.price) * item.quantity), 0
    );
    const deliveryFee = 0;
    const total = subtotal + deliveryFee;
    const orderNumber = generateOrderNumber();

    const order = await client.query(
      `INSERT INTO orders (
        user_id, order_number, status, payment_method, payment_status,
        subtotal, delivery_fee, total, delivery_address, delivery_phone,
        delivery_name, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [userId, orderNumber, 'pending', paymentMethod, 'pending',
       subtotal, deliveryFee, total, deliveryAddress, deliveryPhone, deliveryName, notes]
    );

    const orderId = order.rows[0].id;

    for (const item of cartItems.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
         VALUES ($1,$2,$3,$4,$5)`,
        [orderId, item.product_id, item.quantity, item.price,
         parseFloat(item.price) * item.quantity]
      );
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে',
      order: { id: orderId, orderNumber, total: total.toFixed(2) }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order Error:', error);
    res.status(500).json({ success: false, message: 'অর্ডার করতে সমস্যা হয়েছে' });
  } finally {
    client.release();
  }
});

// Get user orders
router.get('/my-orders', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orders = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, orders: orders.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'অর্ডার লোড করতে সমস্যা হয়েছে' });
  }
});

// ===== ADMIN: Get ALL orders =====
router.get('/admin/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = '';
    const params: any[] = [];

    if (status && status !== 'all') {
      whereClause = 'WHERE o.status = $1';
      params.push(status);
    }

    const orders = await pool.query(
      `SELECT o.*, u.phone as user_phone,
        COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${whereClause}
       GROUP BY o.id, u.phone
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit as string), offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      params.slice(0, whereClause ? 1 : 0)
    );

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      orders: orders.rows
    });

  } catch (error) {
    console.error('Admin Orders Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

// ===== ADMIN: Update Order Status =====
router.put('/admin/:orderId/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ স্ট্যাটাস'
      });
    }

    // Get current order
    const currentOrder = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (currentOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    // Update order status
    const updatedOrder = await pool.query(
      `UPDATE orders
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, orderId]
    );

    // If cancelled, restore stock
    if (status === 'cancelled' && currentOrder.rows[0].status !== 'cancelled') {
      const orderItems = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [orderId]
      );

      for (const item of orderItems.rows) {
        await pool.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    // If delivered, update payment status
    if (status === 'delivered') {
      await pool.query(
        `UPDATE orders SET payment_status = 'paid' WHERE id = $1`,
        [orderId]
      );
    }

    const statusMessages: any = {
      pending: 'অপেক্ষমাণ',
      confirmed: 'নিশ্চিত করা হয়েছে',
      processing: 'প্রস্তুত করা হচ্ছে',
      shipped: 'পাঠানো হয়েছে',
      delivered: 'ডেলিভার হয়েছে',
      cancelled: 'বাতিল করা হয়েছে'
    };

    res.json({
      success: true,
      message: `অর্ডার ${statusMessages[status]}`,
      order: updatedOrder.rows[0]
    });

  } catch (error) {
    console.error('Status Update Error:', error);
    res.status(500).json({ success: false, message: 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে' });
  }
});

// Get order details
router.get('/:orderId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
    }

    const items = await pool.query(
      `SELECT oi.*, p.name_bn, p.name_en
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.json({
      success: true,
      order: { ...order.rows[0], items: items.rows }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

export default router;
