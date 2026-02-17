import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  phone: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    // ── Bearer token আছে কিনা চেক ──────────────────────────
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'লগইন করুন — Authorization header নেই'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'টোকেন পাওয়া যায়নি'
      });
    }

    // ── JWT_SECRET অবশ্যই .env-এ থাকতে হবে ─────────────────
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET environment variable সেট করা নেই!');
      return res.status(500).json({
        success: false,
        message: 'সার্ভার কনফিগারেশন সমস্যা'
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // ── Payload ঠিক আছে কিনা যাচাই ──────────────────────────
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'টোকেন অবৈধ'
      });
    }

    req.user = decoded;
    next();

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'টোকেনের মেয়াদ শেষ — আবার লগইন করুন'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'টোকেন অবৈধ'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'অনুমতি নেই'
    });
  }
};

// ── Admin-only middleware (JWT role থেকে — DB call ছাড়াই) ───
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'লগইন করুন' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'অ্যাডমিন অ্যাক্সেস প্রয়োজন'
    });
  }

  next();
};