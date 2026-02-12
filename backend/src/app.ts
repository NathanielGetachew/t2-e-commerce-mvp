import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ResponseHandler } from './utils/responses';

// Import routes (will be created next)
// import authRoutes from './routes/auth.routes';
// import adminRoutes from './routes/admin.routes';
// import productsRoutes from './routes/products.routes';
// import affiliatesRoutes from './routes/affiliates.routes';
// import couponsRoutes from './routes/coupons.routes';

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security
        this.app.use(helmet());

        // CORS
        this.app.use(
            cors({
                origin: config.cors.origin,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            })
        );

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Cookie parser
        this.app.use(cookieParser());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: config.rateLimit.windowMs,
            max: config.rateLimit.maxRequests,
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', limiter);

        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });
            next();
        });
    }

    private initializeRoutes(): void {
        // Health check endpoint
        this.app.get('/health', (req: Request, res: Response) => {
            return ResponseHandler.success(res, {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: config.nodeEnv,
            });
        });

        // API routes
        this.app.use('/api/auth', require('./routes/auth.routes').default);
        // this.app.use('/api/admin', adminRoutes);
        // this.app.use('/api/products', productsRoutes);
        // this.app.use('/api/affiliates', affiliatesRoutes);
        // this.app.use('/api/coupons', couponsRoutes);

        // Root route
        this.app.get('/', (req: Request, res: Response) => {
            return ResponseHandler.success(res, {
                name: 'T2 E-commerce Backend API',
                version: '1.0.0',
                status: 'running',
                documentation: '/api-docs',
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
