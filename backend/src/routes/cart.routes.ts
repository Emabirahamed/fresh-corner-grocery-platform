import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Get user's cart
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get or create cart
    let cart = await pool.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cart.rows.length === 0) {
      cart = await pool.query(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
        [userId]
      );
    }

    const cartId = cart.rows[0].id;

    // Get cart items with product details
    const cartItems = await pool.query(
      `SELECT ci.*, p.name_bn, p.name_en, p.price, p.image_url, p.unit, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    // Calculate totals
    const subtotal = cartItems.rows.reduce((sum, item) => 
      sum + (parseFloat(item.price) * item.quantity), 0
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
    res.status(500).json({
      success: false,
      message: 'কার্ট লোড করতে সমস্যা হয়েছে'
    });
  }
});

// Add item to cart
router.post('/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'পণ্য নির্বাচন করুন'
      });
    }

    // Check product exists and stock
    const product = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND is_available = true',
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'পণ্য পাওয়া যায়নি'
      });
    }

    if (product.rows[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'পর্যাপ্ত স্টক নেই'
      });
    }

    // Get or create cart
    let cart = await pool.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cart.rows.length === 0) {
      cart = await pool.query(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
        [userId]
      );
    }

    const cartId = cart.rows[0].id;

    // Check if item already in cart
    const existingItem = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;
      
      if (product.rows[0].stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'পর্যাপ্ত স্টক নেই'
        });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [newQuantity, existingItem.rows[0].id]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [cartId, productId, quantity, product.rows[0].price]
      );
    }

    res.json({
      success: true,
      message: 'কার্টে যোগ করা হয়েছে'
    });

  } catch (error) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({
      success: false,
      message: 'কার্টে যোগ করতে সমস্যা হয়েছে'
    });
  }
});

// Update cart item quantity
router.put('/update/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'পরিমাণ কমপক্ষে ১ হতে হবে'
      });
    }

    // Check stock
    const item = await pool.query(
      `SELECT ci.*, p.stock_quantity 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.id = $1`,
      [itemId]
    );

    if (item.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'আইটেম পাওয়া যায়নি'
      });
    }

    if (item.rows[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'পর্যাপ্ত স্টক নেই'
      });
    }

    await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2',
      [quantity, itemId]
    );

    res.json({
      success: true,
      message: 'আপডেট করা হয়েছে'
    });

  } catch (error) {
    console.error('Update Cart Error:', error);
    res.status(500).json({
      success: false,
      message: 'আপডেট করতে সমস্যা হয়েছে'
    });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    await pool.query('DELETE FROM cart_items WHERE id = $1', [itemId]);

    res.json({
      success: true,
      message: 'কার্ট থেকে সরানো হয়েছে'
    });

  } catch (error) {
    console.error('Remove from Cart Error:', error);
    res.status(500).json({
      success: false,
      message: 'সরাতে সমস্যা হয়েছে'
    });
  }
});

// Clear cart
router.delete('/clear', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const cart = await pool.query(
      'SELECT id FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cart.rows.length > 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);
    }

    res.json({
      success: true,
      message: 'কার্ট খালি করা হয়েছে'
    });

  } catch (error) {
    console.error('Clear Cart Error:', error);
    res.status(500).json({
      success: false,
      message: 'কার্ট খালি করতে সমস্যা হয়েছে'
    });
  }
});

export default router;
