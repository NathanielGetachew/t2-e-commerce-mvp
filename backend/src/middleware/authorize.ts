import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ResponseHandler } from '../utils/responses';

/**
 * Role-based Authorization Middleware
 * Checks if authenticated user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void | Response => {
        if (!req.user) {
            return ResponseHandler.unauthorized(res, 'Authentication required');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return ResponseHandler.forbidden(
                res,
                'You do not have permission to access this resource'
            );
        }

        next();
    };
};

/**
 * Admin-only authorization
 */
export const adminOnly = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Super Admin-only authorization
 */
export const superAdminOnly = authorize(UserRole.SUPER_ADMIN);
