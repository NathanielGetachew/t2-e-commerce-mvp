"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/components/providers/cart-provider"
import { trackReferralClick } from "@/app/actions/affiliate-actions"

export function ReferralTracker() {
    const searchParams = useSearchParams()
    const { applyCoupon } = useCart()

    useEffect(() => {
        const refCode = searchParams.get('ref')
        if (refCode) {
            // Track the click
            trackReferralClick(refCode).catch(console.error)

            // Auto-apply if it's a valid code
            // This re-uses the coupon logic since referral codes act like coupons for the buyer
            applyCoupon(refCode).then(result => {
                if (result.success) {
                    console.log(`Referral code ${refCode} applied.`)
                }
            })
        }
    }, [searchParams, applyCoupon])

    return null
}
