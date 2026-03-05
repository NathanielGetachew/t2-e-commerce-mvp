import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminAmbassadors } from '@/components/admin/admin-ambassadors'

export const dynamic = 'force-dynamic'

export default async function AdminAmbassadorsPage() {
    const user = await getUser()

    if (!user || user.role !== 'SUPER_ADMIN') {
        redirect(user ? '/admin/dashboard' : '/')
    }

    return (
        <AdminLayout user={user} currentView="ambassadors">
            <AdminAmbassadors />
        </AdminLayout>
    )
}