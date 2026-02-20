import xss from 'xss';
import { Request, Response, NextFunction } from 'express';

/**
 * XSS Sanitization Middleware
 * Recursively sanitizes all string values in req.body to prevent
 * stored XSS attacks. Runs AFTER body parsing, BEFORE validation.
 */
const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
        return xss(value);
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === 'object') {
        const sanitized: Record<string, any> = {};
        for (const key of Object.keys(value)) {
            sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
    }
    return value;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        for (const key of Object.keys(req.query)) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = xss(req.query[key] as string);
            }
        }
    }
    next();
};
