# 🛒 ফ্রেশ কর্নার - Grocery Delivery Platform

একটি সম্পূর্ণ গ্রোসারি ডেলিভারি প্ল্যাটফর্ম - Next.js, Node.js, PostgreSQL দিয়ে তৈরি।

## 🚀 Features

- 🛍️ Product catalog with categories
- 🛒 Shopping cart management
- 👤 User authentication (Phone OTP)
- 📍 Location-based delivery (PostGIS)
- 💳 Payment integration (bKash, SSL Commerz, COD)
- 📱 Responsive design
- 🗄️ PostgreSQL database (15 tables)
- ⚡ Redis caching

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + PostGIS
- Redis
- JWT Authentication

### Mobile (Future)
- Flutter (structure ready)

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis
- Git

## 🔧 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/fresh-corner-grocery-platform.git
cd fresh-corner-grocery-platform
```

### 2. Database Setup
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE grocery_db;
CREATE USER grocery_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE grocery_db TO grocery_user;
\q

# Load schema
psql -U grocery_user -d grocery_db -f database/schema/schema.sql
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend-web
npm install
cp .env.local.example .env.local
npm run dev
```

## 📚 Documentation

- **[📖 Complete Setup Guide](COMPLETE_STEP_BY_STEP_GUIDE.md)** - বিস্তারিত সেটআপ (বাংলা)
- **[⚡ Quick Start](QUICK_START.md)** - দ্রুত শুরু
- **[🔧 Troubleshooting](TROUBLESHOOTING.md)** - সমস্যা সমাধান
- **[📝 Cheatsheet](CHEATSHEET.md)** - দ্রুত রেফারেন্স
- **[ℹ️ Project Info](PROJECT_INFO.md)** - প্রজেক্ট তথ্য

## 🌐 API Endpoints

- `GET /api/products` - সব পণ্য
- `GET /api/categories` - সব ক্যাটাগরি
- `GET /api/test-db` - Database test
- `GET /health` - Server health check

## 📁 Project Structure
```
grocery-delivery-platform/
├── backend/              # Node.js API
├── frontend-web/         # Next.js Web App
├── mobile-app/           # Flutter App (structure)
├── database/             # SQL schemas & seeds
└── docs/                 # Documentation
```

## 🗄️ Database Schema

- 15 টেবিল
- PostGIS support (location-based features)
- Full schema in `database/schema/schema.sql`

## 👨‍💻 Development

### Backend
```bash
cd backend
npm run dev  # http://localhost:5000
```

### Frontend
```bash
cd frontend-web
npm run dev  # http://localhost:3000
```

## 🚢 Deployment

(Coming soon)

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📄 License

MIT License

## 👤 Author

Abir - [GitHub Profile](https://github.com/YOUR_USERNAME)

## 📞 Support

For issues, please use [GitHub Issues](https://github.com/YOUR_USERNAME/fresh-corner-grocery-platform/issues)

---

**Made with ❤️ in Bangladesh**
