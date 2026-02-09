"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Warehouse, Ship, Landmark, MapPin } from "lucide-react"
import { DashboardOrder, DashboardOrderStatus as OrderStatus } from "./admin-dashboard"
import { cn } from "@/lib/utils"

// Extend for tracking view if needed
interface Order extends DashboardOrder {
  timestamp: string
}


interface TrackingViewProps {
  orders: Order[]
  initialSearchId?: string
  onSearchIdChange?: (id: string) => void
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: "ordered", label: "Order Placed", icon: Package },
  { status: "warehouse_china", label: "Warehouse China", icon: Warehouse },
  { status: "shipped", label: "Shipped", icon: Ship },
  { status: "customs_addis", label: "Customs Addis", icon: Landmark },
  { status: "delivered", label: "Delivered", icon: MapPin },
]

export function TrackingView({ orders, initialSearchId = "", onSearchIdChange }: TrackingViewProps) {
  const [searchId, setSearchId] = useState(initialSearchId)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (initialSearchId) {
      const order = orders.find((o) => o.id === initialSearchId)
      setSelectedOrder(order || null)
    }
  }, [initialSearchId, orders])

  // Update order when orders change (e.g., from admin updates)
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find((o) => o.id === selectedOrder.id)
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
      }
    }
  }, [orders, selectedOrder])

  const handleSearch = () => {
    const order = orders.find((o) => o.id === searchId)
    setSelectedOrder(order || null)
    if (onSearchIdChange) {
      onSearchIdChange(searchId)
    }
    if (!order) {
      alert("Order not found. Please check the Order ID.")
    }
  }

  const getStatusIndex = (status: OrderStatus) => {
    return STATUS_STEPS.findIndex((step) => step.status === status)
  }

  const currentStatusIndex = selectedOrder ? getStatusIndex(selectedOrder.status) : -1

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{"Track Your Order"}</CardTitle>
          <CardDescription>{"Enter your Order ID to view real-time shipment status"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter Order ID"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>{"Search"}</Button>
          </div>
        </CardContent>
      </Card>

      {selectedOrder && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl mb-2">{selectedOrder.id}</CardTitle>
                <CardDescription>
                  {"Customer: "}
                  {selectedOrder.customerName} {" • "}
                  {"Product: "}
                  {selectedOrder.product}
                </CardDescription>
              </div>
              <Badge
                variant={selectedOrder.status === "delivered" ? "default" : "outline"}
                className={cn("h-fit", selectedOrder.status === "delivered" && "bg-green-600 text-white")}
              >
                {STATUS_STEPS.find((s) => s.status === selectedOrder.status)?.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-border">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {/* Status Steps */}
              <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-2">
                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex

                  return (
                    <div key={step.status} className="flex flex-col items-center text-center">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2 bg-background transition-all mb-3",
                          isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground",
                          isCurrent && "ring-4 ring-primary/20 animate-pulse",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p
                        className={cn("text-xs font-medium", isCompleted ? "text-foreground" : "text-muted-foreground")}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <Badge variant="outline" className="mt-2 bg-accent/10 border-accent text-accent-foreground">
                          {"In Progress"}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {"Last Updated: "}
                {new Date(selectedOrder.timestamp).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedOrder && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">{"Enter an Order ID above to track your shipment"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
