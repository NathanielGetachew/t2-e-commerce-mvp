# T2 E-commerce Backend API

Production-grade Node.js/Express backend for T2 E-commerce platform.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL database
- npm or yarn

### Installation

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A strong secret key for JWT tokens
- `CORS_ORIGIN`: Your frontend URL (default: http://localhost:3000)

4. **Set up database**
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (for development)
npm run prisma:push

# Or run migrations (for production)
npm run prisma:migrate
```

5. **Start development server**
```bash
npm run dev
```

The API will be running at `http://localhost:8080`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── env.ts        # Environment variables
│   │   └── database.ts   # Prisma client setup
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── authorize.ts  # Role-based authorization
│   │   ├── validation.ts # Request validation
│   │   └── errorHandler.ts # Global error handling
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   │   ├── logger.ts     # Winston logger
│   │   ├── jwt.ts        # JWT utilities
│   │   └── responses.ts  # Standard API responses
│   ├── app.ts            # Express app setup
│   └── index.ts          # Server entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── logs/                 # Application logs
├── .env                  # Environment variables (not committed)
├── .env.example          # Environment template
├── package.json
└── tsconfig.json
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run prisma:generate # Generate Prisma Client
npm run prisma:push  # Push schema to database
npm run prisma:migrate # Run database migrations
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🔐 Authentication

The API uses JWT-based authentication with HTTP-only cookies.

### Login Flow
1. User sends credentials to `/api/auth/login`
2. Server validates and returns JWT in HTTP-only cookie
3. Client includes cookie in subsequent requests
4. Server verifies JWT via `authenticate` middleware

### Protected Routes
Use middleware to protect routes:
```typescript
router.get('/profile', authenticate, getProfile)
router.post('/admin/users', authenticate, adminOnly, createUser)
```

## 🛣️ API Routes

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

_More routes will be documented as they're implemented_

## 🔒 Security Features

- ✅ Helmet.js (HTTP headers security)
- ✅ CORS with credentials support
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ JWT with HTTP-only cookies
- ✅ Input validation with Zod
- ✅ Request logging
- ✅ Error sanitization in production

## 📝 Logging

Logs are stored in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

Console logging enabled in development mode.

## 🧪 Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

## 🐳 Docker (Coming Soon)

Docker configuration will be added for easy deployment.

## 📚 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 🤝 Contributing

This is part of the T2 E-commerce project. See main project README for contribution guidelines.

## 📄 License

MIT
