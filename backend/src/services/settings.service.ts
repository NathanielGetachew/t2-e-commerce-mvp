import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { DEFAULT_SETTINGS, SettingKey } from '../types/settings.types';

// In-memory cache for settings to avoid DB queries on every request
let settingsCache: Map<string, string> = new Map();
let cacheInitialized = false;

export interface SettingResponse {
    key: string;
    value: string;
    description: string | null;
    updatedAt: Date;
}

export class SettingsService {
    /**
     * Initialize cache with default settings
     */
    private static async initializeCache(): Promise<void> {
        if (cacheInitialized) return;

        try {
            // Fetch all settings from database
            const settings = await prisma.systemSettings.findMany();

            // Build cache
            settingsCache.clear();
            settings.forEach(setting => {
                settingsCache.set(setting.key, setting.value);
            });

            // Add defaults for any missing settings
            for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
                if (!settingsCache.has(key)) {
                    settingsCache.set(key, config.value);

                    // Create in database
                    await prisma.systemSettings.create({
                        data: {
                            key,
                            value: config.value,
                            description: config.description,
                        },
                    }).catch(() => { }); // Ignore if already exists
                }
            }

            cacheInitialized = true;
            logger.info('Settings cache initialized');
        } catch (error) {
            logger.error('Failed to initialize settings cache:', error);
            // Use defaults if database fails
            for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
                settingsCache.set(key, config.value);
            }
            cacheInitialized = true;
        }
    }

    /**
     * Get a setting value (from cache)
     */
    static async get(key: string): Promise<string> {
        await this.initializeCache();

        const value = settingsCache.get(key);
        if (value !== undefined) {
            return value;
        }

        // Return default if exists
        const defaultSetting = DEFAULT_SETTINGS[key];
        if (defaultSetting) {
            return defaultSetting.value;
        }

        throw new Error(`Setting not found: ${key}`);
    }

    /**
     * Get a setting as number
     */
    static async getNumber(key: string): Promise<number> {
        const value = await this.get(key);
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            throw new Error(`Setting ${key} is not a valid number: ${value}`);
        }
        return num;
    }

    /**
     * Get commission rate in basis points
     */
    static async getCommissionRateBp(): Promise<number> {
        return this.getNumber(SettingKey.COMMISSION_RATE_BP);
    }

    /**
     * Get customer discount percentage
     */
    static async getCustomerDiscountPercent(): Promise<number> {
        return this.getNumber(SettingKey.CUSTOMER_DISCOUNT_PERCENT);
    }

    /**
     * Get commission hold days
     */
    static async getCommissionHoldDays(): Promise<number> {
        return this.getNumber(SettingKey.COMMISSION_HOLD_DAYS);
    }

    /**
     * Get all settings (Super Admin only)
     */
    static async getAll(): Promise<SettingResponse[]> {
        const settings = await prisma.systemSettings.findMany({
            orderBy: { key: 'asc' },
        });

        return settings.map(setting => ({
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updatedAt: setting.updatedAt,
        }));
    }

    /**
     * Update a setting (Super Admin only)
     */
    static async update(
        key: string,
        value: string,
        userId: string,
        description?: string
    ): Promise<SettingResponse> {
        // Update or create in database
        const setting = await prisma.systemSettings.upsert({
            where: { key },
            update: {
                value,
                description: description || undefined,
                updatedBy: userId,
            },
            create: {
                key,
                value,
                description: description || null,
                updatedBy: userId,
            },
        });

        // Update cache
        settingsCache.set(key, value);

        logger.info(`Setting updated: ${key} = ${value} by user ${userId}`);

        return {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updatedAt: setting.updatedAt,
        };
    }

    /**
     * Batch update settings (Super Admin only)
     */
    static async batchUpdate(
        settings: Array<{ key: string; value: string; description?: string }>,
        userId: string
    ): Promise<SettingResponse[]> {
        const results: SettingResponse[] = [];

        for (const setting of settings) {
            const result = await this.update(
                setting.key,
                setting.value,
                userId,
                setting.description
            );
            results.push(result);
        }

        return results;
    }

    /**
     * Reset a setting to default (Super Admin only)
     */
    static async reset(key: string, userId: string): Promise<SettingResponse> {
        const defaultSetting = DEFAULT_SETTINGS[key];
        if (!defaultSetting) {
            throw new Error(`No default value for setting: ${key}`);
        }

        return this.update(key, defaultSetting.value, userId, defaultSetting.description);
    }

    /**
     * Clear cache (force reload from database)
     */
    static clearCache(): void {
        settingsCache.clear();
        cacheInitialized = false;
        logger.info('Settings cache cleared');
    }
}
