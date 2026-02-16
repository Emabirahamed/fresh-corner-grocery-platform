import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Generate order number
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
    const { 
      deliveryAddress,
      deliveryPhone,
      deliveryName,
      paymentMethod = 'cash_on_delivery',
      notes 
    } = req.body;

    // Validation
    if (!deliveryAddress || !deliveryPhone || !deliveryName) {
      return res.status(400).json({
        success: false,
        message: 'ডেলিভারি তথ্য সম্পূর্ণ করুন'
      });
    }

    await client.query('BEGIN');

    // Get cart
    const cart = await client.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cart.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'কার্ট খালি'
      });
    }

    const cartId = cart.rows[0].id;

    // Get cart items
    const cartItems = await client.query(
      `SELECT ci.*, p.name_bn, p.price, p.stock_quantity 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'কার্টে কোনো পণ্য নেই'
      });
    }

    // Check stock availability
    for (const item of cartItems.rows) {
      if (item.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `${item.name_bn} - পর্যাপ্ত স্টক নেই`
        });
      }
    }

    // Calculate totals
    const subtotal = cartItems.rows.reduce((sum, item) => 
      sum + (parseFloat(item.price) * item.quantity), 0
    );
    const deliveryFee = 0; // Free delivery
    const total = subtotal + deliveryFee;

    // Create order
    const orderNumber = generateOrderNumber();
    const order = await client.query(
      `INSERT INTO orders (
        user_id, order_number, status, payment_method, payment_status,
        subtotal, delivery_charge, total_amount, delivery_address_text, delivery_phone,
        delivery_name, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId, orderNumber, 'pending', paymentMethod, 'pending',
        subtotal, deliveryFee, total, deliveryAddress, deliveryPhone,
        deliveryName, notes
      ]
    );

    const orderId = order.rows[0].id;

    // Create order items & update stock
    for (const item of cartItems.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.product_id, item.name_bn, item.quantity, item.price, 
         parseFloat(item.price) * item.quantity]
      );

      // Update product stock
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে',
      order: {
        id: orderId,
        orderNumber: orderNumber,
        total: total.toFixed(2)
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার করতে সমস্যা হয়েছে'
    });
  } finally {
    client.release();
  }
});

// Get user orders
router.get('/my-orders', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const orders = await pool.query(
      `SELECT 
        id, order_number, status, payment_method, payment_status,
        subtotal, delivery_charge AS delivery_fee,
        total_amount AS total,
        delivery_name, delivery_phone,
        delivery_address_text AS delivery_address,
        notes, created_at
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      orders: orders.rows
    });

  } catch (error) {
    console.error('Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার লোড করতে সমস্যা হয়েছে'
    });
  }
});

// Get order details
router.get('/:orderId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    // Get order — DB কলামগুলো frontend এর নামে alias করা হয়েছে
    const order = await pool.query(
      `SELECT 
        id, order_number, status, payment_method, payment_status,
        subtotal, delivery_charge AS delivery_fee,
        total_amount AS total,
        delivery_name, delivery_phone,
        delivery_address_text AS delivery_address,
        notes, created_at
       FROM orders 
       WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডার পাওয়া যায়নি'
      });
    }

    // Get order items — DB কলামগুলো frontend এর নামে alias করা হয়েছে
    const items = await pool.query(
      `SELECT 
        oi.id, oi.order_id, oi.product_id,
        oi.product_name AS name_bn,
        p.name_en,
        oi.quantity,
        oi.unit_price AS price,
        oi.total_price AS subtotal
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.json({
      success: true,
      order: {
        ...order.rows[0],
        items: items.rows
      }
    });

  } catch (error) {
    console.error('Order Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার লোড করতে সমস্যা হয়েছে'
    });
  }
});

export default router;