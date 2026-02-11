import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { getAdminOrders, updateOrderStatus } from '../actions'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const user = await getUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        redirect('/')
    }

    const orders = await getAdminOrders()

    return (
        <AdminDashboard
            orders={orders}
            user={user}
            onStatusUpdate={updateOrderStatus}
        />
    )
}
