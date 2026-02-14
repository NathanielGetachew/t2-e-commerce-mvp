import { Request, Response } from 'express';
import { AffiliateService } from '../services/affiliate.service';
import { ResponseHandler } from '../utils/responses';
import { logger } from '../utils/logger';

export class AffiliateController {
    /**
     * POST /api/affiliates/apply
     * Submit ambassador application
     */
    static async submitApplication(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user!.userId;
            const { socialLinks, whyJoin, marketingStrategy } = req.body;

            await AffiliateService.submitApplication(userId, {
                socialLinks,
                whyJoin,
                marketingStrategy,
            });

            return ResponseHandler.success(
                res,
                null,
                'Application submitted successfully. We will review it shortly.',
                201
            );
        } catch (error: any) {
            logger.error('Submit application error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to submit application', 400);
        }
    }

    /**
     * GET /api/affiliates/applications
     * Get pending applications (Admin only)
     */
    static async getApplications(_req: Request, res: Response): Promise<Response> {
        try {
            const applications = await AffiliateService.getPendingApplications();

            return ResponseHandler.success(res, { applications });
        } catch (error: any) {
            logger.error('Get applications error:', error);
            return ResponseHandler.error(res, 'Failed to get applications');
        }
    }

    /**
     * POST /api/affiliates/applications/:id/approve
     * Approve ambassador application (Admin only)
     */
    static async approveApplication(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;

            await AffiliateService.approveApplication(id);

            return ResponseHandler.success(res, null, 'Application approved successfully');
        } catch (error: any) {
            logger.error('Approve application error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to approve application', 400);
        }
    }

    /**
     * POST /api/affiliates/applications/:id/reject
     * Reject ambassador application (Admin only)
     */
    static async rejectApplication(req: Request, res: Response): Promise<Response> {
        try {
            const id = req.params.id as string;

            await AffiliateService.rejectApplication(id);

            return ResponseHandler.success(res, null, 'Application rejected');
        } catch (error: any) {
            logger.error('Reject application error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to reject application', 400);
        }
    }

    /**
     * PATCH /api/affiliates/custom-code
     * Update custom ambassador code
     */
    static async updateCustomCode(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user!.userId;
            const { customCode } = req.body;

            await AffiliateService.updateCustomCode(userId, customCode);

            return ResponseHandler.success(res, null, 'Ambassador code updated successfully');
        } catch (error: any) {
            logger.error('Update custom code error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to update code', 400);
        }
    }

    /**
     * POST /api/affiliates/validate
     * Validate referral code
     */
    static async validateCode(req: Request, res: Response): Promise<Response> {
        try {
            const { code } = req.body;

            const result = await AffiliateService.validateReferralCode(code);

            if (!result.valid) {
                return ResponseHandler.error(res, 'Invalid referral code', 404);
            }

            return ResponseHandler.success(res, {
                ambassadorName: result.ambassadorName,
                discountPercentage: result.discountPercentage,
            });
        } catch (error: any) {
            logger.error('Validate code error:', error);
            return ResponseHandler.error(res, 'Failed to validate code');
        }
    }

    /**
     * GET /api/affiliates/stats
     * Get referral stats for current ambassador
     */
    static async getStats(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user!.userId;

            const stats = await AffiliateService.getReferralStats(userId);

            return ResponseHandler.success(res, stats);
        } catch (error: any) {
            logger.error('Get stats error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to get stats', 400);
        }
    }

    /**
     * GET /api/affiliates
     * Get all ambassadors (Admin only)
     */
    static async getAllAmbassadors(_req: Request, res: Response): Promise<Response> {
        try {
            const ambassadors = await AffiliateService.getAllAmbassadors();

            return ResponseHandler.success(res, { ambassadors });
        } catch (error: any) {
            logger.error('Get ambassadors error:', error);
            return ResponseHandler.error(res, 'Failed to get ambassadors');
        }
    }
}
