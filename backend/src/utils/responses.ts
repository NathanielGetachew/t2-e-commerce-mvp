import { Response } from 'express';

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export class ResponseHandler {
    static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
        return res.status(statusCode).json({
            success: true,
            data,
            message,
        } as APIResponse<T>);
    }

    static error(res: Response, error: string, statusCode: number = 400): Response {
        return res.status(statusCode).json({
            success: false,
            error,
        } as APIResponse);
    }

    static notFound(res: Response, message: string = 'Resource not found'): Response {
        return res.status(404).json({
            success: false,
            error: message,
        } as APIResponse);
    }

    static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
        return res.status(401).json({
            success: false,
            error: message,
        } as APIResponse);
    }

    static forbidden(res: Response, message: string = 'Forbidden'): Response {
        return res.status(403).json({
            success: false,
            error: message,
        } as APIResponse);
    }

    static serverError(res: Response, message: string = 'Internal server error'): Response {
        return res.status(500).json({
            success: false,
            error: message,
        } as APIResponse);
    }
}
