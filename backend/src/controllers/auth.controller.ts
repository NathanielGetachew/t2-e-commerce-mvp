import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseHandler } from '../utils/responses';
import { logger } from '../utils/logger';
import config from '../config/env';

export class AuthController {
    /**
     * POST /api/auth/signup
     * Register a new user
     */
    static async signup(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password, fullName } = req.body;

            const result = await AuthService.signup(email, password, fullName);

            // Set HTTP-only cookie
            res.cookie('auth_token', result.token, {
                httpOnly: true,
                secure: config.nodeEnv === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            return ResponseHandler.success(
                res,
                {
                    user: result.user,
                },
                'Account created successfully',
                201
            );
        } catch (error: any) {
            logger.error('Signup error:', error);
            return ResponseHandler.error(res, error.message || 'Registration failed', 400);
        }
    }

    /**
     * POST /api/auth/login
     * Login user
     */
    static async login(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;

            const result = await AuthService.login(email, password);

            // Set HTTP-only cookie
            res.cookie('auth_token', result.token, {
                httpOnly: true,
                secure: config.nodeEnv === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            return ResponseHandler.success(res, {
                user: result.user,
            }, 'Login successful');
        } catch (error: any) {
            logger.error('Login error:', error);
            return ResponseHandler.error(res, error.message || 'Login failed', 400);
        }
    }

    /**
     * POST /api/auth/logout
     * Logout user
     */
    static async logout(req: Request, res: Response): Promise<Response> {
        try {
            // Clear auth cookie
            res.clearCookie('auth_token');

            return ResponseHandler.success(res, null, 'Logged out successfully');
        } catch (error: any) {
            logger.error('Logout error:', error);
            return ResponseHandler.error(res, 'Logout failed');
        }
    }

    /**
     * GET /api/auth/me
     * Get current authenticated user
     */
    static async me(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user) {
                return ResponseHandler.unauthorized(res, 'Not authenticated');
            }

            const user = await AuthService.getUserById(req.user.userId);

            if (!user) {
                return ResponseHandler.notFound(res, 'User not found');
            }

            return ResponseHandler.success(res, { user });
        } catch (error: any) {
            logger.error('Get user error:', error);
            return ResponseHandler.error(res, 'Failed to get user data');
        }
    }

    /**
     * POST /api/auth/admin/create
     * Create admin user (Super Admin only)
     */
    static async createAdmin(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password, fullName, phone } = req.body;

            const user = await AuthService.createAdmin(email, password, fullName, phone);

            return ResponseHandler.success(
                res,
                { user },
                'Admin user created successfully',
                201
            );
        } catch (error: any) {
            logger.error('Create admin error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to create admin', 400);
        }
    }
}
