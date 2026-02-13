import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface CouponResponse {
    id: string;
    code: string;
    discountPercentage: number;
    targetProductId: string | null;
    validUntil: Date;
    maxUses: number | null;
    currentUses: number;
    minOrderAmountCents: number;
    createdBy: string;
    createdAt: Date;
}

export interface CouponValidationResult {
    valid: boolean;
    discountPercentage?: number;
    error?: string;
}

export class CouponService {
    /**
     * Create a new coupon (Super Admin only)
     */
    static async createCoupon(
        code: string,
        discountPercentage: number,
        validHours: number,
        createdBy: string,
        targetProductId?: string,
        maxUses?: number,
        minOrderAmountCents?: number
    ): Promise<CouponResponse> {
        // Check if code already exists
        const existing = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (existing) {
            throw new Error('A coupon with this code already exists');
        }

        // Calculate expiration
        const validUntil = new Date();
        validUntil.setHours(validUntil.getHours() + validHours);

        // Create coupon
        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                discountPercentage,
                targetProductId,
                validUntil,
                maxUses,
                minOrderAmountCents: minOrderAmountCents || 0,
                createdBy,
            },
        });

        logger.info(`Coupon created: ${coupon.code} (${discountPercentage}% off) by ${createdBy}`);

        return this.formatCoupon(coupon);
    }

    /**
     * Get all coupons (Admin only)
     */
    static async getAllCoupons(includeExpired: boolean = false): Promise<CouponResponse[]> {
        const where: any = {};

        if (!includeExpired) {
            where.validUntil = {
                gte: new Date(),
            };
        }

        const coupons = await prisma.coupon.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return coupons.map(this.formatCoupon);
    }

    /**
     * Get coupon by code
     */
    static async getCouponByCode(code: string): Promise<CouponResponse | null> {
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) return null;

        return this.formatCoupon(coupon);
    }

    /**
     * Validate coupon for use
     */
    static async validateCoupon(
        code: string,
        productId?: string,
        orderAmountCents?: number
    ): Promise<CouponValidationResult> {
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) {
            return { valid: false, error: 'Invalid coupon code' };
        }

        // Check expiration
        if (new Date() > coupon.validUntil) {
            return { valid: false, error: 'This coupon has expired' };
        }

        // Check max uses
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
            return { valid: false, error: 'This coupon has reached its usage limit' };
        }

        // Check product restriction
        if (coupon.targetProductId && coupon.targetProductId !== productId) {
            return { valid: false, error: 'This coupon is not valid for this product' };
        }

        // Check minimum order amount
        if (orderAmountCents && orderAmountCents < coupon.minOrderAmountCents) {
            const minAmount = (coupon.minOrderAmountCents / 100).toFixed(2);
            return {
                valid: false,
                error: `This coupon requires a minimum order of $${minAmount}`
            };
        }

        return {
            valid: true,
            discountPercentage: coupon.discountPercentage,
        };
    }

    /**
     * Apply coupon (increment usage count)
     * Call this after successful order creation
     */
    static async applyCoupon(code: string): Promise<void> {
        await prisma.coupon.update({
            where: { code: code.toUpperCase() },
            data: {
                currentUses: {
                    increment: 1,
                },
            },
        });

        logger.info(`Coupon ${code} applied (usage incremented)`);
    }

    /**
     * Delete expired coupons (cleanup task)
     */
    static async deleteExpiredCoupons(): Promise<number> {
        const result = await prisma.coupon.deleteMany({
            where: {
                validUntil: {
                    lt: new Date(),
                },
            },
        });

        logger.info(`Deleted ${result.count} expired coupons`);

        return result.count;
    }

    /**
     * Delete coupon by ID (Admin)
     */
    static async deleteCoupon(id: string): Promise<void> {
        await prisma.coupon.delete({
            where: { id },
        });

        logger.info(`Coupon deleted: ${id}`);
    }

    /**
     * Format coupon response
     */
    private static formatCoupon(coupon: any): CouponResponse {
        return {
            id: coupon.id,
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,
            targetProductId: coupon.targetProductId,
            validUntil: coupon.validUntil,
            maxUses: coupon.maxUses,
            currentUses: coupon.currentUses,
            minOrderAmountCents: coupon.minOrderAmountCents,
            createdBy: coupon.createdBy,
            createdAt: coupon.createdAt,
        };
    }
}
