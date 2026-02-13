import { z } from 'zod';

// System setting update schema
export const systemSettingSchema = z.object({
    key: z.string().min(1),
    value: z.string().min(1),
    description: z.string().optional(),
});

export type SystemSettingInput = z.infer<typeof systemSettingSchema>;

// Batch settings update
export const batchSettingsSchema = z.array(systemSettingSchema);

export type BatchSettingsInput = z.infer<typeof batchSettingsSchema>;

// Default settings keys
export enum SettingKey {
    // Affiliate/Commission Settings
    COMMISSION_RATE_BP = 'commission_rate_bp', // Basis points (500 = 5%)
    CUSTOMER_DISCOUNT_PERCENT = 'customer_discount_percent', // Percentage (5 = 5%)
    COMMISSION_HOLD_DAYS = 'commission_hold_days', // Days before commission is available

    // Platform Limits
    MAX_FILE_SIZE_MB = 'max_file_size_mb',
    MAX_BULK_ORDER_QTY = 'max_bulk_order_qty',
    MIN_ORDER_AMOUNT_CENTS = 'min_order_amount_cents',

    // Payment Settings
    PAYMENT_TIMEOUT_MINUTES = 'payment_timeout_minutes',
    REFUND_WINDOW_DAYS = 'refund_window_days',
}

// Default values
export const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
    [SettingKey.COMMISSION_RATE_BP]: {
        value: '500',
        description: 'Ambassador commission rate in basis points (500 = 5%)',
    },
    [SettingKey.CUSTOMER_DISCOUNT_PERCENT]: {
        value: '5',
        description: 'Customer discount when using referral code (%)',
    },
    [SettingKey.COMMISSION_HOLD_DAYS]: {
        value: '14',
        description: 'Days to hold commission before available for withdrawal',
    },
    [SettingKey.MAX_FILE_SIZE_MB]: {
        value: '5',
        description: 'Maximum file upload size in megabytes',
    },
    [SettingKey.MAX_BULK_ORDER_QTY]: {
        value: '10000',
        description: 'Maximum quantity allowed in a single order',
    },
    [SettingKey.MIN_ORDER_AMOUNT_CENTS]: {
        value: '1000',
        description: 'Minimum order amount in cents',
    },
    [SettingKey.PAYMENT_TIMEOUT_MINUTES]: {
        value: '30',
        description: 'Payment session timeout in minutes',
    },
    [SettingKey.REFUND_WINDOW_DAYS]: {
        value: '14',
        description: 'Days within which refunds are allowed',
    },
};
