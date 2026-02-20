import { Response } from 'express';

/**
 * Structured Error Codes
 * Machine-readable error identifiers for frontend/API consumers.
 */
export enum ErrorCode {
    // Auth errors
    AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
    AUTH_DUPLICATE_EMAIL = 'AUTH_DUPLICATE_EMAIL',
    AUTH_WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
    AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
    AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
    AUTH_NOT_AUTHENTICATED = 'AUTH_NOT_AUTHENTICATED',
    AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',

    // Validation errors
    VALIDATION_ERROR = 'VALIDATION_ERROR',

    // Resource errors
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

    // Payment errors
    PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
    PAYMENT_AMOUNT_MISMATCH = 'PAYMENT_AMOUNT_MISMATCH',
    PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
    PAYMENT_DUPLICATE_TRANSACTION = 'PAYMENT_DUPLICATE_TRANSACTION',

    // Order errors
    ORDER_INVALID_STATUS = 'ORDER_INVALID_STATUS',
    ORDER_INSUFFICIENT_STOCK = 'ORDER_INSUFFICIENT_STOCK',

    // Coupon errors
    COUPON_INVALID = 'COUPON_INVALID',
    COUPON_EXPIRED = 'COUPON_EXPIRED',
    COUPON_USAGE_LIMIT = 'COUPON_USAGE_LIMIT',

    // Affiliate errors
    AFFILIATE_SELF_REFERRAL = 'AFFILIATE_SELF_REFERRAL',
    AFFILIATE_DUPLICATE_APPLICATION = 'AFFILIATE_DUPLICATE_APPLICATION',

    // General errors
    RATE_LIMITED = 'RATE_LIMITED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
}

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: ErrorCode;
        message: string;
        details?: any;
    };
    message?: string;
    requestId?: string;
}

export class ResponseHandler {
    static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
        const response: APIResponse<T> = {
            success: true,
            data,
            message,
        };

        // Attach request ID if available
        const requestId = (res.req as any)?.requestId;
        if (requestId) {
            response.requestId = requestId;
        }

        return res.status(statusCode).json(response);
    }

    static error(
        res: Response,
        message: string,
        statusCode: number = 400,
        code?: ErrorCode,
        details?: any
    ): Response {
        const response: APIResponse = {
            success: false,
            error: {
                code: code || ErrorCode.INTERNAL_ERROR,
                message,
                ...(details && { details }),
            },
        };

        const requestId = (res.req as any)?.requestId;
        if (requestId) {
            response.requestId = requestId;
        }

        return res.status(statusCode).json(response);
    }

    static notFound(res: Response, message: string = 'Resource not found'): Response {
        return this.error(res, message, 404, ErrorCode.RESOURCE_NOT_FOUND);
    }

    static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
        return this.error(res, message, 401, ErrorCode.AUTH_NOT_AUTHENTICATED);
    }

    static forbidden(res: Response, message: string = 'Forbidden'): Response {
        return this.error(res, message, 403, ErrorCode.AUTH_FORBIDDEN);
    }

    static serverError(res: Response, message: string = 'Internal server error'): Response {
        return this.error(res, message, 500, ErrorCode.INTERNAL_ERROR);
    }

    static validationError(res: Response, message: string, details?: any): Response {
        return this.error(res, message, 400, ErrorCode.VALIDATION_ERROR, details);
    }

    static rateLimited(res: Response): Response {
        return this.error(res, 'Too many requests, please try again later', 429, ErrorCode.RATE_LIMITED);
    }
}
