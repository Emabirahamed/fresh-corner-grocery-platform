import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ─── Profile পেতে ───────────────────────────────────────────
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT id, phone, email, full_name, profile_picture, role,
              is_verified, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    }

    // অর্ডার সংখ্যা
    const orderCount = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      user: {
        ...result.rows[0],
        total_orders: parseInt(orderCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ success: false, message: 'প্রোফাইল লোড করতে সমস্যা হয়েছে' });
  }
});

// ─── Profile আপডেট ──────────────────────────────────────────
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { full_name, email } = req.body;

    if (!full_name) {
      return res.status(400).json({ success: false, message: 'নাম দিন' });
    }

    // Email unique চেক
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'এই ইমেইল ইতিমধ্যে ব্যবহৃত' });
      }
    }

    const result = await pool.query(
      `UPDATE users SET full_name = $1, email = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, phone, email, full_name, role`,
      [full_name, email || null, userId]
    );

    res.json({
      success: true,
      message: 'প্রোফাইল আপডেট হয়েছে',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে' });
  }
});

// ─── সব ঠিকানা দেখো ─────────────────────────────────────────
router.get('/addresses', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    res.json({ success: true, addresses: result.rows });

  } catch (error) {
    console.error('Addresses Error:', error);
    res.status(500).json({ success: false, message: 'ঠিকানা লোড করতে সমস্যা হয়েছে' });
  }
});

// ─── নতুন ঠিকানা যোগ ────────────────────────────────────────
router.post('/addresses', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { label, full_address, area, city, is_default } = req.body;

    if (!full_address) {
      return res.status(400).json({ success: false, message: 'ঠিকানা লিখুন' });
    }

    // নতুন ঠিকানা default হলে আগেরটা থেকে default সরাও
    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    // প্রথম ঠিকানা হলে auto default
    const existingCount = await pool.query(
      'SELECT COUNT(*) FROM addresses WHERE user_id = $1',
      [userId]
    );
    const autoDefault = parseInt(existingCount.rows[0].count) === 0 ? true : (is_default || false);

    const result = await pool.query(
      `INSERT INTO addresses (user_id, label, full_address, area, city, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, label || 'বাড়ি', full_address, area || '', city || 'Dhaka', autoDefault]
    );

    res.json({
      success: true,
      message: 'ঠিকানা যোগ হয়েছে',
      address: result.rows[0]
    });

  } catch (error) {
    console.error('Add Address Error:', error);
    res.status(500).json({ success: false, message: 'ঠিকানা যোগ করতে সমস্যা হয়েছে' });
  }
});

// ─── ঠিকানা আপডেট ───────────────────────────────────────────
router.put('/addresses/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { label, full_address, area, city, is_default } = req.body;

    // নিজের ঠিকানা কিনা চেক
    const check = await pool.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ঠিকানা পাওয়া যায়নি' });
    }

    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await pool.query(
      `UPDATE addresses SET label=$1, full_address=$2, area=$3, city=$4, is_default=$5, updated_at=NOW()
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [label, full_address, area, city, is_default || false, id, userId]
    );

    res.json({ success: true, message: 'ঠিকানা আপডেট হয়েছে', address: result.rows[0] });

  } catch (error) {
    console.error('Update Address Error:', error);
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে' });
  }
});

// ─── ঠিকানা মুছুন ───────────────────────────────────────────
router.delete('/addresses/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ঠিকানা পাওয়া যায়নি' });
    }

    // মুছে ফেলা ঠিকানা default ছিল? তাহলে নতুন একটাকে default বানাও
    if (result.rows[0].is_default) {
      await pool.query(
        `UPDATE addresses SET is_default = true 
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
    }

    res.json({ success: true, message: 'ঠিকানা মুছে গেছে' });

  } catch (error) {
    console.error('Delete Address Error:', error);
    res.status(500).json({ success: false, message: 'মুছতে সমস্যা হয়েছে' });
  }
});

// ─── Default ঠিকানা সেট ─────────────────────────────────────
router.patch('/addresses/:id/default', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    await pool.query(
      'UPDATE addresses SET is_default = false WHERE user_id = $1',
      [userId]
    );

    await pool.query(
      'UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true, message: 'ডিফল্ট ঠিকানা সেট হয়েছে' });

  } catch (error) {
    console.error('Default Address Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

export default router;
