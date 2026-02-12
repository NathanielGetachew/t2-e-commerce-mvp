import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { getAdminOrders, updateOrderStatus, getAdminAnalytics } from '../actions'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const user = await getUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        redirect('/')
    }

    const { orders, total } = await getAdminOrders(1, 10)
    const analytics = await getAdminAnalytics()

    return (
        <AdminDashboard
            orders={orders}
            totalOrders={total}
            analytics={analytics}
            user={user}
            onStatusUpdate={updateOrderStatus}
        />
    )
}
