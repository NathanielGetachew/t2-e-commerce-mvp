import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../utils/jwt';
import { ResponseHandler } from '../utils/responses';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Authentication Middleware
 * Verifies JWT token from cookie or Authorization header
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void | Response => {
    try {
        // Try to get token from cookie first, then Authorization header
        let token = req.cookies?.auth_token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return ResponseHandler.unauthorized(res, 'No authentication token provided');
        }

        // Verify token
        const decoded = JWTService.verify(token);
        req.user = decoded;

        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        return ResponseHandler.unauthorized(res, 'Invalid or expired token');
    }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        let token = req.cookies?.auth_token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (token) {
            const decoded = JWTService.verify(token);
            req.user = decoded;
        }
    } catch (error) {
        // Silent fail - user is just not authenticated
        logger.debug('Optional auth failed:', error);
    }

    next();
};
