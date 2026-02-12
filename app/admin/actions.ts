'use server'

import { revalidatePath } from 'next/cache'
import { getUser } from '@/app/auth/actions'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { DashboardOrderStatus } from '@/components/admin-dashboard'
// import mockOrders from '@/app/lib/mock-db/orders.json' // We'll load this dynamically to avoid build-time static issues if needed, or just import
import { promises as fs } from 'fs'
import path from 'path'

export async function updateOrderStatus(orderId: string, newStatus: DashboardOrderStatus) {
    try {
        const user = await getUser()
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return { error: 'Unauthorized' }
        }

        if (isDatabaseAvailable) {
            await prisma.order.update({
                where: { id: orderId },
                data: { status: newStatus.toUpperCase() as any } // Mapping might be needed if enums differ
            })
        } else {
            // Update mock file logic would go here, or we just pretend for the demo
            console.log(`[MOCK] Updated order ${orderId} to ${newStatus}`)
            // In a real mock setup, we might write back to the file, but for MVP instructions usually say "read", writing to JSON can be flaky in some envs.
            // We will try to write it to persist state for the user session.
            const mockDbPath = path.join(process.cwd(), 'app/lib/mock-db/orders.json')
            const data = await fs.readFile(mockDbPath, 'utf-8')
            const orders = JSON.parse(data)
            const orderIndex = orders.findIndex((o: any) => o.id === orderId)
            if (orderIndex >= 0) {
                orders[orderIndex].status = newStatus
                await fs.writeFile(mockDbPath, JSON.stringify(orders, null, 2))
            }
        }

        revalidatePath('/admin/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to update order status:', error)
        return { error: 'Failed to update status' }
    }
}


export async function getAdminOrders(page = 1, limit = 10) {
    const user = await getUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return { orders: [], total: 0 }
    }

    const skip = (page - 1) * limit

    if (isDatabaseAvailable) {
        // Fetch from Prisma and map to DashboardOrder
        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                include: { user: true, items: { include: { product: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.order.count()
        ])

        return {
            orders: orders.map(o => ({
                id: o.id,
                customerName: o.user.name || 'Unknown',
                customerEmail: o.user.email || 'No Email',
                product: o.items.map(i => i.product.name).join(', '),
                totalAmount: o.totalCents / 100, // Assuming cents
                status: o.status.toLowerCase() as DashboardOrderStatus // simple mapping for mvp
            })),
            total
        }
    } else {
        const mockDbPath = path.join(process.cwd(), 'app/lib/mock-db/orders.json')
        try {
            const data = await fs.readFile(mockDbPath, 'utf-8')
            const allOrders = JSON.parse(data)
            const total = allOrders.length
            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            const paginatedOrders = allOrders.slice(startIndex, endIndex)
            return { orders: paginatedOrders, total }
        } catch (e) {
            console.error("Mock orders not found", e)
            return { orders: [], total: 0 }
        }
    }
}

export async function getAdminAnalytics() {
    // Mock analytics data
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
