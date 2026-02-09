import { Suspense } from 'react'
import { Header } from '@/components/header'
import { getUser } from '@/app/auth/actions'
import { TrackingView } from '@/components/tracking-view'

export const dynamic = 'force-dynamic'

// For now, we reuse the existing TrackingView component but wrap it in a Server Page setup
export default async function TrackPage() {
    const user = await getUser()
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header user={user} isAdmin={isAdmin} />
            <main className="flex-1 py-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    {/* 
              TrackingView is currently a client component (`components/tracking-view`).
              We can pass initial orders here if we want to fetch them on server first,
              but the existing component has its own state.
              For MVP step 1 refactor, we just mount it. 
            */}
                    <TrackingView orders={[]} initialSearchId="" />
                </div>
            </main>
        </div>
    )
}
