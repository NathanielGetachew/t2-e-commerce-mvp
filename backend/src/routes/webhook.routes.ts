import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

/**
 * @route   POST /api/webhooks/chapa
 * @desc    Handle Chapa payment webhooks
 * @access  Public (but signature verified)
 */
router.post('/chapa', PaymentController.chapaWebhook);

/**
 * @route   POST /api/webhooks/telebirr
 * @desc    Handle Telebirr payment webhooks
 * @access  Public (but signature verified)
 */
router.post('/telebirr', PaymentController.telebirrWebhook);

export default router;
