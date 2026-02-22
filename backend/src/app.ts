import express, { Application, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ResponseHandler } from './utils/responses';
import { requestId } from './middleware/requestId';
import { sanitizeInput } from './middleware/sanitize';
import { prisma } from './config/database';

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Request ID tracking (must be first)
        this.app.use(requestId);

        // Security headers
        this.app.use(helmet());

        // Response compression (gzip/brotli)
        this.app.use(compression());

        // CORS
        this.app.use(
            cors({
                origin: config.cors.origin,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
            })
        );

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Cookie parser
        this.app.use(cookieParser());

        // XSS sanitization (after body parsing, before routes)
        this.app.use(sanitizeInput);

        // Global rate limiting
        const globalLimiter = rateLimit({
            windowMs: config.rateLimit.windowMs,
            max: config.rateLimit.maxRequests,
            message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests from this IP, please try again later.' } },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', globalLimiter);

        // Stricter rate limiting for auth endpoints (prevent brute force)
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 20, // 20 attempts per 15 min
            message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later.' } },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/auth/login', authLimiter);
        this.app.use('/api/auth/signup', authLimiter);

        // Stricter rate limiting for webhook endpoints
        const webhookLimiter = rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 30, // 30 per minute
            message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many webhook requests.' } },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/webhooks', webhookLimiter);

        // Request logging with request ID
        this.app.use((req, _res, next) => {
            const rid = (req as any).requestId;
            logger.info(`${req.method} ${req.path}`, {
                requestId: rid,
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });
            next();
        });
    }

    private initializeRoutes(): void {
        // Health check with database probe
        this.app.get('/health', async (_req, res: Response) => {
            let dbStatus = 'connected';
            try {
                await prisma.$queryRaw`SELECT 1`;
            } catch {
                dbStatus = 'disconnected';
            }

            const status = dbStatus === 'connected' ? 'healthy' : 'degraded';

            return ResponseHandler.success(res, {
                status,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: config.nodeEnv,
                database: dbStatus,
                version: '1.0.0',
            });
        });

        // API v1 routes
        this.app.use('/api/v1/auth', require('./routes/auth.routes').default);
        this.app.use('/api/v1/products', require('./routes/product.routes').default);
        this.app.use('/api/v1/admin', require('./routes/admin.routes').default);
        this.app.use('/api/v1/affiliates', require('./routes/affiliate.routes').default);
        this.app.use('/api/v1/coupons', require('./routes/coupon.routes').default);
        this.app.use('/api/v1/settings', require('./routes/settings.routes').default);
        this.app.use('/api/v1/webhooks', require('./routes/webhook.routes').default);
        this.app.use('/api/v1/orders', require('./routes/order.routes').default);

        // Backward-compatible routes (same as v1)
        this.app.use('/api/auth', require('./routes/auth.routes').default);
        this.app.use('/api/products', require('./routes/product.routes').default);
        this.app.use('/api/admin', require('./routes/admin.routes').default);
        this.app.use('/api/affiliates', require('./routes/affiliate.routes').default);
        this.app.use('/api/coupons', require('./routes/coupon.routes').default);
        this.app.use('/api/settings', require('./routes/settings.routes').default);
        this.app.use('/api/webhooks', require('./routes/webhook.routes').default);
        this.app.use('/api/orders', require('./routes/order.routes').default);

        // Serve uploaded files
        this.app.use('/uploads', express.static(config.upload.uploadDir));

        // Root route
        this.app.get('/', (_req, res: Response) => {
            return ResponseHandler.success(res, {
                name: 'T2 E-commerce Backend API',
                version: '1.0.0',
                status: 'running',
                endpoints: {
                    health: '/health',
                    auth: '/api/v1/auth',
                    products: '/api/v1/products',
                    admin: '/api/v1/admin',
                    affiliates: '/api/v1/affiliates',
                    coupons: '/api/v1/coupons',
                    settings: '/api/v1/settings',
                },
            });
        });
    }

    private initializeErrorHandling(): void {
        // 404 handler (must be after all routes)
        this.app.use(notFoundHandler);

        // Global error handler (must be last)
        this.app.use(errorHandler);
    }
}

export default new App().app;
