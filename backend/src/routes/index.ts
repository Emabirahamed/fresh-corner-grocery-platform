import { Router } from 'express';
import authRoutes from './auth.routes';

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

// Test protected route
import { authMiddleware } from '../middlewares/auth.middleware';
router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
