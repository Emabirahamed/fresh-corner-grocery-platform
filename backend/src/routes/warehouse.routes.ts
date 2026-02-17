import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// সব warehouses দেখুন
router.get('/', async (req: Request, res: Response) => {
  try {
    const warehouses = await pool.query(
      `SELECT w.*, 
        COUNT(wi.id) as product_count,
        SUM(wi.stock_quantity) as total_stock
       FROM warehouses w
       LEFT JOIN warehouse_inventory wi ON w.id = wi.warehouse_id
       WHERE w.is_active = true
       GROUP BY w.id
       ORDER BY w.id`
    );

    res.json({
      success: true,
      warehouses: warehouses.rows
    });
  } catch (error) {
    console.error('Warehouse Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

// একটি warehouse এর inventory
router.get('/:warehouseId/inventory', async (req: Request, res: Response) => {
  try {
    const { warehouseId } = req.params;

    const inventory = await pool.query(
      `SELECT wi.*, p.name_bn, p.name_en, p.price,
        CASE 
          WHEN wi.expiry_date <= NOW() THEN 'expired'
          WHEN wi.expiry_date <= NOW() + INTERVAL '3 days' THEN 'critical'
          WHEN wi.expiry_date <= NOW() + INTERVAL '7 days' THEN 'warning'
          ELSE 'good'
        END as expiry_status,
        EXTRACT(DAY FROM wi.expiry_date - NOW())::INTEGER as days_until_expiry
       FROM warehouse_inventory wi
       JOIN products p ON wi.product_id = p.id
       WHERE wi.warehouse_id = $1
       ORDER BY wi.expiry_date ASC NULLS LAST`,
      [warehouseId]
    );

    res.json({
      success: true,
      inventory: inventory.rows
    });
  } catch (error) {
    console.error('Inventory Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

// Stock update করুন
router.put('/:warehouseId/stock/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { warehouseId, productId } = req.params;
    const { quantity, type, notes } = req.body;
    const userId = req.user?.userId;

    // Current stock পান
    const current = await pool.query(
      'SELECT * FROM warehouse_inventory WHERE warehouse_id = $1 AND product_id = $2',
      [warehouseId, productId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'পণ্য পাওয়া যায়নি' });
    }

    const previousStock = current.rows[0].stock_quantity;
    let newStock = previousStock;

    if (type === 'add') {
      newStock = previousStock + quantity;
    } else if (type === 'remove') {
      newStock = Math.max(0, previousStock - quantity);
    } else if (type === 'set') {
      newStock = quantity;
    }

    // Inventory update করুন
    await pool.query(
      'UPDATE warehouse_inventory SET stock_quantity = $1, updated_at = NOW() WHERE warehouse_id = $2 AND product_id = $3',
      [newStock, warehouseId, productId]
    );

    // Products table ও update করুন
    await pool.query(
      'UPDATE products SET stock_quantity = $1 WHERE id = $2',
      [newStock, productId]
    );

    // Stock movement log করুন
    await pool.query(
      `INSERT INTO stock_movements 
        (warehouse_id, product_id, movement_type, quantity, previous_stock, new_stock, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [warehouseId, productId, type, quantity, previousStock, newStock, notes, userId]
    );

    res.json({
      success: true,
      message: 'স্টক আপডেট হয়েছে',
      previousStock,
      newStock
    });
  } catch (error) {
    console.error('Stock Update Error:', error);
    res.status(500).json({ success: false, message: 'স্টক আপডেট করতে সমস্যা হয়েছে' });
  }
});

// Expiry alerts দেখুন
router.get('/alerts/expiry', async (req: Request, res: Response) => {
  try {
    const alerts = await pool.query(
      `SELECT ea.*, p.name_bn, p.name_en, w.name as warehouse_name, w.name_bn as warehouse_name_bn
       FROM expiry_alerts ea
       JOIN products p ON ea.product_id = p.id
       JOIN warehouses w ON ea.warehouse_id = w.id
       WHERE ea.is_resolved = false
       ORDER BY ea.expiry_date ASC`
    );

    const critical = alerts.rows.filter(a => a.alert_type === 'critical');
    const warning = alerts.rows.filter(a => a.alert_type === 'warning');
    const info = alerts.rows.filter(a => a.alert_type === 'info');

    res.json({
      success: true,
      summary: {
        total: alerts.rows.length,
        critical: critical.length,
        warning: warning.length,
        info: info.length
      },
      alerts: alerts.rows
    });
  } catch (error) {
    console.error('Alerts Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

// Low stock alerts
router.get('/alerts/low-stock', async (req: Request, res: Response) => {
  try {
    const lowStock = await pool.query(
      `SELECT wi.*, p.name_bn, p.name_en, w.name as warehouse_name
       FROM warehouse_inventory wi
       JOIN products p ON wi.product_id = p.id
       JOIN warehouses w ON wi.warehouse_id = w.id
       WHERE wi.stock_quantity <= wi.min_stock_level
       ORDER BY wi.stock_quantity ASC`
    );

    res.json({
      success: true,
      count: lowStock.rows.length,
      items: lowStock.rows
    });
  } catch (error) {
    console.error('Low Stock Error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
});

export default router;
