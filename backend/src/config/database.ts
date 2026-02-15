import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'grocery_db',
  user: 'grocery_user',
  password: 'Pass1234',
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL Database Connected');
});

pool.on('error', (err: Error) => {
  console.error('❌ PostgreSQL Error:', err.message);
});

export default pool;
