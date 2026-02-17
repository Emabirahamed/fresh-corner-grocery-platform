import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Search & Filter Products
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q,           // search query
      category,    // category id
      min_price,   // minimum price
      max_price,   // maximum price
      sort,        // price_asc, price_desc, newest, popular
      in_stock,    // true/false
      page = '1',
      limit = '12'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const conditions: string[] = ['p.is_available = true'];
    const params: any[] = [];
    let paramCount = 1;

    // Search by name
    if (q) {
      conditions.push(
        `(p.name_bn ILIKE $${paramCount} OR p.name_en ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`
      );
      params.push(`%${q}%`);
      paramCount++;
    }

    // Filter by category
    if (category) {
      conditions.push(`p.category_id = $${paramCount}`);
      params.push(parseInt(category as string));
      paramCount++;
    }

    // Filter by price range
    if (min_price) {
      conditions.push(`p.price >= $${paramCount}`);
      params.push(parseFloat(min_price as string));
      paramCount++;
    }

    if (max_price) {
      conditions.push(`p.price <= $${paramCount}`);
      params.push(parseFloat(max_price as string));
      paramCount++;
    }

    // Filter by stock
    if (in_stock === 'true') {
      conditions.push(`p.stock_quantity > 0`);
    }

    // Sort options
    let orderBy = 'p.created_at DESC';
    switch (sort) {
      case 'price_asc': orderBy = 'p.price ASC'; break;
      case 'price_desc': orderBy = 'p.price DESC'; break;
      case 'newest': orderBy = 'p.created_at DESC'; break;
      case 'name_asc': orderBy = 'p.name_bn ASC'; break;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get products
    const products = await pool.query(
      `SELECT p.*, c.name_bn as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    res.json({
      success: true,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
      products: products.rows
    });

  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ success: false, message: 'সার্চ করতে সমস্যা হয়েছে' });
  }
});

// Get single product
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const product = await pool.query(
      `SELECT p.*, c.name_bn as category_name, c.name_en as category_name_en
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.is_available = true`,
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'পণ্য পাওয়া যায়নি'
      });
    }

    res.json({
      success: true,
      product: product.rows[0]
    });

  } catch (error) {
    console.error('Product Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

// Get all categories with product count
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const categories = await pool.query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.is_available = true
       GROUP BY c.id
       ORDER BY c.name_bn`
    );

    res.json({
      success: true,
      categories: categories.rows
    });

  } catch (error) {
    console.error('Categories Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

// Get price range
router.get('/price/range', async (req: Request, res: Response) => {
  try {
    const range = await pool.query(
      `SELECT MIN(price) as min_price, MAX(price) as max_price
       FROM products WHERE is_available = true`
    );

    res.json({
      success: true,
      minPrice: parseFloat(range.rows[0].min_price) || 0,
      maxPrice: parseFloat(range.rows[0].max_price) || 1000
    });

  } catch (error) {
    console.error('Price Range Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

export default router;
