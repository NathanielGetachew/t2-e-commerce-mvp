"use server"

import { serverFetch } from "@/lib/server-api"

interface OrderPayload {
    cart: { productId: string; quantity: number }[]
    customer: {
        firstName: string
        lastName: string
        email: string
        phone: string
        address: string
        city: string
    }
    couponCode?: string
}

export async function createOrder(payload: OrderPayload): Promise<{
    success: boolean
    checkoutUrl?: string
    orderNumber?: string
    error?: string
}> {
    const response = await serverFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
    })

    if (!response.success) {
        const err = response.error || 'Failed to create order'
        return { success: false, error: typeof err === 'string' ? err : JSON.stringify(err) }
    }

    const data = response.data as any
    return {
        success: true,
        checkoutUrl: data?.checkoutUrl,
        orderNumber: data?.orderNumber,
    }
}
