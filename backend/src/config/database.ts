import { Pool } from 'pg';

// ── Connection Pool তৈরি ──────────────────────────────────────
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
        // Pool settings
        max: 20,                  // সর্বোচ্চ connection সংখ্যা
        idleTimeoutMillis: 30000, // idle connection কতক্ষণ রাখা হবে
        connectionTimeoutMillis: 2000,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || 'grocery_db',
        user:     process.env.DB_USER     || 'grocery_user',
        // FIX: production-এ hardcoded password নয়, .env থেকে নিতে হবে
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// ── DB Connect হলে log ────────────────────────────────────────
pool.on('connect', () => {
  console.log('✅ PostgreSQL Database Connected');
});

// ── DB Error হলে log ──────────────────────────────────────────
pool.on('error', (err: Error) => {
  console.error('❌ PostgreSQL Error:', err.message);
  // Production-এ process kill না করে error handle করা ভালো
});

// ── Connection test ───────────────────────────────────────────
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection test passed');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

export default pool;