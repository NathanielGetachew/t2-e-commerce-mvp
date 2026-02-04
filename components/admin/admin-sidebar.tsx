"use client"

import { Button } from "@/components/ui/button"
import { LayoutDashboard, Package, Tag, LogOut, Settings, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
    activeView: 'overview' | 'inventory' | 'coupons' | 'supply_chain'
    setActiveView: (view: 'overview' | 'inventory' | 'coupons' | 'supply_chain') => void
    onLogout: () => void
}

export function AdminSidebar({ activeView, setActiveView, onLogout }: AdminSidebarProps) {
    return (
        <div className="w-64 border-r bg-card min-h-screen p-4 flex flex-col gap-8">
            <div className="flex items-center gap-2 px-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">T2</span>
                </div>
                <span className="font-bold text-xl">Admin</span>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                <Button
                    variant={activeView === 'overview' ? 'secondary' : 'ghost'}
                    className={cn("justify-start gap-2", activeView === 'overview' && "font-semibold")}
                    onClick={() => setActiveView('overview')}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Overview
                </Button>
                <Button
                    variant={activeView === 'inventory' ? 'secondary' : 'ghost'}
                    className={cn("justify-start gap-2", activeView === 'inventory' && "font-semibold")}
                    onClick={() => setActiveView('inventory')}
                >
                    <Package className="h-4 w-4" />
                    Inventory & Approvals
                </Button>
                <Button
                    variant={activeView === 'coupons' ? 'secondary' : 'ghost'}
                    className={cn("justify-start gap-2", activeView === 'coupons' && "font-semibold")}
                    onClick={() => setActiveView('coupons')}
                >
                    <Tag className="h-4 w-4" />
                    Coupons
                </Button>
                <Button
                    variant={activeView === 'supply_chain' ? 'secondary' : 'ghost'}
                    className={cn("justify-start gap-2", activeView === 'supply_chain' && "font-semibold")}
                    onClick={() => setActiveView('supply_chain')}
                >
                    <Truck className="h-4 w-4" />
                    Supply Chain
                </Button>
            </nav>

            <div className="mt-auto border-t pt-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                    <Settings className="h-4 w-4" />
                    Settings (Coming Soon)
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onLogout}>
                    <LogOut className="h-4 w-4" />
                    Log Out
                </Button>
            </div>
        </div>
    )
}
