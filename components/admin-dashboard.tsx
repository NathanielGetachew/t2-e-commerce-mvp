"use client"

import { useState } from "react"

import type { User as MockUser } from "@/app/auth/actions"

// Define shared Order types for the dashboard
export type DashboardOrderStatus = 'ordered' | 'warehouse_china' | 'shipped' | 'customs_addis' | 'delivered'

export interface DashboardOrder {
  id: string
  customerName: string
  customerEmail: string
  product: string
  totalAmount: number
  status: DashboardOrderStatus
}



// Import modular components
import { AdminSidebar } from "./admin/admin-sidebar"
import { AdminHeader } from "./admin/admin-header"
import { AdminOverview } from "./admin/admin-overview"
import { AdminInventory } from "./admin/admin-inventory"
import { AdminCoupons } from "./admin/admin-coupons"
import { AdminSupplyChain } from "./admin/admin-supply-chain"
import { AdminAmbassadors } from "./admin/admin-ambassadors"

interface AdminDashboardProps {
  orders: DashboardOrder[]
  onStatusUpdate: (orderId: string, newStatus: any) => void
  user: MockUser | null
}

export function AdminDashboard({ orders, onStatusUpdate, user }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'inventory' | 'coupons' | 'supply_chain' | 'ambassadors'>('overview')

  const handleLogout = async () => {
    // redirect to home which will handle auth check or just reload
    window.location.href = '/'
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
          {activeView === 'ambassadors' && (
            <AdminAmbassadors />
          )}
        </main>
      </div>
    </div>
  )
}
