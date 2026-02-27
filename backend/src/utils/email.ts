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
     */
    static async ensureTransporter(): Promise<nodemailer.Transporter> {
        if (this._transporter) return this._transporter;

        const smtpHostname = process.env.SMTP_HOST || 'smtp.mailtrap.io';
        const resolvedHost = await resolveIPv4(smtpHostname);

        const port = parseInt(process.env.SMTP_PORT || '2525');
        const secure = process.env.SMTP_SECURE === 'true'; // true = SSL/465, false = STARTTLS/587

        const config: any = {
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
        };

        this._transporter = nodemailer.createTransport(config);
        return this._transporter;
    }

    /**
     * Send email verification link
     */
    static async sendVerificationEmail(email: string, token: string): Promise<boolean> {
        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;

            const mailOptions = {
                from: process.env.SMTP_FROM || '"T2 E-commerce" <noreply@t2-ecommerce.com>',
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

            const transporter = await this.ensureTransporter();
            const info = await transporter.sendMail(mailOptions);
            logger.info(`Verification email sent to ${email} (Message ID: ${info.messageId})`);
            return true;
        } catch (error) {
            logger.error(`Failed to send verification email to ${email}:`, error);
            return false;
        }
    }
}
