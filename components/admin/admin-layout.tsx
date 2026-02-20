"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import type { User } from "@/app/auth/actions"

interface AdminLayoutProps {
    children: React.ReactNode
    user: User | null
    currentView: 'overview' | 'inventory' | 'coupons' | 'supply_chain' | 'ambassadors'
}

export function AdminLayout({ children, user, currentView }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen bg-muted/40 font-sans">
            {/* Sidebar */}
            <AdminSidebar currentView={currentView} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <AdminHeader user={user} />

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}