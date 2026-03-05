# T2 E-Commerce MVP

A production-ready, full-stack E-commerce platform built with a strictly decoupled architecture, featuring a modern **Next.js** frontend and a robust **Node.js/Express** backend.

## 🌟 Key Features

### 🛍️ Customer Experience
- **Product Catalog & Details**: Browse products, view high-quality images, and explore detailed product configurations.
- **Dynamic Pricing**: Support for single retail pricing and wholesale bulk pricing tiers.
- **Cart & Checkout**: Fluid shopping cart experience powered by Zustand, with secure Stripe payments integration.
- **Ambassador Program**: Specialized affiliate and ambassador referral links, customizable discount coupons, and earnings tracking.

### 🛡️ Secure Authentication
- **Full Auth Flow**: Custom signup, login, password reset, and rigorous email verification logic implemented without third-party auth lock-in.
- **Enhanced Security**: JWT-based HTTP-only cookies, robust rate limiting, Helmet HTTP headers, CORS configurations, password hashing, and brute-force protection.
- **Role-based Access**: Separates privileges among `CUSTOMER`, `ADMIN`, and `SUPER_ADMIN`.

### 💼 Admin Dashboard
- **Analytics & Tracking**: Real-time sales, order statuses, and affiliate performance metrics.
- **Inventory Management**: Full CRUD operations for categories, products, images, and inventory stock.
- **User & Order Management**: Control user roles, fulfill orders via tracked phases (Production -> Fulfillment -> Shipping), and manage the ambassador approval queue.

---

## 🏗️ Architecture

The project is natively divided into two completely independent packages located in this repository's root:

- `/frontend`: The UI layer (Next.js, React, Tailwind CSS, Radix UI).
- `/backend`: The API and Database layer (Node.js, Express, Prisma, PostgreSQL).

They communicate strictly over an encrypted REST API, meaning they are built to be **deployed independently**.

---

## 🚀 Getting Started

To get the platform running locally, you must run both the backend API and the frontend client.

### 1. Initialize the Backend
The backend handles the core logic and interfaces with the PostgreSQL database.

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and supply your DATABASE_URL, JWT_SECRET, CORS_ORIGIN, etc.

# Initialize the database
npm run prisma:generate
npm run prisma:push

# Optionally seed the database or create a super admin
npm run seed:admin

# Start the development server
npm run dev
```

The backend API will start on `http://localhost:8080`.

### 2. Initialize the Frontend
The frontend consumes the API and serves the rich graphical interface.

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Provide NEXT_PUBLIC_API_URL pointing to the Backend (e.g., http://localhost:8080/api) 
cp .env.example .env.local

# Start the development server
npm run dev
```

The frontend application will start on `http://localhost:3000`.

---

## 📦 Deployment Strategy

Because the architecture has been strictly separated without code overlap, deploying is simple and scalable.

### Backend Deployment
Deploy the `backend/` directory to a Node.js-compatible containerized hosting platform (e.g., [Render](https://render.com), [Railway](https://railway.app), AWS, or Heroku).
- Ensure your host runs `npm install`, then builds `npm run build`, and finally `npm start`.
- Run migrations (`npm run prisma:migrate`) during your build step or CI/CD pipeline.
- Supply `.env` variables natively in your host's dashboard. (DO NOT commit `.env` files).

### Frontend Deployment
Deploy the `frontend/` directory directly to edge platforms natively suited to server-side rendering (e.g., [Vercel](https://vercel.com) or [Netlify](https://netlify.com)).
- Set the root directory in the deployment settings to `frontend/`.
- Supply `.env` variables in your host's dashboard.

---

## 📚 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Framer Motion
- **Components**: Radix UI (shadcn/ui equivalents)
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth & Security**: JWT Authentication, bcryptjs, Helmet, Express Rate Limiting
- **Email Delivery**: Nodemailer 
