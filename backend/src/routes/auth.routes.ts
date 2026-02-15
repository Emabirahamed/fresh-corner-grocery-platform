import { Router } from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { generateOTP, otpExpiry, sendOTP } from '../utils/otp';
import jwt from 'jsonwebtoken';

const router = Router();

// Register / Request OTP
router.post('/request-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.length < 11) {
      return res.status(400).json({
        success: false,
        message: 'সঠিক ফোন নম্বর দিন'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = otpExpiry();

    // Save OTP to database
    await pool.query(
      `INSERT INTO otp_verifications (phone, otp_code, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [phone, otp, 'login', expiresAt]
    );

    // Send OTP via SMS
    await sendOTP(phone, otp);

    res.json({
      success: true,
      message: 'OTP পাঠানো হয়েছে',
      expiresIn: 300 // 5 minutes in seconds
    });

  } catch (error) {
    console.error('OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP পাঠাতে সমস্যা হয়েছে'
    });
  }
});

// Verify OTP & Login
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'ফোন নম্বর ও OTP প্রয়োজন'
      });
    }

    // Check OTP
    const otpResult = await pool.query(
      `SELECT * FROM otp_verifications 
       WHERE phone = $1 AND otp_code = $2 
       AND is_used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'OTP ভুল বা মেয়াদ শেষ হয়ে গেছে'
      });
    }

    // Mark OTP as used
    await pool.query(
      'UPDATE otp_verifications SET is_used = true WHERE id = $1',
      [otpResult.rows[0].id]
    );

    // Check if user exists
    let userResult = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create new user
      const newUser = await pool.query(
        `INSERT INTO users (phone, phone_verified, is_verified, is_active)
         VALUES ($1, true, true, true) RETURNING *`,
        [phone]
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
      // Update last login
      await pool.query(
        'UPDATE users SET last_login = NOW(), phone_verified = true WHERE id = $1',
        [user.id]
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'লগইন সফল হয়েছে',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Verify Error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP যাচাই করতে সমস্যা হয়েছে'
    });
  }
});

export default router;
