import { Router } from 'express';
import authRoutes from './auth.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import warehouseRoutes from './warehouse.routes';
import addressRoutes from './address.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import pool from '../config/database';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'ফ্রেশ কর্নার API',
    version: '2.0.0',
    status: 'সচল',
    features: ['auth', 'cart', 'orders', 'warehouse', 'address']
  });
});

router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/addresses', addressRoutes);

router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE is_available = true ORDER BY id LIMIT 20'
    );
    res.json({ success: true, count: result.rows.length, products: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json({ success: true, count: result.rows.length, categories: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
