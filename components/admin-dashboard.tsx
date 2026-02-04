"use client"

import { useState } from "react"
import type { Order, OrderStatus } from "@/app/page"
import type { User as MockUser } from "@/app/auth/actions"

// Import modular components
import { AdminSidebar } from "./admin/admin-sidebar"
import { AdminHeader } from "./admin/admin-header"
import { AdminOverview } from "./admin/admin-overview"
import { AdminInventory } from "./admin/admin-inventory"
import { AdminCoupons } from "./admin/admin-coupons"
import { AdminSupplyChain } from "./admin/admin-supply-chain"

interface AdminDashboardProps {
  orders: Order[]
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void
  user: MockUser | null
}

export function AdminDashboard({ orders, onStatusUpdate, user }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'inventory' | 'coupons' | 'supply_chain'>('overview')

  const handleLogout = () => {
    // Determine logout path based on env/cookies/etc, but for now we'll just reload or redirect
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen bg-muted/40 font-sans">
      {/* Sidebar */}
      <AdminSidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <AdminHeader user={user} />

        {/* View Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeView === 'overview' && (
            <AdminOverview orders={orders} user={user} onStatusUpdate={onStatusUpdate} />
          )}
          {activeView === 'inventory' && (
            <AdminInventory user={user} />
          )}
          {activeView === 'coupons' && (
            <AdminCoupons user={user} />
          )}
          {activeView === 'supply_chain' && (
            <AdminSupplyChain />
          )}
        </main>
      </div>
    </div>
  )
}
