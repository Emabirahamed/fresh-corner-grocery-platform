import { Router } from 'express';
import authRoutes from './auth.routes';
import cartRoutes from './cart.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import pool from '../config/database';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'ফ্রেশ কর্নার API',
    version: '1.0.0',
    status: 'সচল'
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Cart routes (protected)
router.use('/cart', cartRoutes);

// Products route
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products LIMIT 20');
    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Categories route
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json({
      success: true,
      count: result.rows.length,
      categories: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test protected route
router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
