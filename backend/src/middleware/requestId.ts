import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Request ID Middleware
 * Adds a unique request ID to every request for distributed tracing.
 * The ID is:
 *   - Generated as a UUID v4
 *   - Attached to req.id
 *   - Returned in X-Request-Id response header
 *   - Available in logs for tracing
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
    // Accept client-provided request ID or generate a new one
    const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();

    // Attach to request object
    (req as any).requestId = id;

    // Set response header
    res.setHeader('X-Request-Id', id);

    next();
};
