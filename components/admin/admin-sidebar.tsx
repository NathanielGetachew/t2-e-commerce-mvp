"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Package, Tag, LogOut, Settings, Truck, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
    currentView?: 'overview' | 'inventory' | 'coupons' | 'supply_chain' | 'ambassadors'
}

import { signOut } from "@/app/auth/actions"

export function AdminSidebar({ currentView }: AdminSidebarProps) {
    const pathname = usePathname()

    const handleLogout = async () => {
        await signOut()
        window.location.href = "/"
    }

    const isActive = (path: string) => pathname === path

    return (
        <div className="w-64 border-r bg-card min-h-screen p-4 flex flex-col gap-8">
            <div className="flex items-center gap-2 px-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">T2</span>
                </div>
                <span className="font-bold text-xl">Admin</span>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                <Link href="/admin/dashboard">
                    <Button
                        variant={isActive('/admin/dashboard') ? 'secondary' : 'ghost'}
                        className={cn("justify-start gap-2 w-full", isActive('/admin/dashboard') && "font-semibold")}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Overview
                    </Button>
                </Link>
                <Link href="/admin/inventory">
                    <Button
                        variant={isActive('/admin/inventory') ? 'secondary' : 'ghost'}
                        className={cn("justify-start gap-2 w-full", isActive('/admin/inventory') && "font-semibold")}
                    >
                        <Package className="h-4 w-4" />
                        Inventory & Approvals
                    </Button>
                </Link>
                <Link href="/admin/coupons">
                    <Button
                        variant={isActive('/admin/coupons') ? 'secondary' : 'ghost'}
                        className={cn("justify-start gap-2 w-full", isActive('/admin/coupons') && "font-semibold")}
                    >
                        <Tag className="h-4 w-4" />
                        Coupons
                    </Button>
                </Link>
                <Link href="/admin/supply-chain">
                    <Button
                        variant={isActive('/admin/supply-chain') ? 'secondary' : 'ghost'}
                        className={cn("justify-start gap-2 w-full", isActive('/admin/supply-chain') && "font-semibold")}
                    >
                        <Truck className="h-4 w-4" />
                        Supply Chain
                    </Button>
                </Link>
                <Link href="/admin/ambassadors">
                    <Button
                        variant={isActive('/admin/ambassadors') ? 'secondary' : 'ghost'}
                        className={cn("justify-start gap-2 w-full", isActive('/admin/ambassadors') && "font-semibold")}
                    >
                        <Users className="h-4 w-4" />
                        Ambassadors
                    </Button>
                </Link>
            </nav>

            <div className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                </Button>
                <Button variant="ghost" className="justify-start gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
