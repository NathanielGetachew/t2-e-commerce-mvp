"use server"

import { serverFetch } from "@/lib/server-api"
import { getUser } from "@/app/auth/actions"
import type { User } from "@/app/auth/actions"

/**
 * Validate a referral code
 */
export async function validateReferralCode(code: string) {
    const response = await serverFetch('/affiliates/validate', {
        method: 'POST',
        body: JSON.stringify({ code }),
    })

    if (!response.success) {
        return { valid: false }
    }

    return {
        valid: true,
        discountPercentage: response.data?.discountPercentage || 5,
        ambassadorName: response.data?.ambassadorName,
    }
}

/**
 * Submit ambassador application
 */
export async function submitApplication(formData: {
    userId: string
    socialLinks: Record<string, string>
    whyJoin: string
    marketingStrategy: string
}) {
    const response = await serverFetch('/affiliates/apply', {
        method: 'POST',
        body: JSON.stringify(formData),
    })

    console.log("AFFILIATE APPLY RESPONSE:", JSON.stringify(response, null, 2))

    if (!response.success) {
        // Expose detailed validation errors to the frontend component
        const errorMsg = response.data?.details
            ? `Validation failed: ${JSON.stringify(response.data.details)}`
            : response.error || 'Application failed'
        return { success: false, error: errorMsg }
    }

    return { success: true }
}

/**
 * Approve an ambassador (Admin only)
 */
export async function approveAmbassador(userId: string) {
    const response = await serverFetch(`/affiliates/applications/${userId}/approve`, {
        method: 'POST',
    })

    if (!response.success) {
        return { success: false, error: response.error || 'Failed to approve' }
    }

    return { success: true }
}

/**
 * Reject an ambassador (Admin only)
 */
export async function rejectAmbassador(userId: string) {
    const response = await serverFetch(`/affiliates/applications/${userId}/reject`, {
        method: 'POST',
    })

    if (!response.success) {
        return { success: false, error: response.error || 'Failed to reject' }
    }

    return { success: true }
}

/**
 * Update custom referral code
 */
export async function updateCustomCode(userId: string, newCode: string) {
    const response = await serverFetch('/affiliates/custom-code', {
        method: 'PATCH',
        body: JSON.stringify({ code: newCode }),
    })

    if (!response.success) {
        return { success: false, error: response.error || 'Code update failed' }
    }

    return { success: true }
}

/**
 * Track a referral click
 */
export async function trackReferralClick(code: string) {
    const response = await serverFetch('/affiliate/track-click', {
        method: 'POST',
        body: JSON.stringify({ code }),
    })

    return { success: response.success }
}

/**
 * Record a commission from a purchase
 */
export async function recordCommission(referralCode: string, orderAmount: number) {
    const response = await serverFetch('/affiliate/commission', {
        method: 'POST',
        body: JSON.stringify({ referralCode, orderAmount }),
    })

    if (!response.success) {
        return { success: false, error: response.error || 'Failed to record commission' }
    }

    return {
        success: true,
        earned: response.data?.earned || 0,
    }
}

/**
 * Get referral stats for current user
 */
export async function getReferralStats(userId: string) {
    const response = await serverFetch('/affiliates/stats')

    if (!response.success) {
        return null
    }

    return response.data
}

/**
 * Get pending ambassador applications (Admin only)
 */
export async function getAmbassadorApplications() {
    const response = await serverFetch('/affiliates/applications')

    if (!response.success) {
        console.error('[getAmbassadorApplications] Failed:', response.error)
        return []
    }

    return response.data?.applications || response.data || []
}

/**
 * Get all approved ambassadors (Admin only)
 */
export async function getAllAmbassadors() {
    const response = await serverFetch('/affiliates')

    if (!response.success) {
        console.error('[getAllAmbassadors] Failed:', response.error)
        return []
    }

    return response.data?.ambassadors || response.data || []
}
