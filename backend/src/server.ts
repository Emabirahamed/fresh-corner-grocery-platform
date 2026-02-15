import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import routes from './routes/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'সার্ভার সচল আছে',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`🚀 সার্ভার চালু হয়েছে পোর্টে: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
});
