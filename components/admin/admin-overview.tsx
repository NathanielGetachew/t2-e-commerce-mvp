"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Package, Users, TrendingUp } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from "recharts"
import type { Order, OrderStatus } from "@/app/page"
import type { User } from "@/app/auth/actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface AdminOverviewProps {
    orders: Order[]
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

export function AdminOverview({ orders, user, onStatusUpdate }: AdminOverviewProps) {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalOrders = orders.length
    const uniqueCustomers = new Set(orders.map((o) => o.customerEmail)).size
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const statusDistribution = STATUS_OPTIONS.map((status) => ({
        name: status.label,
        value: orders.filter((o) => o.status === status.value).length,
        fill: STATUS_COLORS[status.value],
    })).filter((item) => item.value > 0)

    const revenueTrend = [
        { month: "Jan", revenue: 125000 },
        { month: "Feb", revenue: 145000 },
        { month: "Mar", revenue: 167000 },
        { month: "Apr", revenue: 189000 },
        { month: "May", revenue: totalRevenue },
    ]

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
            <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {user?.role === "super-admin" && (
                    <Card>
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

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active shipments tracked</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueCustomers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Unique customers served</p>
                    </CardContent>
                </Card>

                {user?.role === "super-admin" && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Math.round(averageOrderValue).toLocaleString()} ETB</div>
                            <p className="text-xs text-muted-foreground mt-1">Per transaction average</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {user?.role === "super-admin" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Trend</CardTitle>
                            <CardDescription>Monthly revenue performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{ revenue: { label: "Revenue", color: "hsl(var(--chart-1))" } }}
                                className="h-[250px] w-full"
                            >
                                <LineChart data={revenueTrend}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                                    <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                <Card className={cn(user?.role !== "super-admin" && "col-span-full")}>
                    <CardHeader>
                        <CardTitle>Order Distribution</CardTitle>
                        <CardDescription>Status breakdown of current orders</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center gap-6">
                        <ChartContainer
                            config={{ orders: { label: "Orders" } }}
                            className="h-[250px] w-[250px]"
                        >
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} strokeWidth={0}>
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                        <div className="space-y-2 flex-1">
                            {statusDistribution.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Order Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Manage and track shipment statuses</CardDescription>
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
                                        <Select value={order.status} onValueChange={(value) => onStatusUpdate(order.id, value as OrderStatus)}>
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
                </CardContent>
            </Card>
        </div>
    )
}
