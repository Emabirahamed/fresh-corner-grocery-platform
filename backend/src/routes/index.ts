import { Router } from 'express';
import authRoutes from './auth.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import profileRoutes from './profile.routes';
import adminRoutes from './admin.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import pool from '../config/database';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'ফ্রেশ কর্নার API', version: '1.0.0', status: 'সচল' });
});

// Routes
router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);

// Products — fuzzy search, category/subcategory filter, price range, sort
router.get('/products', async (req, res) => {
  try {
    const { search, category_id, min_price, max_price, sort } = req.query;
    let query = `
      SELECT p.*, c.name_bn AS category_name,
             c.parent_id AS category_parent_id,
             parent.name_bn AS parent_category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE p.is_available = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += `
        AND (
          p.name_bn ILIKE $${paramIndex}
          OR p.name_en ILIKE $${paramIndex}
          OR similarity(p.name_bn, $${paramIndex + 1}) > 0.15
          OR similarity(p.name_en, $${paramIndex + 1}) > 0.15
        )
      `;
      params.push(`%${search}%`);
      params.push(search as string);
      paramIndex += 2;
    }

    if (category_id) {
      query += ` AND (p.category_id = $${paramIndex} OR c.parent_id = $${paramIndex})`;
      params.push(parseInt(category_id as string));
      paramIndex++;
    }

    if (min_price) {
      query += ` AND p.price >= $${paramIndex}`;
      params.push(parseFloat(min_price as string));
      paramIndex++;
    }
    if (max_price) {
      query += ` AND p.price <= $${paramIndex}`;
      params.push(parseFloat(max_price as string));
      paramIndex++;
    }

    if (search) {
      query += ` ORDER BY similarity(p.name_bn, '${(search as string).replace(/'/g, "''")}') DESC, p.name_bn ASC`;
    } else if (sort === 'price_asc') {
      query += ' ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY p.price DESC';
    } else if (sort === 'name') {
      query += ' ORDER BY p.name_bn ASC';
    } else {
      query += ' ORDER BY p.category_id ASC, p.id ASC';
    }

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, products: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Categories nested
router.get('/categories', async (req, res) => {
  try {
    const parents = await pool.query(
      'SELECT * FROM categories WHERE is_active = true AND parent_id IS NULL ORDER BY display_order'
    );
    const children = await pool.query(
      'SELECT * FROM categories WHERE is_active = true AND parent_id IS NOT NULL ORDER BY display_order'
    );
    const categoriesWithChildren = parents.rows.map(parent => ({
      ...parent,
      subcategories: children.rows.filter(child => child.parent_id === parent.id)
    }));
    res.json({ success: true, count: parents.rows.length, categories: categoriesWithChildren });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
