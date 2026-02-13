import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { ResponseHandler } from '../utils/responses';
import { logger } from '../utils/logger';

export class PaymentController {
    /**
     * POST /api/webhooks/chapa
     * Handle Chapa payment webhook
     */
    static async chapaWebhook(req: Request, res: Response): Promise<Response> {
        try {
            const signature = req.headers['x-chapa-signature'] as string;
            const payload = JSON.stringify(req.body);

            // 1. Verify webhook signature
            const chapaWebhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
            if (!chapaWebhookSecret) {
                logger.error('CHAPA_WEBHOOK_SECRET not configured');
                return ResponseHandler.error(res, 'Webhook not configured', 500);
            }

            const isValid = PaymentService.verifyChapaSignature(
                payload,
                signature,
                chapaWebhookSecret
            );

            if (!isValid) {
                logger.warn('Invalid Chapa webhook signature');
                return ResponseHandler.error(res, 'Invalid signature', 401);
            }

            const { tx_ref, status } = req.body;

            // 2. Check for replay attacks
            const isProcessed = await PaymentService.isTransactionProcessed(tx_ref);
            if (isProcessed) {
                logger.warn(`Duplicate webhook for transaction: ${tx_ref}`);
                return ResponseHandler.success(res, null, 'Already processed');
            }

            // 3. Only process successful payments
            if (status !== 'success') {
                logger.info(`Non-success payment status: ${status} for ${tx_ref}`);
                return ResponseHandler.success(res, null, 'Acknowledged');
            }

            // 4. CRITICAL: Server-to-server verification
            // Do NOT trust webhook data alone!
            const verification = await PaymentService.verifyChapaPayment(tx_ref);

            if (!verification.verified) {
                logger.error(`Failed to verify payment with Chapa: ${tx_ref}, error: ${verification.error}`);
                return ResponseHandler.error(res, 'Verification failed', 400);
            }

            // 5. Process verified payment
            const result = await PaymentService.processVerifiedPayment(
                tx_ref,
                verification.amount!,
                'chapa'
            );

            if (!result.success) {
                logger.error(`Failed to process payment: ${result.error}`);
                return ResponseHandler.error(res, result.error || 'Processing failed', 400);
            }

            logger.info(`Chapa payment processed successfully: ${tx_ref}, order: ${result.orderId}`);

            return ResponseHandler.success(res, null, 'Payment processed');
        } catch (error: any) {
            logger.error('Chapa webhook error:', error);
            return ResponseHandler.error(res, 'Webhook processing failed', 500);
        }
    }

    /**
     * POST /api/webhooks/telebirr
     * Handle Telebirr payment webhook
     */
    static async telebirrWebhook(req: Request, res: Response): Promise<Response> {
        try {
            const signature = req.headers['x-telebirr-signature'] as string;
            const payload = JSON.stringify(req.body);

            // 1. Verify webhook signature
            const telebirrPublicKey = process.env.TELEBIRR_PUBLIC_KEY;
            if (!telebirrPublicKey) {
                logger.error('TELEBIRR_PUBLIC_KEY not configured');
                return ResponseHandler.error(res, 'Webhook not configured', 500);
            }

            const isValid = PaymentService.verifyTelebirrSignature(
                payload,
                signature,
                telebirrPublicKey
            );

            if (!isValid) {
                logger.warn('Invalid Telebirr webhook signature');
                return ResponseHandler.error(res, 'Invalid signature', 401);
            }

            const { transactionRef, status } = req.body;

            // 2. Check for replay attacks
            const isProcessed = await PaymentService.isTransactionProcessed(transactionRef);
            if (isProcessed) {
                logger.warn(`Duplicate webhook for transaction: ${transactionRef}`);
                return ResponseHandler.success(res, null, 'Already processed');
            }

            // 3. Only process successful payments
            if (status !== 'SUCCESS') {
                logger.info(`Non-success payment status: ${status} for ${transactionRef}`);
                return ResponseHandler.success(res, null, 'Acknowledged');
            }

            // 4. CRITICAL: Server-to-server verification
            const verification = await PaymentService.verifyTelebirrPayment(transactionRef);

            if (!verification.verified) {
                logger.error(`Failed to verify payment with Telebirr: ${transactionRef}, error: ${verification.error}`);
                return ResponseHandler.error(res, 'Verification failed', 400);
            }

            // 5. Process verified payment
            const result = await PaymentService.processVerifiedPayment(
                transactionRef,
                verification.amount!,
                'telebirr'
            );

            if (!result.success) {
                logger.error(`Failed to process payment: ${result.error}`);
                return ResponseHandler.error(res, result.error || 'Processing failed', 400);
            }

            logger.info(`Telebirr payment processed successfully: ${transactionRef}, order: ${result.orderId}`);

            return ResponseHandler.success(res, null, 'Payment processed');
        } catch (error: any) {
            logger.error('Telebirr webhook error:', error);
            return ResponseHandler.error(res, 'Webhook processing failed', 500);
        }
    }
}
