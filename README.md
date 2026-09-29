# 🍔 VGI Canteen — Backend API & Realtime Server

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_DB-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Render](https://img.shields.io/badge/Deploy-Render-black?logo=render&logoColor=white)](https://render.com/)

> Production-ready RESTful API and WebSocket real-time server for the **Vishveshwarya Group of Institutions (VGI)** Campus Canteen platform. Built with **Express.js**, **Prisma ORM**, **Neon Serverless PostgreSQL**, **Socket.io**, and **Razorpay**.

---

## 🌟 Key Features

- **⚡ Real-time Order Broadcasting (Socket.IO)**:
  - Instant notifications to student rooms when orders transition (`PLACED` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`).
  - High-priority kitchen counter broadcast for newly paid orders.
- **🗄️ PostgreSQL Database with Prisma ORM**:
  - Structured schema supporting items, categories, option groups, coupons, orders, and ratings.
  - Connection pooling with Neon Serverless Postgres.
- **🔐 Multi-Role Authentication**:
  - Role-based authorization (`STUDENT`, `STAFF`, `ADMIN`).
  - Dual support: Clerk customer token synchronization + JWT authentication for admin staff.
- **💳 Payment Processing (Razorpay)**:
  - Secure order creation, payment signature verification, and webhook handling.
  - Built-in transparent **Dev Sandbox Simulator** fallback for zero-setup local testing.
- **📷 Cloud Media Uploads**:
  - Cloudinary v2 integration with Multer for menu item photos.
- **📊 Business Intelligence & Reports**:
  - Daily/weekly revenue aggregation, top-selling items, and counter throughput statistics.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| --- | --- |
| **Node.js (ES Modules)** | Fast, event-driven runtime environment |
| **Express.js 4** | Modular RESTful routing framework |
| **Prisma ORM 6** | Type-safe database queries, migrations, and schema management |
| **PostgreSQL (Neon DB)** | Serverless cloud relational database |
| **Socket.io 4** | Bidirectional real-time event communication |
| **Razorpay SDK** | Official Node.js SDK for payment intents and signature validation |
| **Bcrypt.js & JWT** | Password hashing and secure token generation |
| **Cloudinary & Multer** | Cloud photo asset hosting and multipart form parsing |

---

## 📂 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma         # Prisma data models & relational schema
│   └── seed.js               # Campus menu categories, food items, coupons & admin seed
├── src/
│   ├── config/
│   │   ├── cloudinary.js     # Cloudinary SDK configuration
│   │   ├── db.js             # Prisma client instance with error handling
│   │   ├── dbFallback.js     # In-memory mock fallback for offline resilience
│   │   ├── menuData.js       # Default canteen food catalog data
│   │   └── razorpay.js       # Razorpay instance & dev mode detection
│   ├── controllers/
│   │   ├── adminOrderController.js   # Kitchen queue, status changes, order completion
│   │   ├── authController.js         # Register, login, Clerk user sync, profile
│   │   ├── canteenController.js      # Opening hours, counter settings, announcements
│   │   ├── couponController.js       # Promo validation, create, update, delete
│   │   ├── menuController.js         # Menu catalog, categories, search, stock toggle
│   │   ├── notificationController.js # User notifications & alerts
│   │   ├── orderController.js        # Customer order creation, history, tracking
│   │   ├── paymentController.js      # Razorpay payment verification & webhooks
│   │   └── reportsController.js      # Sales analytics, revenue & category breakdown
│   ├── middlewares/
│   │   ├── authMiddleware.js         # JWT verification & role guard (authenticate/requireAdmin)
│   │   └── errorHandler.js           # 404 handler and global exception catcher
│   ├── routes/
│   │   ├── adminRoutes.js        # /api/admin - Kitchen management & analytics
│   │   ├── authRoutes.js         # /api/auth - Login, registration & sync
│   │   ├── canteenRoutes.js      # /api/canteen - Canteen operational state
│   │   ├── couponRoutes.js       # /api/coupons - Coupon validation & admin tools
│   │   ├── menuRoutes.js         # /api/menu - Public catalog & menu operations
│   │   ├── notificationRoutes.js # /api/notifications - User notification feed
│   │   ├── orderRoutes.js        # /api/orders - Customer order management
│   │   ├── paymentRoutes.js      # /api/payments - Razorpay verification
│   │   └── uploadRoutes.js       # /api/upload - Cloudinary image upload
│   ├── app.js                # Express app setup, CORS, and health check routes
│   └── server.js             # HTTP server bootstrap & Socket.io initialization
├── .env.example              # Environment variables template
├── render.yaml               # Render Blueprint deployment configuration
└── package.json              # Scripts and dependencies
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js** (v18 or newer)
- **PostgreSQL Database** (e.g. free instance on [Neon DB](https://neon.tech))

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/nikhil007-git/Vgi-canteen-backend.git
cd Vgi-canteen-backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development

# Allowed frontend origin for CORS
FRONTEND_URL=http://localhost:5173

# Neon PostgreSQL Database Connection Strings
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

# JWT Secret for Session Signing
JWT_SECRET=super_secret_jwt_key_for_vgi_canteen_2026

# Clerk Authentication (Optional for local test)
CLERK_PUBLISHABLE_KEY=pk_test_placeholder
CLERK_SECRET_KEY=sk_test_placeholder

# Razorpay Credentials (Leave placeholders to auto-enable Dev Simulator)
RAZORPAY_KEY_ID=rzp_test_placeholder_key
RAZORPAY_KEY_SECRET=rzp_test_placeholder_secret
RAZORPAY_TEST_MODE=true

# Initial Admin Credentials (Created by seed script)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@vgi.ac.in
ADMIN_PASSWORD=SuperAdmin@123
```

### 3. Initialize Database & Seed
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema directly to Neon DB
npm run prisma:push

# Seed default canteen menu, coupons, and admin account
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
The server will start listening at [http://localhost:5000](http://localhost:5000).

---

## 📡 Core API Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Cloud health check / uptime ping |
| `POST` | `/api/auth/login` | Public | Student & staff email/password authentication |
| `POST` | `/api/auth/sync-clerk` | Public | Synchronize Clerk user identity with database |
| `GET` | `/api/menu` | Public | Get active categories & food items |
| `POST` | `/api/coupons/validate` | Public | Validate promo code against current cart |
| `POST` | `/api/orders` | Customer | Place order & initiate Razorpay payment intent |
| `POST` | `/api/payments/verify` | Customer | Verify Razorpay HMAC signature & confirm order |
| `GET` | `/api/orders/:id` | Customer | Get single order status & counter token |
| `GET` | `/api/admin/orders` | Staff / Admin | Live kitchen queue of active orders |
| `PATCH` | `/api/admin/orders/:id/status`| Staff / Admin | Advance order status (`PREPARING` ➔ `READY`) |
| `POST` | `/api/admin/orders/scan` | Staff / Admin | Verify & complete order by QR code token |
| `GET` | `/api/admin/reports` | Admin | Aggregate sales revenue and analytics |

---

## 🚀 Deploying on Render

### Method 1: Using the Included Blueprint (`render.yaml`)
1. In the [Render Dashboard](https://dashboard.render.com/), click **New + > Blueprint**.
2. Connect your **`Vgi-canteen-backend`** repository.
3. Render will read `render.yaml` and configure the service automatically.
4. Fill in `DATABASE_URL` and `DIRECT_URL` with your Neon DB connection strings.
5. Click **Apply**.

### Method 2: Manual Web Service
1. In the Render Dashboard, click **New + > Web Service**.
2. Connect your **`Vgi-canteen-backend`** repository.
3. Configure Settings:
   - **Environment**: `Node`
   - **Region**: Oregon or nearest to your Neon DB region
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Add **Environment Variables** (from `backend/.env.example`).
5. Click **Create Web Service**.

Once deployed, copy your Render Web Service URL (e.g. `https://vgi-canteen-backend.onrender.com`) and paste it as `VITE_API_URL` in your Vercel frontend.

---

## 🔗 Related Repositories

- **Frontend Client Application**: [Vgi-canteen-frontend](https://github.com/nikhil007-git/Vgi-canteen-frontend)
