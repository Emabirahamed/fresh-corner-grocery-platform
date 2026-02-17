import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp.slice(-8)}${random}`;
};

// ══════════════════════════════════════════
// 🛒 ORDER PLACE
// ══════════════════════════════════════════
router.post('/place', authMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    const {
      deliveryAddress, deliveryPhone, deliveryName,
      paymentMethod = 'cod', notes
    } = req.body;

    if (!deliveryAddress || !deliveryPhone || !deliveryName) {
      return res.status(400).json({
        success: false,
        message: 'ডেলিভারি তথ্য সম্পূর্ণ করুন (ঠিকানা, ফোন, নাম)'
      });
    }

    await client.query('BEGIN');

    // Cart খুঁজুন
    const cart = await client.query(
      'SELECT * FROM carts WHERE user_id = $1', [userId]
    );
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

    // Stock চেক (সব আইটেম একসাথে)
    for (const item of cartItems.rows) {
      if (item.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `"${item.name_bn}" — পর্যাপ্ত স্টক নেই (আছে: ${item.stock_quantity})`
        });
      }
    }

    const subtotal = cartItems.rows.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity, 0
    );
    const deliveryFee = 0;
    const total = subtotal + deliveryFee;
    const orderNumber = generateOrderNumber();

    // Order তৈরি করুন
    const order = await client.query(
      `INSERT INTO orders (
        user_id, order_number, status, payment_method, payment_status,
        subtotal, delivery_fee, total_amount, delivery_address,
        delivery_phone, delivery_name, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        userId, orderNumber, 'pending', paymentMethod, 'pending',
        subtotal, deliveryFee, total,
        deliveryAddress, deliveryPhone, deliveryName, notes || null
      ]
    );

    const orderId = order.rows[0].id;

    // Order items insert + stock কমানো
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

    // Cart clear করুন
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে',
      order: {
        id: orderId,
        orderNumber,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2)
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order Error:', error);
    res.status(500).json({ success: false, message: 'অর্ডার করতে সমস্যা হয়েছে' });
  } finally {
    client.release();
  }
});

// ══════════════════════════════════════════
// 📋 MY ORDERS (ব্যবহারকারীর নিজের)
// ══════════════════════════════════════════
router.get('/my-orders', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = '1', limit = '10' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const orders = await pool.query(
      `SELECT o.*,
         (SELECT json_agg(json_build_object(
           'name_bn', p.name_bn,
           'quantity', oi.quantity,
           'price', oi.price
         ))
         FROM order_items oi JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = o.id) AS items
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit as string), offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]
    );

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      orders: orders.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'অর্ডার লোড করতে সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// 🔍 ORDER DETAILS (একটি অর্ডারের বিস্তারিত)
// ══════════════════════════════════════════
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
      `SELECT oi.*, p.name_bn, p.name_en, p.image_url
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

// ══════════════════════════════════════════
// 🔐 ADMIN: সব অর্ডার দেখুন
// ══════════════════════════════════════════
router.get('/admin/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orders = await pool.query(
      `SELECT o.*, u.phone AS user_phone, u.full_name,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${whereClause}
       GROUP BY o.id, u.phone, u.full_name
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit as string), offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`, params
    );

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      orders: orders.rows
    });
  } catch (error) {
    console.error('Admin Orders Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// 🔐 ADMIN: অর্ডার স্ট্যাটাস আপডেট
// ══════════════════════════════════════════
router.put('/admin/:orderId/status', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'অবৈধ স্ট্যাটাস' });
    }

    const currentOrder = await client.query(
      'SELECT * FROM orders WHERE id = $1', [orderId]
    );

    if (currentOrder.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
    }

    const prevStatus = currentOrder.rows[0].status;

    // ইতিমধ্যে এই স্ট্যাটাস থাকলে skip
    if (prevStatus === status) {
      return res.status(400).json({ success: false, message: 'অর্ডার ইতিমধ্যে এই স্ট্যাটাসে আছে' });
    }

    await client.query('BEGIN');

    await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, orderId]
    );

    // Cancelled হলে stock ফেরত দাও
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      const orderItems = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1', [orderId]
      );
      for (const item of orderItems.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    // Delivered হলে payment status update
    if (status === 'delivered') {
      await client.query(
        `UPDATE orders SET payment_status = 'paid', delivered_at = NOW() WHERE id = $1`,
        [orderId]
      );
    }

    await client.query('COMMIT');

    res.json({ success: true, message: 'অর্ডার স্ট্যাটাস আপডেট হয়েছে' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Status Update Error:', error);
    res.status(500).json({ success: false, message: 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে' });
  } finally {
    client.release();
  }
});

export default router;