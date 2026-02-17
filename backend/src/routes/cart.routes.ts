import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ══════════════════════════════════════════
// 🛒 CART দেখুন
// ══════════════════════════════════════════
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Cart খুঁজুন বা তৈরি করুন
    let cart = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (cart.rows.length === 0) {
      cart = await pool.query(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING *', [userId]
      );
    }

    const cartId = cart.rows[0].id;

    const cartItems = await pool.query(
      `SELECT ci.*, p.name_bn, p.name_en, p.price, p.image_url, p.unit, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    const subtotal = cartItems.rows.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity, 0
    );

    res.json({
      success: true,
      cart: {
        id: cartId,
        items: cartItems.rows,
        itemCount: cartItems.rows.length,
        subtotal: subtotal.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Cart Error:', error);
    res.status(500).json({ success: false, message: 'কার্ট লোড করতে সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// ➕ CART-এ পণ্য যোগ করুন
// ══════════════════════════════════════════
router.post('/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'পণ্য নির্বাচন করুন' });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'পরিমাণ কমপক্ষে ১ হতে হবে' });
    }

    // পণ্য আছে কিনা ও stock চেক
    const product = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND is_available = true', [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'পণ্য পাওয়া যায়নি' });
    }

    if (product.rows[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `পর্যাপ্ত স্টক নেই (আছে: ${product.rows[0].stock_quantity})`
      });
    }

    // Cart খুঁজুন বা তৈরি করুন
    let cart = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (cart.rows.length === 0) {
      cart = await pool.query(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING *', [userId]
      );
    }

    const cartId = cart.rows[0].id;

    // আগে থেকে cart-এ আছে কিনা চেক
    const existingItem = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    if (existingItem.rows.length > 0) {
      const newQuantity = existingItem.rows[0].quantity + quantity;

      if (product.rows[0].stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `পর্যাপ্ত স্টক নেই (আছে: ${product.rows[0].stock_quantity})`
        });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [newQuantity, existingItem.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)',
        [cartId, productId, quantity, product.rows[0].price]
      );
    }

    res.json({ success: true, message: 'কার্টে যোগ করা হয়েছে' });
  } catch (error) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({ success: false, message: 'কার্টে যোগ করতে সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// ✏️ CART ITEM quantity আপডেট
// ══════════════════════════════════════════
router.put('/update/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'পরিমাণ কমপক্ষে ১ হতে হবে' });
    }

    // Item ও stock চেক
    const item = await pool.query(
      `SELECT ci.*, p.stock_quantity, p.name_bn
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (item.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'আইটেম পাওয়া যায়নি' });
    }

    if (item.rows[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `পর্যাপ্ত স্টক নেই (আছে: ${item.rows[0].stock_quantity})`
      });
    }

    await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, itemId]);

    res.json({ success: true, message: 'আপডেট করা হয়েছে' });
  } catch (error) {
    console.error('Update Cart Error:', error);
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// ❌ CART থেকে পণ্য সরান
// ══════════════════════════════════════════
router.delete('/remove/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;

    // নিজের cart item কিনা নিশ্চিত করুন
    const check = await pool.query(
      `SELECT ci.id FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'আইটেম পাওয়া যায়নি' });
    }

    await pool.query('DELETE FROM cart_items WHERE id = $1', [itemId]);

    res.json({ success: true, message: 'কার্ট থেকে সরানো হয়েছে' });
  } catch (error) {
    console.error('Remove from Cart Error:', error);
    res.status(500).json({ success: false, message: 'সরাতে সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// 🗑️ CART সম্পূর্ণ খালি করুন
// ══════════════════════════════════════════
router.delete('/clear', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const cart = await pool.query('SELECT id FROM carts WHERE user_id = $1', [userId]);

    if (cart.rows.length > 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);
    }

    res.json({ success: true, message: 'কার্ট খালি করা হয়েছে' });
  } catch (error) {
    console.error('Clear Cart Error:', error);
    res.status(500).json({ success: false, message: 'কার্ট খালি করতে সমস্যা হয়েছে' });
  }
});

export default router;