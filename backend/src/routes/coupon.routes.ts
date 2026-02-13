import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly, superAdminOnly } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import { createCouponSchema, validateCouponSchema } from '../types/coupon.types';

const router = Router();

/**
 * @route   POST /api/coupons/validate
 * @desc    Validate a coupon
 * @access  Public
 */
router.post('/validate', validate(validateCouponSchema), CouponController.validateCoupon);

/**
 * @route   GET /api/coupons
 * @desc    Get all coupons
 * @access  Admin only
 */
router.get('/', authenticate, adminOnly, CouponController.getCoupons);

/**
 * @route   POST /api/coupons
 * @desc    Create a new coupon
 * @access  Super Admin only
 */
router.post(
    '/',
    authenticate,
    superAdminOnly,
    validate(createCouponSchema),
    CouponController.createCoupon
);

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Delete a coupon
 * @access  Super Admin only
 */
router.delete('/:id', authenticate, superAdminOnly, CouponController.deleteCoupon);

/**
 * @route   POST /api/coupons/cleanup
 * @desc    Delete expired coupons
 * @access  Super Admin only
 */
router.post('/cleanup', authenticate, superAdminOnly, CouponController.cleanupExpired);

export default router;
