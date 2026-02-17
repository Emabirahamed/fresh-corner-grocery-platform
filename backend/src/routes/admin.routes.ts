import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// সব admin route-এ authMiddleware + adminMiddleware লাগবে
// (DB call ছাড়াই JWT role থেকে চেক হয়)

// ══════════════════════════════════════════
// 📊 DASHBOARD STATS
// ══════════════════════════════════════════
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const [orders, revenue, users, products, recentOrders, topProducts] = await Promise.all([
      // মোট অর্ডার ও status breakdown
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
          COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
          COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
        FROM orders
      `),
      // মোট আয়
      pool.query(`
        SELECT
          COALESCE(SUM(total_amount), 0) AS total_revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) AS monthly_revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'), 0) AS weekly_revenue
        FROM orders WHERE status != 'cancelled'
      `),
      // মোট ইউজার
      pool.query(`
        SELECT COUNT(*) AS total,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_this_month
        FROM users WHERE role = 'customer'
      `),
      // মোট পণ্য
      pool.query(`
        SELECT COUNT(*) AS total,
          COUNT(*) FILTER (WHERE stock_quantity < 10) AS low_stock,
          COUNT(*) FILTER (WHERE stock_quantity = 0) AS out_of_stock
        FROM products
      `),
      // সাম্প্রতিক ৫টা অর্ডার
      pool.query(`
        SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
               u.full_name, u.phone
        FROM orders o JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC LIMIT 5
      `),
      // সবচেয়ে বেশি বিক্রি হওয়া পণ্য
      pool.query(`
        SELECT p.name_bn, p.name_en, SUM(oi.quantity) AS total_sold,
               SUM(oi.total_price) AS total_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled'
        GROUP BY p.id, p.name_bn, p.name_en
        ORDER BY total_sold DESC LIMIT 5
      `)
    ]);

    res.json({
      success: true,
      stats: {
        orders: orders.rows[0],
        revenue: revenue.rows[0],
        users: users.rows[0],
        products: products.rows[0],
      },
      recentOrders: recentOrders.rows,
      topProducts: topProducts.rows
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ success: false, message: 'স্ট্যাটস লোড করতে সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// 📦 PRODUCTS MANAGEMENT
// ══════════════════════════════════════════
router.get('/products', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name_bn AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, products: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'পণ্য লোড করতে সমস্যা হয়েছে' });
  }
});

router.post('/products', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      name_bn, name_en, category_id, price,
      discount_price, stock_quantity, unit, description_bn
    } = req.body;

    if (!name_bn || !name_en || !price) {
      return res.status(400).json({ success: false, message: 'নাম ও দাম আবশ্যক' });
    }

    // Price validation
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক দাম দিন' });
    }

    const slug = name_en.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

    const result = await pool.query(`
      INSERT INTO products (
        name_bn, name_en, slug, category_id, price, discount_price,
        stock_quantity, unit, description_bn, is_available
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
      RETURNING *
    `, [
      name_bn, name_en, slug, category_id || null,
      price, discount_price || null,
      stock_quantity || 0, unit || 'kg', description_bn || ''
    ]);

    res.status(201).json({
      success: true,
      message: 'পণ্য যোগ হয়েছে',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ success: false, message: 'পণ্য যোগ করতে সমস্যা হয়েছে' });
  }
});

router.put('/products/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name_bn, name_en, category_id, price, discount_price,
      stock_quantity, unit, description_bn, is_available
    } = req.body;

    // পণ্য আছে কিনা চেক
    const existing = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'পণ্য পাওয়া যায়নি' });
    }

    const result = await pool.query(`
      UPDATE products SET
        name_bn=$1, name_en=$2, category_id=$3, price=$4, discount_price=$5,
        stock_quantity=$6, unit=$7, description_bn=$8, is_available=$9, updated_at=NOW()
      WHERE id=$10
      RETURNING *
    `, [
      name_bn, name_en, category_id || null, price, discount_price || null,
      stock_quantity, unit, description_bn || '', is_available, id
    ]);

    res.json({ success: true, message: 'পণ্য আপডেট হয়েছে', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে' });
  }
});

router.delete('/products/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'পণ্য পাওয়া যায়নি' });
    }

    // Hard delete নয় — soft delete (is_available = false)
    await pool.query('UPDATE products SET is_available = false, updated_at = NOW() WHERE id = $1', [id]);
    res.json({ success: true, message: 'পণ্য সরানো হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// 🧾 ORDERS MANAGEMENT
// ══════════════════════════════════════════
router.get('/orders', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
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

    const result = await pool.query(`
      SELECT o.*, u.full_name, u.phone,
             COUNT(oi.id) AS item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.full_name, u.phone
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, parseInt(limit as string), offset]);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      params
    );

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      orders: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'অর্ডার লোড করতে সমস্যা হয়েছে' });
  }
});

router.patch('/orders/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'pending', 'confirmed', 'processing',
      'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'ভুল স্ট্যাটাস' });
    }

    // অর্ডার আছে কিনা চেক
    const existing = await pool.query('SELECT id, status FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
    }

    // timestamp field নির্ধারণ
    const timeField = status === 'confirmed' ? ', confirmed_at = NOW()'
      : status === 'delivered' ? ', delivered_at = NOW()'
      : status === 'cancelled' ? ', cancelled_at = NOW()' : '';

    await pool.query(
      `UPDATE orders SET status = $1 ${timeField}, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    // Cancelled হলে stock ফেরত দাও
    if (status === 'cancelled' && existing.rows[0].status !== 'cancelled') {
      const orderItems = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1', [id]
      );
      for (const item of orderItems.rows) {
        await pool.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    res.json({ success: true, message: 'অর্ডার স্ট্যাটাস আপডেট হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে' });
  }
});

// ══════════════════════════════════════════
// 👥 USERS LIST
// ══════════════════════════════════════════
router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.phone, u.full_name, u.email, u.role, u.is_active, u.created_at,
             COUNT(o.id) AS total_orders,
             COALESCE(SUM(o.total_amount) FILTER (WHERE o.status != 'cancelled'), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ইউজার লোড করতে সমস্যা হয়েছে' });
  }
});

router.patch('/users/:id/toggle', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // নিজেকে নিজে ban করা যাবে না
    if (parseInt(id) === req.user?.userId) {
      return res.status(400).json({ success: false, message: 'নিজের অ্যাকাউন্ট disable করা যাবে না' });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING is_active',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    }

    const status = result.rows[0].is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়';
    res.json({ success: true, message: `ইউজার ${status} করা হয়েছে` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

export default router;