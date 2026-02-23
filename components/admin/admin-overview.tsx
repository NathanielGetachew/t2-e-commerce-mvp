"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Package, Users, TrendingUp, TrendingDown, Eye, MousePointerClick, RefreshCcw, ArrowUp, ArrowDown, Minus, Activity } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, AreaChart, Area } from "recharts"
import { DashboardOrder as Order, DashboardOrderStatus as OrderStatus } from "../../types/admin"
import type { User } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getAdminOrders, getAdminAnalytics } from "@/app/admin/actions"

interface AdminOverviewProps {
    orders: Order[]
    totalOrders: number
    analytics: any
    user: User | null
    onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<{ success?: boolean; error?: string }> | void
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: "PENDING", label: "Pending" },
    { value: "PAID", label: "Paid" },
    { value: "FULFILLING", label: "Fulfilling" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
    // Legacy values for backward compat
    { value: "ordered", label: "Order Placed" },
    { value: "warehouse_china", label: "Warehouse China" },
    { value: "customs_addis", label: "Customs Addis" },
]

const STATUS_COLORS: Record<string, string> = {
    // Prisma values
    PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    FULFILLING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    // Legacy values
    ordered: "bg-blue-100 text-blue-800",
    warehouse_china: "bg-yellow-100 text-yellow-800",
    shipped: "bg-purple-100 text-purple-800",
    customs_addis: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
}

// Color for order distribution pie chart
const STATUS_PIE_COLORS: Record<string, string> = {
    PENDING: "#3B82F6",
    PAID: "#10B981",
    FULFILLING: "#EAB308",
    SHIPPED: "#A855F7",
    DELIVERED: "#22C55E",
    CANCELLED: "#EF4444",
    REFUNDED: "#6B7280",
    ordered: "#3B82F6",
    warehouse_china: "#EAB308",
    shipped: "#A855F7",
    customs_addis: "#F97316",
    delivered: "#10B981",
}

const AUTO_REFRESH_INTERVAL = 120_000 // 2 minutes

