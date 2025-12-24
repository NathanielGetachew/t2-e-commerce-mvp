"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from "recharts"
import type { Order, OrderStatus } from "@/app/page"
import { cn } from "@/lib/utils"
import { TrendingUp, DollarSign, Package, Users } from "lucide-react"

interface AdminDashboardProps {
  orders: Order[]
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

export function AdminDashboard({ orders, onStatusUpdate }: AdminDashboardProps) {
  const handleStatusChange = (orderId: string, newStatus: string) => {
    onStatusUpdate(orderId, newStatus as OrderStatus)
  }

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

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalOrders = orders.length
  const uniqueCustomers = new Set(orders.map((o) => o.customerEmail)).size
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Status distribution for pie chart
  const statusDistribution = STATUS_OPTIONS.map((status) => ({
    name: status.label,
    value: orders.filter((o) => o.status === status.value).length,
    fill: STATUS_COLORS[status.value],
  })).filter((item) => item.value > 0)

  // Revenue trend (mock data - in production would be from database)
  const revenueTrend = [
    { month: "Jan", revenue: 125000 },
    { month: "Feb", revenue: 145000 },
    { month: "Mar", revenue: 167000 },
    { month: "Apr", revenue: 189000 },
    { month: "May", revenue: totalRevenue },
  ]

  // Orders per day (mock trend)
  const ordersTrend = [
    { date: "Mon", orders: 5 },
    { date: "Tue", orders: 8 },
    { date: "Wed", orders: 6 },
    { date: "Thu", orders: 9 },
    { date: "Fri", orders: totalOrders },
  ]

  return (
    <div className="space-y-8">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{"Total Revenue"}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString()} {"ETB"}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{"12% from last month"}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{"Total Orders"}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">{"Active shipments tracked"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{"Customers"}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">{"Unique customers served"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{"Avg Order Value"}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(averageOrderValue).toLocaleString()} {"ETB"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{"Per transaction average"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{"Revenue Trend"}</CardTitle>
            <CardDescription>{"Monthly revenue over time"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[250px]"
            >
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{"Order Status Distribution"}</CardTitle>
            <CardDescription>{"Current order stages breakdown"}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              config={{
                orders: {
                  label: "Orders",
                },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="ml-6 space-y-2">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-sm">{`${item.name}: ${item.value}`}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{"Order Management"}</CardTitle>
          <CardDescription>{"Manage order statuses and track all shipments in real-time"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">{"Order ID"}</TableHead>
                  <TableHead className="font-semibold">{"Customer"}</TableHead>
                  <TableHead className="font-semibold">{"Product"}</TableHead>
                  <TableHead className="font-semibold">{"Amount"}</TableHead>
                  <TableHead className="font-semibold">{"Status"}</TableHead>
                  <TableHead className="font-semibold">{"Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.product}</TableCell>
                    <TableCell className="font-semibold">
                      {order.totalAmount.toLocaleString()} {"ETB"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", getStatusColor(order.status))}>
                        {STATUS_OPTIONS.find((s) => s.value === order.status)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                        <SelectTrigger className="w-[180px]">
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
          </div>

          <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-sm text-foreground font-medium mb-1">{"Admin Note:"}</p>
            <p className="text-sm text-muted-foreground">
              {"Updating order status here will automatically sync with the Customer Tracking View in real-time."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
