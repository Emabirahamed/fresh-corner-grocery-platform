import { Router } from 'express';
import authRoutes from './auth.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import warehouseRoutes from './warehouse.routes';
import addressRoutes from './address.routes';
import productRoutes from './product.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import pool from '../config/database';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'ফ্রেশ কর্নার API',
    version: '2.0.0',
    status: 'সচল',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      search: '/api/products/search',
      cart: '/api/cart',
      orders: '/api/orders',
      warehouses: '/api/warehouses',
      addresses: '/api/addresses'
    }
  });
});

router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/addresses', addressRoutes);
router.use('/products', productRoutes);

// Categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.is_available = true
       GROUP BY c.id ORDER BY c.name_bn`
    );
    res.json({ success: true, categories: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
