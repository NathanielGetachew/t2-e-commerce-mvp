import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminOverview } from '@/components/admin/admin-overview'
import { getAdminOrders, updateOrderStatus, getAdminAnalytics } from '../actions'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const user = await getUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        redirect('/auth/login')
    }

    const { orders, total } = await getAdminOrders(1, 10)
    const analytics = await getAdminAnalytics()

    return (
        <AdminLayout user={user} currentView="overview">
            <AdminOverview
                orders={orders}
                totalOrders={total}
                analytics={analytics}
                user={user}
                onStatusUpdate={updateOrderStatus}
            />
        </AdminLayout>
    )
}
