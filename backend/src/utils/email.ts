import { Resend } from 'resend';
import { logger } from './logger';

// Initialize Resend conditionally so the app doesn't crash if the key is missing
let resend: Resend | null = null;
const apiKey = process.env.RESEND_API_KEY;

if (apiKey) {
    resend = new Resend(apiKey);
    logger.info('Resend email service initialized');
} else {
    logger.warn('RESEND_API_KEY is missing. Emails will be logged to console instead of sent.');
}

// Fallback to a placeholder sender if SMTP_FROM isn't set
const FROM_EMAIL = process.env.SMTP_FROM || 'T2 E-commerce <onboarding@resend.dev>';

export class EmailService {
    /**
     * Send email verification link
     */
    static async sendVerificationEmail(email: string, token: string): Promise<boolean> {
        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;

            logger.info(`[Email] Preparing verification email to ${email}, frontendUrl=${frontendUrl}`);
            logger.info(`[Email] Verification link: ${verificationLink}`);

            if (!resend) {
                logger.warn(`[Email-DevMode] Would send verification to ${email} -> ${verificationLink}`);
                return true;
            }

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [email],
                subject: 'Verify your email address - T2 E-commerce',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Welcome to T2 E-commerce!</h2>
                        <p>Thank you for registering. Please confirm your email address to complete your registration.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Verify Email Address
                            </a>
                        </div>
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">
                            <a href="${verificationLink}">${verificationLink}</a>
                        </p>
                        <p>This link will expire in 24 hours.</p>
                        <p>Best regards,<br>The T2 E-commerce Team</p>
                    </div>
                `,
            });

            if (error) {
                logger.error(`[Email] Resend API error for ${email}: ${error.message}`, { error });
                return false;
            }

            logger.info(`[Email] Verification email sent to ${email} (ID: ${data?.id})`);
            return true;
        } catch (error: any) {
            logger.error(`[Email] Failed to send verification email to ${email}: ${error.message}`, {
                stack: error.stack,
            });
            return false;
        }
    }

    /**
     * Send password reset link
     */
    static async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

            logger.info(`[Email] Preparing password reset email to ${email}`);

            if (!resend) {
                logger.warn(`[Email-DevMode] Would send reset password to ${email} -> ${resetLink}`);
                return true;
            }

            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: [email],
                subject: 'Reset your password - T2 E-commerce',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Password Reset Request</h2>
                        <p>We received a request to reset your password for your T2 E-commerce account.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Reset Password
                            </a>
                        </div>
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">
                            <a href="${resetLink}">${resetLink}</a>
                        </p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request a password reset, you can safely ignore this email.</p>
                        <p>Best regards,<br>The T2 E-commerce Team</p>
                    </div>
                `,
            });

            if (error) {
                logger.error(`[Email] Resend API error for ${email}: ${error.message}`, { error });
                return false;
            }

            logger.info(`[Email] Password reset email sent to ${email} (ID: ${data?.id})`);
            return true;
        } catch (error: any) {
            logger.error(`[Email] Failed to send password reset email to ${email}: ${error.message}`, {
                stack: error.stack,
            });
            return false;
        }
    }
}
