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

export async function getAdminOrders() {
    const user = await getUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return []
    }

    if (isDatabaseAvailable) {
        // Fetch from Prisma and map to DashboardOrder
        const orders = await prisma.order.findMany({
            include: { user: true, items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return orders.map(o => ({
            id: o.id,
            customerName: o.user.name || 'Unknown',
            customerEmail: o.user.email || 'No Email',
            product: o.items.map(i => i.product.name).join(', '),
            totalAmount: o.totalCents / 100, // Assuming cents
            status: o.status.toLowerCase() as DashboardOrderStatus // simple mapping for mvp
        }))
    } else {
        const mockDbPath = path.join(process.cwd(), 'app/lib/mock-db/orders.json')
        try {
            const data = await fs.readFile(mockDbPath, 'utf-8')
            return JSON.parse(data)
        } catch (e) {
            console.error("Mock orders not found", e)
            return []
        }
    }
}
