'use server'

import { revalidatePath } from 'next/cache'
import { getUser } from '@/app/auth/actions'
import { serverFetch } from '@/lib/server-api'
import { DashboardOrderStatus } from '@/components/admin-dashboard'

/**
 * Update order status (Admin only)
 */
export async function updateOrderStatus(orderId: string, newStatus: DashboardOrderStatus) {
    try {
        const user = await getUser()
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return { error: 'Unauthorized' }
        }

        const response = await serverFetch(`/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        })

        if (!response.success) {
            return { error: response.error || 'Failed to update status' }
        }

        revalidatePath('/admin/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to update order status:', error)
        return { error: 'Failed to update status' }
    }
}

/**
 * Update shipment status (Admin only)
 */
export async function updateShipmentStatus(shipmentId: string, newStatus: string) {
    try {
        const user = await getUser()
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return { error: 'Unauthorized' }
        }

        const response = await serverFetch(`/admin/shipments/${shipmentId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        })

        if (!response.success) {
            return { error: response.error || 'Failed to update shipment status' }
        }

        revalidatePath('/admin/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to update shipment status:', error)
        return { error: 'Failed to update shipment status' }
    }
}

/**
 * Get admin orders (Admin only)
 */
export async function getAdminOrders(page = 1, limit = 10) {
    const user = await getUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return { orders: [], total: 0 }
    }

    const response = await serverFetch(`/admin/orders?page=${page}&limit=${limit}`)

    if (!response.success || !response.data) {
        console.error('Failed to fetch admin orders:', response.error)
        return { orders: [], total: 0 }
    }

    return {
        orders: response.data.orders || [],
        total: response.data.total || 0,
    }
}

/**
 * Get admin shipments (Admin only)
 */
export async function getAdminShipments(page = 1, limit = 20) {
    const user = await getUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return { shipments: [], total: 0 }
    }

    const response = await serverFetch(`/admin/shipments?page=${page}&limit=${limit}`)

    if (!response.success || !response.data) {
        console.error('Failed to fetch admin shipments:', response.error)
        return { shipments: [], total: 0 }
    }

    return {
        shipments: response.data.shipments || [],
        total: response.data.total || 0,
    }
}

/**
 * Get admin analytics (Admin only)
 */
export async function getAdminAnalytics() {
    const user = await getUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        // Return fallback data for non-authenticated view
        return getFallbackAnalytics()
    }

    const response = await serverFetch('/admin/analytics')

    if (!response.success || !response.data) {
        console.error('Failed to fetch admin analytics:', response.error)
        return getFallbackAnalytics()
    }

    return response.data
}

function getFallbackAnalytics() {
    return {
        revenueTrend: [
            { month: "Jan", revenue: 125000 },
            { month: "Feb", revenue: 145000 },
            { month: "Mar", revenue: 167000 },
            { month: "Apr", revenue: 189000 },
            { month: "May", revenue: 210000 },
        ],
        topProducts: [
            { name: "Industrial Sewing Machine", sales: 120, revenue: 1800000 },
            { name: "Solar Panels (Bulk)", sales: 85, revenue: 4250000 },
            { name: "Coffee Processing Unit", sales: 40, revenue: 8800000 },
            { name: "Commercial Blender", sales: 210, revenue: 630000 },
        ],
        traffic: {
            visitors: 12500,
            conversionRate: 3.2,
            avgSession: "4m 12s"
        }
    }
}
