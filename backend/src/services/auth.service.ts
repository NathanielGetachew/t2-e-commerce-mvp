import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';
import { PasswordService } from '../utils/password';
import { JWTService } from '../utils/jwt';
import { logger } from '../utils/logger';
import { EmailService } from '../utils/email';
import crypto from 'crypto';

export interface UserResponse {
    id: string;
    email: string | null;
    fullName: string | null;
    role: UserRole;
    isAmbassador: boolean;
}

export class AuthService {
    /**
     * Register a new user
     */
    static async signup(
        email: string,
        password: string,
        fullName: string
    ): Promise<{ user: UserResponse; token: string }> {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Validate password strength
        const passwordValidation = PasswordService.validate(password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message || 'Invalid password');
        }

        // Hash password
        const hashedPassword = await PasswordService.hash(password);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name: fullName,
                password: hashedPassword,
                clerkId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Temporary ID
                role: UserRole.CUSTOMER,
                isEmailVerified: false,
                verificationToken,
            },
        });

        // Send Verification Email
        EmailService.sendVerificationEmail(email, verificationToken).catch((err) => {
            logger.error(`Error sending verification email to ${email}:`, err);
        });

        // Generate JWT
        const token = JWTService.sign({
            userId: user.id,
            email: user.email || '',
            role: user.role,
            name: user.name || '',
        });

        logger.info(`New user registered: ${user.email}`);

        return {
            user: this.formatUser(user),
            token,
        };
    }

    /**
     * Login user
     */
    static async login(
        email: string,
        password: string
    ): Promise<{ user: UserResponse; token: string }> {
        // Find user by email
        const user = await prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        if (!user.password) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await PasswordService.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        if (!user.isEmailVerified) {
            throw new Error('Please verify your email address before logging in. Check your inbox.');
        }

        // Generate JWT
        const token = JWTService.sign({
            userId: user.id,
            email: user.email || '',
            role: user.role,
            name: user.name || '',
        });

        logger.info(`User logged in: ${user.email}`);

        return {
            user: this.formatUser(user),
            token,
        };
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<UserResponse | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return null;
        }

        return this.formatUser(user);
    }

    /**
     * Create admin user (super admin only)
     */
    static async createAdmin(
        email: string,
        password: string,
        fullName: string
    ): Promise<UserResponse> {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Validate password strength
        const passwordValidation = PasswordService.validate(password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message || 'Invalid password');
        }

        // Hash password
        const hashedPassword = await PasswordService.hash(password);

        // Create admin user
        const user = await prisma.user.create({
            data: {
                email,
                name: fullName,
                password: hashedPassword,
                clerkId: `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                role: UserRole.ADMIN,
            },
        });

        logger.info(`New admin user created: ${user.email}`);

        return this.formatUser(user);
    }

    /**
     * Verify user email
     */
    static async verifyEmail(token: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            throw new Error('Invalid or expired verification token');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationToken: null,
            },
        });

        logger.info(`User email verified: ${user.email}`);
        return true;
    }

    /**
     * Format user response (remove sensitive data)
     */
    private static formatUser(user: any): UserResponse {
        return {
            id: user.id,
            email: user.email,
            fullName: user.name,
            role: user.role,
            isAmbassador: user.isAmbassador || false,
        };
    }
}
