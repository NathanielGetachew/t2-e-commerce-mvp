import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ResponseHandler } from '../utils/responses';

/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    // Log error
    logger.error('Error occurred:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        return ResponseHandler.error(res, 'Database operation failed', 400);
    }

    if (err.name === 'PrismaClientValidationError') {
        return ResponseHandler.error(res, 'Invalid database query', 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return ResponseHandler.unauthorized(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return ResponseHandler.unauthorized(res, 'Token expired');
    }

    // Multer errors (file upload)
    if (err.name === 'MulterError') {
        return ResponseHandler.error(res, `File upload error: ${err.message}`, 400);
    }

    // Default to 500 server error
    return ResponseHandler.serverError(
        res,
        process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message
    );
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response): Response => {
    return ResponseHandler.notFound(res, `Route ${req.method} ${req.path} not found`);
};
