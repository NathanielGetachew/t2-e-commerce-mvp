import { z } from 'zod';

// Coupon creation schema
export const createCouponSchema = z.object({
    code: z.string()
        .min(3, 'Code must be at least 3 characters')
        .max(20, 'Code must be at most 20 characters')
        .regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens, and underscores'),
    discountPercentage: z.number()
        .min(1, 'Discount must be at least 1%')
        .max(100, 'Discount cannot exceed 100%'),
    targetProductId: z.string().optional(),
    validHours: z.number()
        .min(1, 'Must be valid for at least 1 hour')
        .max(8760, 'Cannot exceed 1 year'),
    maxUses: z.number().int().positive().optional(),
    minOrderAmountCents: z.number().int().min(0).optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

// Coupon validation schema
export const validateCouponSchema = z.object({
    code: z.string().min(1, 'Coupon code is required'),
    productId: z.string().optional(),
    orderAmountCents: z.number().int().positive().optional(),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
