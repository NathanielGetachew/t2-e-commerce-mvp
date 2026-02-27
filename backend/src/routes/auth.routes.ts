import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { superAdminOnly } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import { loginSchema, signupSchema, createAdminSchema, forgotPasswordSchema, resetPasswordSchema } from '../types/auth.types';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', validate(signupSchema), AuthController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request a password reset email
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', AuthController.logout);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', AuthController.verifyEmail);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, AuthController.me);

/**
 * @route   POST /api/auth/admin/create
 * @desc    Create admin user
 * @access  Super Admin only
 */
router.post(
    '/admin/create',
    authenticate,
    superAdminOnly,
    validate(createAdminSchema),
    AuthController.createAdmin
);

export default router;
