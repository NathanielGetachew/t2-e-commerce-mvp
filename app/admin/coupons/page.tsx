import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminCoupons } from '@/components/admin/admin-coupons'

export const dynamic = 'force-dynamic'

export default async function AdminCouponsPage() {
    const user = await getUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        redirect('/')
    }

    return (
        <AdminLayout user={user} currentView="coupons">
            <AdminCoupons user={user} />
        </AdminLayout>
    )
}