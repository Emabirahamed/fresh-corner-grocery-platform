import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// সব addresses দেখুন
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const addresses = await pool.query(
      `SELECT * FROM user_addresses 
       WHERE user_id = $1 AND is_active = true
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      addresses: addresses.rows
    });
  } catch (error) {
    console.error('Address Error:', error);
    res.status(500).json({ success: false, message: 'ঠিকানা লোড করতে সমস্যা হয়েছে' });
  }
});

// নতুন address যোগ করুন
router.post('/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      label, label_custom, recipient_name, phone,
      address_line1, address_line2, floor_number,
      apartment_number, landmark, area, thana,
      district, latitude, longitude, google_place_id
    } = req.body;

    if (!recipient_name || !phone || !address_line1) {
      return res.status(400).json({
        success: false,
        message: 'নাম, ফোন এবং ঠিকানা আবশ্যক'
      });
    }

    // যদি default হিসেবে mark করা হয়, বাকিগুলো unset করুন
    if (req.body.is_default) {
      await pool.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    // প্রথম address হলে automatically default
    const existingCount = await pool.query(
      'SELECT COUNT(*) FROM user_addresses WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const isDefault = parseInt(existingCount.rows[0].count) === 0 || req.body.is_default;

    const address = await pool.query(
      `INSERT INTO user_addresses (
        user_id, label, label_custom, recipient_name, phone,
        address_line1, address_line2, floor_number, apartment_number,
        landmark, area, thana, district, latitude, longitude,
        google_place_id, is_default
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        userId, label || 'home', label_custom, recipient_name, phone,
        address_line1, address_line2, floor_number, apartment_number,
        landmark, area, thana, district || 'Dhaka', latitude, longitude,
        google_place_id, isDefault
      ]
    );

    res.json({
      success: true,
      message: 'ঠিকানা যোগ করা হয়েছে',
      address: address.rows[0]
    });
  } catch (error) {
    console.error('Add Address Error:', error);
    res.status(500).json({ success: false, message: 'ঠিকানা যোগ করতে সমস্যা হয়েছে' });
  }
});

// Address update করুন
router.put('/:addressId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { addressId } = req.params;
    const {
      label, label_custom, recipient_name, phone,
      address_line1, address_line2, floor_number,
      apartment_number, landmark, area, thana, district,
      latitude, longitude, is_default
    } = req.body;

    if (is_default) {
      await pool.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    await pool.query(
      `UPDATE user_addresses SET
        label=$1, label_custom=$2, recipient_name=$3, phone=$4,
        address_line1=$5, address_line2=$6, floor_number=$7,
        apartment_number=$8, landmark=$9, area=$10, thana=$11,
        district=$12, latitude=$13, longitude=$14, is_default=$15
       WHERE id=$16 AND user_id=$17`,
      [
        label, label_custom, recipient_name, phone,
        address_line1, address_line2, floor_number,
        apartment_number, landmark, area, thana,
        district, latitude, longitude, is_default || false,
        addressId, userId
      ]
    );

    res.json({ success: true, message: 'ঠিকানা আপডেট হয়েছে' });
  } catch (error) {
    console.error('Update Address Error:', error);
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে' });
  }
});

// Address delete করুন
router.delete('/:addressId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { addressId } = req.params;

    await pool.query(
      'UPDATE user_addresses SET is_active = false WHERE id = $1 AND user_id = $2',
      [addressId, userId]
    );

    res.json({ success: true, message: 'ঠিকানা মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('Delete Address Error:', error);
    res.status(500).json({ success: false, message: 'মুছতে সমস্যা হয়েছে' });
  }
});

// Default address set করুন
router.put('/:addressId/set-default', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { addressId } = req.params;

    await pool.query(
      'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
      [userId]
    );

    await pool.query(
      'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2',
      [addressId, userId]
    );

    res.json({ success: true, message: 'ডিফল্ট ঠিকানা সেট করা হয়েছে' });
  } catch (error) {
    console.error('Set Default Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

export default router;
