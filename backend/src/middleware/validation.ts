import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ResponseHandler } from '../utils/responses';

/**
 * Validation Middleware Factory
 * Validates request body, query, or params using Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void | Response => {
        try {
            const data = req[source];
            const validated = schema.parse(data);

            // Replace original data with validated data
            req[source] = validated;

            next();
        } catch (error) {
            console.log("ZOD VALIDATION ERROR:", error);
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors,
                });
            }

            return ResponseHandler.error(res, 'Invalid request data');
        }
    };
};
