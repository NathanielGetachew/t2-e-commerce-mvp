"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Package, Users, TrendingUp, ShoppingBag, Eye, MousePointerClick } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Bar, BarChart, ResponsiveContainer } from "recharts"
import { DashboardOrder as Order, DashboardOrderStatus as OrderStatus } from "../../types/admin"
import type { User } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface AdminOverviewProps {
    orders: Order[]
    totalOrders: number
    analytics: any
    user: User | null
    onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: "ordered", label: "Order Placed" },
    { value: "warehouse_china", label: "Warehouse China" },
    { value: "shipped", label: "Shipped" },
    { value: "customs_addis", label: "Customs Addis" },
    { value: "delivered", label: "Delivered" },
]

const STATUS_COLORS: Record<OrderStatus, string> = {
    ordered: "#3B82F6",
    warehouse_china: "#EAB308",
    shipped: "#A855F7",
    customs_addis: "#F97316",
    delivered: "#10B981",
}

export function AdminOverview({ orders, totalOrders, analytics, user, onStatusUpdate }: AdminOverviewProps) {
    // Determine stats from props or analytics
    const totalRevenue = analytics?.revenueTrend ? analytics.revenueTrend.reduce((acc: number, curr: any) => acc + curr.revenue, 0) : 0
    // totalOrders prop is the total count in DB
    const uniqueCustomers = new Set(orders.map((o) => o.customerEmail)).size // estimation from current view
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const statusDistribution = STATUS_OPTIONS.map((status) => ({
        name: status.label,
        value: orders.filter((o) => o.status === status.value).length,
        fill: STATUS_COLORS[status.value],
    })).filter((item) => item.value > 0)

    const revenueTrend = analytics?.revenueTrend || []

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case "ordered":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            case "warehouse_china":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            case "shipped":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            case "customs_addis":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
            case "delivered":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            default:
                return ""
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {user?.role === "SUPER_ADMIN" && (
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ETB</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                +12% from last month
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">All time orders</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Traffic</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.traffic?.visitors?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Visitors this month</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.traffic?.conversionRate || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Visit to Sales</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {user?.role === "SUPER_ADMIN" ? (
                    <>
                        {/* Super Admin Row 1: Revenue (4) + Pie (3) */}
                        <Card className="col-span-4 shadow-sm">
                            <CardHeader>
                                <CardTitle>Revenue Trend</CardTitle>
                                <CardDescription>Monthly revenue performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{ revenue: { label: "Revenue" } }}
                                    className="h-[300px] w-full"
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={revenueTrend}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                            <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                                            <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-3 shadow-sm">
                            <CardHeader>
                                <CardTitle>Order Distribution</CardTitle>
                                <CardDescription>Status breakdown</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{ orders: { label: "Orders" } }}
                                    className="h-[280px] w-full"
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} strokeWidth={0}>
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                            <div className="px-6 pb-6 grid grid-cols-2 gap-2 text-xs">
                                {statusDistribution.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                                        <span className="font-medium truncate">{item.name}</span>
                                        <span className="text-muted-foreground ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                ) : (
                    <>
                        {/* Regular Admin Row 1: Pie (3) + Top Products (4) */}
                        <Card className="col-span-3 shadow-sm">
                            <CardHeader>
                                <CardTitle>Order Distribution</CardTitle>
                                <CardDescription>Status breakdown</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{ orders: { label: "Orders" } }}
                                    className="h-[280px] w-full"
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} strokeWidth={0}>
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                            <div className="px-6 pb-6 grid grid-cols-2 gap-2 text-xs">
                                {statusDistribution.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                                        <span className="font-medium truncate">{item.name}</span>
                                        <span className="text-muted-foreground ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="col-span-4 shadow-sm">
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
                                        {analytics?.topProducts?.map((product: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium text-sm">{product.name}</TableCell>
                                                <TableCell className="text-right">{product.sales}</TableCell>
                                                <TableCell className="text-right">{(product.revenue).toLocaleString()} ETB</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Super Admin Top Products Row (Full Width or separate) */}
                {user?.role === "SUPER_ADMIN" && (
                    <Card className="col-span-full shadow-sm">
                        <CardHeader>
                            <CardTitle>Top Performing Inventory</CardTitle>
                            <CardDescription>Detailed breakdown of high-velocity items</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead className="text-right">Units Sold</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                        <TableHead className="text-right">Avg. Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics?.topProducts?.map((product: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-right">{product.sales}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">{(product.revenue).toLocaleString()} ETB</TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {Math.round(product.revenue / product.sales).toLocaleString()} ETB
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Order Table */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>Manage and track shipment statuses</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium text-sm">{order.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">{order.product}</TableCell>
                                    <TableCell className="font-medium">
                                        {order.totalAmount.toLocaleString()} ETB
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={cn("rounded-full", getStatusColor(order.status))}>
                                            {STATUS_OPTIONS.find((s) => s.value === order.status)?.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Select value={order.status} onValueChange={(value: string) => onStatusUpdate(order.id, value as OrderStatus)}>
                                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATUS_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
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

                    {/* Simple Pagination Controls */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button variant="outline" size="sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm" disabled>Next</Button>
                        <span className="text-xs text-muted-foreground">Pagination Logic TBD (Client vs Server)</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
