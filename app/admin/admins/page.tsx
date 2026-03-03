import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminManagement } from '@/components/admin/admin-management'
import { getAdmins } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export default async function AdminManagementPage() {
    const user = await getUser()

    if (!user || user.role !== 'SUPER_ADMIN') {
        redirect('/admin/dashboard')
    }

    const { admins } = await getAdmins()

    return (
        <AdminLayout user={user} currentView="admins">
            <AdminManagement admins={admins} />
        </AdminLayout>
    )
}
