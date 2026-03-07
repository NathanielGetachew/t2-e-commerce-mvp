import nodemailer from 'nodemailer';
import dns from 'dns';
import { logger } from './logger';

/**
 * Resolves a hostname to its first IPv4 address.
 * Falls back to the original hostname if resolution fails.
 */
function resolveIPv4(hostname: string): Promise<string> {
    return new Promise((resolve) => {
        dns.lookup(hostname, { family: 4 }, (err, address) => {
            if (err) {
                logger.warn(`dns.lookup IPv4 failed for ${hostname}, using hostname as-is: ${err.message}`);
                resolve(hostname);
            } else {
                logger.info(`Resolved SMTP host ${hostname} → ${address} (IPv4)`);
                resolve(address);
            }
        });
    });
}

export class EmailService {
    private static _transporter: nodemailer.Transporter | null = null;

    /**
     * Creates the transporter, pre-resolving SMTP host to IPv4 to avoid
     * ENETUNREACH errors on hosts where IPv6 is not routable.
     *
     * The transporter singleton is cleared on send failure so that a bad
     * credential or network error does not permanently poison the cached instance.
     */
    static async ensureTransporter(): Promise<nodemailer.Transporter> {
        if (this._transporter) return this._transporter;

        const smtpHostname = process.env.SMTP_HOST || 'smtp.gmail.com';
        const resolvedHost = await resolveIPv4(smtpHostname);

        const port = parseInt(process.env.SMTP_PORT || '465');
        const secure = process.env.SMTP_SECURE === 'true'; // true = SSL/465, false = STARTTLS/587

        // Strip surrounding quotes from SMTP_FROM if present (dotenv quirk)
        const rawFrom = process.env.SMTP_FROM || '"T2 E-commerce" <noreply@t2-ecommerce.com>';
        const smtpFrom = rawFrom.replace(/^['"]|['"]$/g, '');

        const config: nodemailer.TransportOptions = {
            host: resolvedHost,
            port,
            secure,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
            tls: {
                // servername is required when host is an IP — used for TLS SNI
                servername: smtpHostname,
                rejectUnauthorized: false,
            },
        } as any;

        logger.info(`Creating SMTP transporter: host=${resolvedHost} port=${port} secure=${secure} user=${process.env.SMTP_USER}`);

        this._transporter = nodemailer.createTransport(config);
        // Attach from address so it's accessible for diagnostics
        (this._transporter as any)._smtpFrom = smtpFrom;
        return this._transporter;
    }

    /** Clears the cached transporter so it gets recreated on next use */
    private static clearTransporter() {
        this._transporter = null;
    }

    /**
     * Send email verification link
     */
    static async sendVerificationEmail(email: string, token: string): Promise<boolean> {
        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;

            logger.info(`[Email] Preparing verification email to ${email}, frontendUrl=${frontendUrl}`);
            logger.info(`[Email] Verification link: ${verificationLink}`);

            const transporter = await this.ensureTransporter();

            // Verify SMTP connection is alive
            try {
                await transporter.verify();
                logger.info('[Email] SMTP connection verified successfully');
            } catch (verifyErr: any) {
                logger.error(`[Email] SMTP verify failed: ${verifyErr.message}`, {
                    code: verifyErr.code,
                    command: verifyErr.command,
                });
            }
            const from = (transporter as any)._smtpFrom || '"T2 E-commerce" <noreply@t2-ecommerce.com>';

            const mailOptions = {
                from,
                to: email,
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
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Verification email sent to ${email} (Message ID: ${info.messageId})`);
            return true;
        } catch (error: any) {
            // Clear the cached transporter so a fresh one is created on the next attempt.
            // This prevents a bad credential or transient failure from permanently
            // poisoning the singleton.
            this.clearTransporter();
            logger.error(`Failed to send verification email to ${email}: ${error.message}`, {
                code: error.code,
                command: error.command,
                response: error.response,
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

            const transporter = await this.ensureTransporter();
            const from = (transporter as any)._smtpFrom || '"T2 E-commerce" <noreply@t2-ecommerce.com>';

            const mailOptions = {
                from,
                to: email,
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
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to ${email} (Message ID: ${info.messageId})`);
            return true;
        } catch (error: any) {
            // Clear the cached transporter so a fresh one is created on the next attempt
            this.clearTransporter();
            logger.error(`Failed to send password reset email to ${email}: ${error.message}`, {
                code: error.code,
                command: error.command,
                response: error.response,
            });
            return false;
        }
    }
}
