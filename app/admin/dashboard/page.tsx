import { getUser } from '@/app/auth/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const user = await getUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        redirect('/')
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
            <p>Welcome, {user.fullName}</p>
            <div className="mt-8">
                <p className="text-muted-foreground">Admin features coming soon...</p>
            </div>
        </div>
    )
}
