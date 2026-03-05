import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminSupplyChain } from '@/components/admin/admin-supply-chain'

export const dynamic = 'force-dynamic'

export default async function AdminSupplyChainPage() {
    const user = await getUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        redirect('/')
    }

    return (
        <AdminLayout user={user} currentView="supply_chain">
            <AdminSupplyChain />
        </AdminLayout>
    )
}