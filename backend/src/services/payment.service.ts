import crypto from 'crypto';
import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Payment Webhook Verification Service
 * Implements security best practices from expert feedback:
 * 1. Signature verification
 * 2. Server-to-server validation
 * 3. Replay attack prevention
 */

export interface PaymentWebhookData {
    transactionRef: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'pending';
    gateway: 'chapa' | 'telebirr';
    metadata?: Record<string, any>;
}

export class PaymentService {
    /**
     * Verify Chapa webhook signature
     */
    static verifyChapaSignature(
        payload: string,
        signature: string,
        secret: string
    ): boolean {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    /**
     * Verify payment with Chapa API (server-to-server)
     * CRITICAL: Do not trust webhook data alone!
     */
    static async verifyChapaPayment(transactionRef: string): Promise<{
        verified: boolean;
        amount?: number;
        status?: string;
        error?: string;
    }> {
        try {
            const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

            if (!chapaSecretKey) {
                logger.error('CHAPA_SECRET_KEY not configured');
                return { verified: false, error: 'Payment gateway not configured' };
            }

            // Make server-to-server verification request to Chapa
            const response = await axios.get(
                `https://api.chapa.co/v1/transaction/verify/${transactionRef}`,
                {
                    headers: {
                        Authorization: `Bearer ${chapaSecretKey}`,
                    },
                    timeout: 10000, // 10 second timeout
                }
            );

            if (response.data.status === 'success' && response.data.data.status === 'success') {
                return {
                    verified: true,
                    amount: response.data.data.amount,
                    status: response.data.data.status,
                };
            }

            return {
                verified: false,
                error: 'Payment not confirmed by gateway',
            };
        } catch (error: any) {
            logger.error('Chapa verification error:', error);
            return {
                verified: false,
                error: error.message || 'Verification failed',
            };
        }
    }

    /**
     * Verify Telebirr webhook signature
     */
    static verifyTelebirrSignature(
        payload: string,
        signature: string,
        publicKey: string
    ): boolean {
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(payload);
            verify.end();

            return verify.verify(publicKey, signature, 'base64');
        } catch (error) {
            logger.error('Telebirr signature verification error:', error);
            return false;
        }
    }

    /**
     * Verify payment with Telebirr API (server-to-server)
     */
    static async verifyTelebirrPayment(transactionRef: string): Promise<{
        verified: boolean;
        amount?: number;
        status?: string;
        error?: string;
    }> {
        try {
            const telebirrAppId = process.env.TELEBIRR_APP_ID;
            const telebirrAppKey = process.env.TELEBIRR_APP_KEY;

            if (!telebirrAppId || !telebirrAppKey) {
                logger.error('Telebirr credentials not configured');
                return { verified: false, error: 'Payment gateway not configured' };
            }

            // Note: Replace with actual Telebirr API endpoint
            const response = await axios.post(
                'https://api.telebirr.com/v1/payment/query',
                {
                    transactionRef,
                    appId: telebirrAppId,
                },
                {
                    headers: {
                        'X-APP-Key': telebirrAppKey,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            );

            if (response.data.status === 'SUCCESS') {
                return {
                    verified: true,
                    amount: response.data.amount,
                    status: response.data.status,
                };
            }

            return {
                verified: false,
                error: 'Payment not confirmed by gateway',
            };
        } catch (error: any) {
            logger.error('Telebirr verification error:', error);
            return {
                verified: false,
                error: error.message || 'Verification failed',
            };
        }
    }

    /**
     * Prevent replay attacks by checking if transaction was already processed
     */
    static async isTransactionProcessed(transactionRef: string): Promise<boolean> {
        const { prisma } = await import('../config/database');

        const existingOrder = await prisma.order.findFirst({
            where: {
                OR: [
                    { stripeCheckoutSessionId: transactionRef },
                    { stripePaymentIntentId: transactionRef },
                ],
            },
        });

        return existingOrder !== null;
    }

    /**
     * Process verified payment (update order status)
     */
    static async processVerifiedPayment(
        transactionRef: string,
        amount: number,
        gateway: 'chapa' | 'telebirr'
    ): Promise<{ success: boolean; orderId?: string; error?: string }> {
        const { prisma } = await import('../config/database');

        try {
            // Find pending order
            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { stripeCheckoutSessionId: transactionRef },
                        { stripePaymentIntentId: transactionRef },
                    ],
                    status: 'PENDING',
                },
            });

            if (!order) {
                logger.warn(`Order not found for transaction: ${transactionRef}`);
                return { success: false, error: 'Order not found' };
            }

            // Verify amount matches (critical security check)
            const orderAmountBirr = order.totalCents;
            const paidAmountCents = Math.round(amount * 100);

            if (Math.abs(orderAmountBirr - paidAmountCents) > 10) {
                // Allow 10 cents tolerance for floating point
                logger.error(
                    `Amount mismatch! Order: ${orderAmountBirr}, Paid: ${paidAmountCents}, Ref: ${transactionRef}`
                );
                return { success: false, error: 'Amount mismatch' };
            }

            // Update order status to PAID
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'PAID',
                },
            });

            logger.info(
                `Payment verified and order updated: ${order.orderNumber} via ${gateway}, ref: ${transactionRef}`
            );

            return { success: true, orderId: order.id };
        } catch (error: any) {
            logger.error('Process payment error:', error);
            return { success: false, error: error.message };
        }
    }
}
