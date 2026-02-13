import { Router } from 'express';
import { AffiliateController } from '../controllers/affiliate.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import {
    ambassadorApplicationSchema,
    customCodeSchema,
    referralCodeSchema,
} from '../types/affiliate.types';

const router = Router();

/**
 * @route   POST /api/affiliates/apply
 * @desc    Submit ambassador application
 * @access  Private (authenticated users)
 */
router.post(
    '/apply',
    authenticate,
    validate(ambassadorApplicationSchema),
    AffiliateController.submitApplication
);

/**
 * @route   POST /api/affiliates/validate
 * @desc    Validate referral code
 * @access  Public
 */
router.post('/validate', validate(referralCodeSchema), AffiliateController.validateCode);

/**
 * @route   GET /api/affiliates/stats
 * @desc    Get referral stats for current ambassador
 * @access  Private (ambassadors only)
 */
router.get('/stats', authenticate, AffiliateController.getStats);

/**
 * @route   PATCH /api/affiliates/custom-code
 * @desc    Update custom ambassador code
 * @access  Private (ambassadors only)
 */
router.patch(
    '/custom-code',
    authenticate,
    validate(customCodeSchema),
    AffiliateController.updateCustomCode
);

/**
 * Admin-only routes
 */

/**
 * @route   GET /api/affiliates/applications
 * @desc    Get pending applications
 * @access  Admin only
 */
router.get('/applications', authenticate, adminOnly, AffiliateController.getApplications);

/**
 * @route   POST /api/affiliates/applications/:id/approve
 * @desc    Approve ambassador application
 * @access  Admin only
 */
router.post(
    '/applications/:id/approve',
    authenticate,
    adminOnly,
    AffiliateController.approveApplication
);

/**
 * @route   POST /api/affiliates/applications/:id/reject
 * @desc    Reject ambassador application
 * @access  Admin only
 */
router.post(
    '/applications/:id/reject',
    authenticate,
    adminOnly,
    AffiliateController.rejectApplication
);

/**
 * @route   GET /api/affiliates
 * @desc    Get all ambassadors
 * @access  Admin only
 */
router.get('/', authenticate, adminOnly, AffiliateController.getAllAmbassadors);

export default router;
