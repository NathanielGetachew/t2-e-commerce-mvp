"use server"

import { serverFetch } from "@/lib/server-api"
import { getUser } from "@/app/auth/actions"

export interface Coupon {
    id: string
    code: string
    discountPercentage: number
    targetProductId?: string
    validUntil: string
    maxUses?: number
    currentUses?: number
    minOrderAmountCents?: number
    createdBy: string
    createdAt?: string
}

/**
 * Get all coupons (Admin only)
 */
export async function getCoupons(): Promise<Coupon[]> {
    const user = await getUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
        return []
    }

    const response = await serverFetch('/coupons')

    if (!response.success) {
        console.error('[getCoupons] Failed:', response.error)
        return []
    }

    return response.data?.coupons || response.data || []
}

/**
 * Create a coupon (Super Admin only)
 */
export async function createCoupon(data: {
    code: string
    discountPercentage: number
    targetProductId?: string
    validHours: number
    maxUses?: number
    minOrderAmountCents?: number
}) {
    const user = await getUser()
    if (!user || user.role !== "SUPER_ADMIN") {
        return { error: "Only Super Admin can create coupons" }
    }

    const response = await serverFetch('/coupons', {
        method: 'POST',
        body: JSON.stringify({
            code: data.code.toUpperCase(),
            discountPercentage: data.discountPercentage,
            targetProductId: data.targetProductId || undefined,
            validHours: data.validHours,
            maxUses: data.maxUses,
            minOrderAmountCents: data.minOrderAmountCents,
        }),
    })

    if (!response.success) {
        return { error: response.error || 'Failed to create coupon' }
    }

    return { success: true, coupon: response.data }
}

/**
 * Validate a coupon code (Public)
 */
export async function validateCoupon(code: string, productId?: string) {
    const response = await serverFetch('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
            code: code.toUpperCase(),
            productId,
        }),
    })

    if (!response.success) {
        return { error: response.error || 'Invalid coupon code' }
    }

    return {
        success: true,
        discountPercentage: response.data?.discountPercentage,
    }
}

/**
 * Delete a coupon (Super Admin only)
 */
export async function deleteCoupon(couponId: string) {
    const user = await getUser()
    if (!user || user.role !== "SUPER_ADMIN") {
        return { error: "Only Super Admin can delete coupons" }
    }

    const response = await serverFetch(`/coupons/${couponId}`, {
        method: 'DELETE',
    })

    if (!response.success) {
        return { error: response.error || 'Failed to delete coupon' }
    }

    return { success: true }
}
