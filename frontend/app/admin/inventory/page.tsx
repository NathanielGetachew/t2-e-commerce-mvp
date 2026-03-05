import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminInventory } from '@/components/admin/admin-inventory'

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
    const user = await getUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        redirect('/')
    }

    return (
        <AdminLayout user={user} currentView="inventory">
            <AdminInventory user={user} />
        </AdminLayout>
    )
}