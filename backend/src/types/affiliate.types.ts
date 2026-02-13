import { z } from 'zod';

// Ambassador application schema
export const ambassadorApplicationSchema = z.object({
    socialLinks: z.object({
        instagram: z.string().url().optional(),
        facebook: z.string().url().optional(),
        tiktok: z.string().url().optional(),
        twitter: z.string().url().optional(),
    }).optional(),
    whyJoin: z.string().min(50, 'Please provide at least 50 characters explaining why you want to join'),
    marketingStrategy: z.string().min(50, 'Please provide at least 50 characters about your marketing strategy'),
});

export type AmbassadorApplicationInput = z.infer<typeof ambassadorApplicationSchema>;

// Custom code update schema
export const customCodeSchema = z.object({
    customCode: z.string()
        .min(3, 'Code must be at least 3 characters')
        .max(20, 'Code must be at most 20 characters')
        .regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens, and underscores'),
});

export type CustomCodeInput = z.infer<typeof customCodeSchema>;

// Referral validation schema
export const referralCodeSchema = z.object({
    code: z.string().min(3, 'Referral code is required'),
});

export type ReferralCodeInput = z.infer<typeof referralCodeSchema>;
