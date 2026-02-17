import { Pool } from 'pg';

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'grocery_db',
        user: process.env.DB_USER || 'grocery_user',
        password: process.env.DB_PASSWORD || 'Pass1234',
      }
);

pool.on('connect', () => {
  console.log('✅ PostgreSQL Database Connected');
});

pool.on('error', (err: Error) => {
  console.error('❌ PostgreSQL Error:', err.message);
});

export default pool;
