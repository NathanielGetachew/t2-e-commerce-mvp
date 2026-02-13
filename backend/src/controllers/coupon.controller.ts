import { Request, Response } from 'express';
import { CouponService } from '../services/coupon.service';
import { ResponseHandler } from '../utils/responses';
import { logger } from '../utils/logger';

export class CouponController {
    /**
     * POST /api/coupons
     * Create a new coupon
     */
    static async createCoupon(req: Request, res: Response): Promise<Response> {
        try {
            const {
                code,
                discountPercentage,
                targetProductId,
                validHours,
                maxUses,
                minOrderAmountCents,
            } = req.body;
            const userId = req.user!.userId;

            const coupon = await CouponService.createCoupon(
                code,
                discountPercentage,
                validHours,
                userId,
                targetProductId,
                maxUses,
                minOrderAmountCents
            );

            return ResponseHandler.success(res, { coupon }, 'Coupon created successfully', 201);
        } catch (error: any) {
            logger.error('Create coupon error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to create coupon', 400);
        }
    }

    /**
     * GET /api/coupons
     * Get all coupons
     */
    static async getCoupons(req: Request, res: Response): Promise<Response> {
        try {
            const { includeExpired } = req.query;

            const coupons = await CouponService.getAllCoupons(includeExpired === 'true');

            return ResponseHandler.success(res, { coupons });
        } catch (error: any) {
            logger.error('Get coupons error:', error);
            return ResponseHandler.error(res, 'Failed to get coupons');
        }
    }

    /**
     * POST /api/coupons/validate
     * Validate a coupon
     */
    static async validateCoupon(req: Request, res: Response): Promise<Response> {
        try {
            const { code, productId, orderAmountCents } = req.body;

            const result = await CouponService.validateCoupon(code, productId, orderAmountCents);

            if (!result.valid) {
                return ResponseHandler.error(res, result.error || 'Invalid coupon', 400);
            }

            return ResponseHandler.success(res, {
                discountPercentage: result.discountPercentage,
            });
        } catch (error: any) {
            logger.error('Validate coupon error:', error);
            return ResponseHandler.error(res, 'Failed to validate coupon');
        }
    }

    /**
     * DELETE /api/coupons/:id
     * Delete a coupon
     */
    static async deleteCoupon(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;

            await CouponService.deleteCoupon(id);

            return ResponseHandler.success(res, null, 'Coupon deleted successfully');
        } catch (error: any) {
            logger.error('Delete coupon error:', error);
            return ResponseHandler.error(res, 'Failed to delete coupon');
        }
    }

    /**
     * POST /api/coupons/cleanup
     * Delete expired coupons
     */
    static async cleanupExpired(req: Request, res: Response): Promise<Response> {
        try {
            const count = await CouponService.deleteExpiredCoupons();

            return ResponseHandler.success(res, { deletedCount: count }, `Deleted ${count} expired coupons`);
        } catch (error: any) {
            logger.error('Cleanup coupons error:', error);
            return ResponseHandler.error(res, 'Failed to cleanup coupons');
        }
    }
}
