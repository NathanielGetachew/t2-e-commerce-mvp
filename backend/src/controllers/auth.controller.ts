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

            // Set cookie accessible to client JS (httpOnly: false)
            res.cookie('auth_token', result.token, {
                httpOnly: false,
                secure: config.nodeEnv === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            return ResponseHandler.success(
                res,
                {
                    user: result.user,
                    token: result.token,
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

            // Set cookie accessible to client JS (httpOnly: false)
            res.cookie('auth_token', result.token, {
                httpOnly: false,
                secure: config.nodeEnv === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            return ResponseHandler.success(res, {
                user: result.user,
                token: result.token,
            }, 'Login successful');
        } catch (error: any) {
            logger.error('Login error:', error);
            return ResponseHandler.error(res, error.message || 'Login failed', 400);
        }
    }

    /**
     * POST /api/auth/verify-email
     * Verify user email
     */
    static async verifyEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { token } = req.body;

            if (!token) {
                return ResponseHandler.error(res, 'Verification token is required', 400);
            }

            await AuthService.verifyEmail(token);

            return ResponseHandler.success(res, null, 'Email verified successfully');
        } catch (error: any) {
            logger.error('Email verification error:', error);
            return ResponseHandler.error(res, error.message || 'Verification failed', 400);
        }
    }

    /**
     * POST /api/auth/forgot-password
     * Request a password reset email
     */
    static async forgotPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = req.body;

            if (!email) {
                return ResponseHandler.error(res, 'Email is required', 400);
            }

            await AuthService.forgotPassword(email);

            return ResponseHandler.success(res, null, 'If that email exists, a reset link has been sent');
        } catch (error: any) {
            logger.error('Forgot password error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to process request', 400);
        }
    }

    /**
     * POST /api/auth/reset-password
     * Reset password using token
     */
    static async resetPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                return ResponseHandler.error(res, 'Token and new password are required', 400);
            }

            await AuthService.resetPassword(token, password);

            return ResponseHandler.success(res, null, 'Password reset successfully');
        } catch (error: any) {
            logger.error('Reset password error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to reset password', 400);
        }
    }

    /**
     * POST /api/auth/logout
     * Logout user
     */
    static async logout(_req: Request, res: Response): Promise<Response> {
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
            const { email, password, fullName } = req.body;

            const user = await AuthService.createAdmin(email, password, fullName);

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

    /**
     * GET /api/auth/admins
     * List all admin users (Super Admin only)
     */
    static async listAdmins(_req: Request, res: Response): Promise<Response> {
        try {
            const admins = await AuthService.listAdmins();
            return ResponseHandler.success(res, { admins }, 'Admins fetched successfully');
        } catch (error: any) {
            logger.error('List admins error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to fetch admins');
        }
    }

    /**
     * PATCH /api/auth/admins/:id
     * Update an admin account (Super Admin only)
     */
    static async updateAdmin(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;
            const { name, email } = req.body;

            const admin = await AuthService.updateAdmin(id, { name, email });
            return ResponseHandler.success(res, { admin }, 'Admin updated successfully');
        } catch (error: any) {
            logger.error('Update admin error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to update admin', 400);
        }
    }

    /**
     * DELETE /api/auth/admins/:id
     * Delete an admin account (Super Admin only)
     */
    static async deleteAdmin(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;
            await AuthService.deleteAdmin(id);
            return ResponseHandler.success(res, null, 'Admin deleted successfully');
        } catch (error: any) {
            logger.error('Delete admin error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to delete admin', 400);
        }
    }
}
