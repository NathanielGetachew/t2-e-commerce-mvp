import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth';
import { superAdminOnly } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import { z } from 'zod';
import { systemSettingSchema, batchSettingsSchema } from '../types/settings.types';

const router = Router();

// All settings routes require Super Admin authentication
router.use(authenticate, superAdminOnly);

/**
 * @route   GET /api/settings
 * @desc    Get all system settings
 * @access  Super Admin only
 */
router.get('/', SettingsController.getAll);

/**
 * @route   PUT /api/settings
 * @desc    Batch update settings
 * @access  Super Admin only
 */
router.put('/', validate(z.object({ settings: batchSettingsSchema })), SettingsController.batchUpdate);

/**
 * @route   PUT /api/settings/:key
 * @desc    Update a specific setting
 * @access  Super Admin only
 */
router.put('/:key', validate(systemSettingSchema), SettingsController.update);

/**
 * @route   POST /api/settings/:key/reset
 * @desc    Reset setting to default value
 * @access  Super Admin only
 */
router.post('/:key/reset', SettingsController.reset);

export default router;
