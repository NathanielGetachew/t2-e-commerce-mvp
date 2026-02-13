import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { ResponseHandler } from '../utils/responses';
import { logger } from '../utils/logger';

export class SettingsController {
    /**
     * GET /api/settings
     * Get all system settings
     */
    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const settings = await SettingsService.getAll();

            return ResponseHandler.success(res, { settings });
        } catch (error: any) {
            logger.error('Get settings error:', error);
            return ResponseHandler.error(res, 'Failed to get settings');
        }
    }

    /**
     * PUT /api/settings/:key
     * Update a specific setting
     */
    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const { key } = req.params;
            const { value, description } = req.body;
            const userId = req.user!.userId;

            const setting = await SettingsService.update(key, value, userId, description);

            return ResponseHandler.success(res, { setting }, 'Setting updated successfully');
        } catch (error: any) {
            logger.error('Update setting error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to update setting', 400);
        }
    }

    /**
     * PUT /api/settings
     * Batch update settings
     */
    static async batchUpdate(req: Request, res: Response): Promise<Response> {
        try {
            const { settings } = req.body;
            const userId = req.user!.userId;

            if (!Array.isArray(settings)) {
                return ResponseHandler.error(res, 'Settings must be an array', 400);
            }

            const updatedSettings = await SettingsService.batchUpdate(settings, userId);

            return ResponseHandler.success(
                res,
                { settings: updatedSettings },
                `${updatedSettings.length} settings updated successfully`
            );
        } catch (error: any) {
            logger.error('Batch update settings error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to update settings', 400);
        }
    }

    /**
     * POST /api/settings/:key/reset
     * Reset setting to default value
     */
    static async reset(req: Request, res: Response): Promise<Response> {
        try {
            const { key } = req.params;
            const userId = req.user!.userId;

            const setting = await SettingsService.reset(key, userId);

            return ResponseHandler.success(res, { setting }, 'Setting reset to default');
        } catch (error: any) {
            logger.error('Reset setting error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to reset setting', 400);
        }
    }
}