export function AdminOverview({ orders: initialOrders, totalOrders: initialTotal, analytics: initialAnalytics, user, onStatusUpdate }: AdminOverviewProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [totalOrders, setTotalOrders] = useState(initialTotal)
    const [analytics, setAnalytics] = useState<any>(initialAnalytics)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pulse, setPulse] = useState(false)

    const refreshData = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const [{ orders: newOrders, total }, newAnalytics] = await Promise.all([
                getAdminOrders(1, 20),
                getAdminAnalytics(),
            ])
            setOrders(newOrders)
            setTotalOrders(total)
            setAnalytics(newAnalytics)
            setLastUpdated(new Date())
            // Brief pulse for visual feedback
            setPulse(true)
            setTimeout(() => setPulse(false), 800)
        } catch (e) {
            console.error("Failed to refresh analytics:", e)
        } finally {
            setIsRefreshing(false)
        }
    }, [])

    // Optimistically update local state, then call the server action.
    // This prevents the Select from snapping back to the old value.
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        const prevOrders = orders
        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        try {
            const result = await onStatusUpdate(orderId, newStatus)
            if (result && (result as any).error) {
                // Roll back on server error
                setOrders(prevOrders)
                console.error('Status update failed:', (result as any).error)
            }
        } catch (e) {
            setOrders(prevOrders)
            console.error('Status update failed:', e)
        }
    }

    // Auto-refresh every 30s
    useEffect(() => {
        const id = setInterval(refreshData, AUTO_REFRESH_INTERVAL)
        return () => clearInterval(id)
    }, [refreshData])

    // Derived stats
    const totalRevenue = analytics?.revenueTrend
        ? analytics.revenueTrend.reduce((acc: number, curr: any) => acc + curr.revenue, 0)
        : 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const statusDistribution = Object.entries(
        orders.reduce((acc: Record<string, number>, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1
            return acc
        }, {})
    ).map(([status, value]) => ({
        name: STATUS_OPTIONS.find(s => s.value === status)?.label || status,
        value,
        fill: STATUS_PIE_COLORS[status] || "#94a3b8",
    }))

    const revenueTrend = analytics?.revenueTrend || []

    const getStatusColor = (status: string) => STATUS_COLORS[status] || "bg-gray-100 text-gray-800"

    const timeSinceUpdate = () => {
        const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
        if (s < 10) return "Just now"
        if (s < 60) return `${s}s ago`
        return `${Math.floor(s / 60)}m ago`
    }

    return (
        <div className="space-y-6">
            {/* Header with live indicator */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-sm text-muted-foreground mt-1">Real-time analytics and order management</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-full text-xs text-muted-foreground">
                        <span className={cn("relative flex h-2 w-2")}>
                            <span className={cn(
                                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                pulse ? "bg-green-400" : "bg-green-400"
                            )} />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <Activity className="h-3 w-3" />
                        Live · {timeSinceUpdate()}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCcw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {user?.role === "SUPER_ADMIN" && (
                    <Card className={cn("shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500", pulse && "ring-2 ring-blue-100")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            <div className="h-8 w-8 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ETB</div>
                            <div className="flex items-center gap-1 mt-1">
                                <ArrowUp className="h-3 w-3 text-green-500" />
                                <p className="text-xs text-green-600 font-medium">+12% from last month</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className={cn("shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-purple-500", pulse && "ring-2 ring-purple-100")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                        <div className="h-8 w-8 bg-purple-50 dark:bg-purple-950 rounded-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-purple-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Minus className="h-3 w-3" /> All time total
                        </p>
                    </CardContent>
                </Card>

                <Card className={cn("shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500", pulse && "ring-2 ring-amber-100")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
                        <div className="h-8 w-8 bg-amber-50 dark:bg-amber-950 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB</div>
                        <p className="text-xs text-muted-foreground mt-1">Per order average</p>
                    </CardContent>
                </Card>

                <Card className={cn("shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500", pulse && "ring-2 ring-emerald-100")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                        <div className="h-8 w-8 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center">
                            <MousePointerClick className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.traffic?.conversionRate || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Visit to purchase</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Revenue Trend Chart */}
                {user?.role === "SUPER_ADMIN" && (
                    <Card className="col-span-full lg:col-span-4 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Revenue Trend
                                <Badge variant="secondary" className="text-xs font-normal">Live</Badge>
                            </CardTitle>
                            <CardDescription>Monthly revenue performance (ETB)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{ revenue: { label: "Revenue (ETB)", color: "#3b82f6" } }}
                                className="h-[280px] w-full"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueTrend}>
                                        <defs>
                                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                        <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                                        <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Order Status Distribution */}
                <Card className={cn("shadow-sm", user?.role === "SUPER_ADMIN" ? "col-span-full lg:col-span-3" : "col-span-full lg:col-span-3")}>
                    <CardHeader>
                        <CardTitle>Order Status</CardTitle>
                        <CardDescription>Live distribution of {orders.length} orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statusDistribution.length > 0 ? (
                            <ChartContainer
                                config={{ orders: { label: "Orders" } }}
                                className="h-[220px] w-full"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} strokeWidth={0}>
                                            {statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <Package className="h-8 w-8 opacity-20" />
                                <p className="text-sm">No orders yet</p>
                            </div>
                        )}
                    </CardContent>
                    <div className="px-6 pb-6 space-y-2">
                        {statusDistribution.map((item) => (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                                <span className="text-muted-foreground flex-1">{item.name}</span>
                                <span className="font-semibold tabular-nums">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Top Products for regular admin */}
                {user?.role !== "SUPER_ADMIN" && analytics?.topProducts?.length > 0 && (
                    <Card className="col-span-full lg:col-span-4 shadow-sm">
                        <CardHeader>
                            <CardTitle>Top Products</CardTitle>
                            <CardDescription>Best selling items by sales volume</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead className="text-right">Sales</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.topProducts.map((product: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium text-sm">{product.name}</TableCell>
                                            <TableCell className="text-right">{product.sales}</TableCell>
                                            <TableCell className="text-right">{product.revenue.toLocaleString()} ETB</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Super Admin Top Products */}
            {user?.role === "SUPER_ADMIN" && analytics?.topProducts?.length > 0 && (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Top Performing Inventory</CardTitle>
                        <CardDescription>Detailed breakdown of high-velocity items</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">#</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead className="text-right">Units Sold</TableHead>
                                    <TableHead className="text-right">Total Revenue</TableHead>
                                    <TableHead className="text-right">Avg. Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analytics.topProducts.map((product: any, i: number) => (
                                    <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                                        <TableCell className="text-muted-foreground font-mono">{i + 1}</TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-right tabular-nums">{product.sales}</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600 tabular-nums">{product.revenue.toLocaleString()} ETB</TableCell>
                                        <TableCell className="text-right text-muted-foreground tabular-nums">
                                            {product.sales > 0 ? Math.round(product.revenue / product.sales).toLocaleString() : 0} ETB
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Order Table */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>Manage and track individual order statuses</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono">{orders.length} shown</Badge>
                </CardHeader>
                <CardContent>
                    {orders.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <Package className="h-10 w-10 opacity-20 mx-auto mb-3" />
                            <p>No orders yet</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Update Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-mono text-xs text-muted-foreground">{order.orderNumber || order.id.slice(0, 8)}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-sm">{order.customerName || "—"}</div>
                                                <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[180px] truncate text-sm" title={order.product}>{order.product}</TableCell>
                                        <TableCell className="font-semibold tabular-nums">
                                            {order.totalAmount?.toLocaleString()} ETB
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={cn("rounded-full text-xs", getStatusColor(order.status))}>
                                                {STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={order.status}
                                                onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                                            >
                                                <SelectTrigger className="w-[148px] h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value} className="text-xs">
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
