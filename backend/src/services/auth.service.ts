import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';
import { PasswordService } from '../utils/password';
import { JWTService } from '../utils/jwt';
import { logger } from '../utils/logger';

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

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name: fullName,
                password: hashedPassword,
                clerkId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Temporary ID
                role: UserRole.CUSTOMER,
            },
        });

        // Generate JWT
        const token = JWTService.sign({
            userId: user.id,
            email: user.email || '',
            role: user.role,
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

        // Generate JWT
        const token = JWTService.sign({
            userId: user.id,
            email: user.email || '',
            role: user.role,
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
                // password field needs to be added to schema
            },
        });

        logger.info(`New admin user created: ${user.email}`);

        return this.formatUser(user);
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
