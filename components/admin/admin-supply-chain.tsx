"use client"

import { useState } from "react"
import mockShipments from "@/app/lib/mock-db/shipments.json"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Truck, ArrowRight, CheckCircle, Clock, MoreVertical } from "lucide-react"
import { updateShipmentStatus } from "@/app/admin/actions"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock type for shipment, ideally from a shared type file
interface Shipment {
    id: string
    trackingNumber: string
    supplier: string
    status: string
    origin: string
    destination: string
    expectedArrival: string
    items: { productName: string; quantity: number }[]
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
    "In Production": { color: "bg-blue-100 text-blue-700", icon: Clock },
    "In Transit": { color: "bg-orange-100 text-orange-700", icon: Truck },
    "Customs Clearance": { color: "bg-yellow-100 text-yellow-700", icon: ArrowRight },
    "Received": { color: "bg-green-100 text-green-700", icon: CheckCircle },
}

export function AdminSupplyChain() {
    const [shipments, setShipments] = useState<Shipment[]>(mockShipments)
    const [isUpdating, setIsUpdating] = useState<string | null>(null)

    const handleStatusUpdate = async (shipmentId: string, newStatus: string) => {
        setIsUpdating(shipmentId)
        const result = await updateShipmentStatus(shipmentId, newStatus)
        if (result.success) {
            setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status: newStatus } : s))
            toast.success("Shipment status updated")
        } else {
            toast.error(result.error || "Failed to update status")
        }
        setIsUpdating(null)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Supply Chain & Logistics</h2>
                <p className="text-muted-foreground">Track international shipments from manufacturers.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shipments.filter(s => s.status !== 'Received').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Customs</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shipments.filter(s => s.status === 'Customs Clearance').length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Incoming Shipments</CardTitle>
                    <CardDescription>Real-time status of all container orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tracking #</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>ETA</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shipments.map(shipment => {
                                const config = STATUS_CONFIG[shipment.status] || STATUS_CONFIG["In Production"]
                                const Icon = config.icon

                                return (
                                    <TableRow key={shipment.id}>
                                        <TableCell className="font-mono">{shipment.trackingNumber}</TableCell>
                                        <TableCell>{shipment.supplier}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`flex w-fit items-center gap-1 ${config.color}`}>
                                                <Icon className="h-3 w-3" />
                                                {shipment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {shipment.origin} <ArrowRight className="h-3 w-3 inline mx-1" /> {shipment.destination}
                                        </TableCell>
                                        <TableCell>{new Date(shipment.expectedArrival).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                {shipment.items.map((item, i) => (
                                                    <div key={i}>{item.quantity}x {item.productName}</div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" disabled={isUpdating === shipment.id}>
                                                        {isUpdating === shipment.id ? "..." : "Update"}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {Object.keys(STATUS_CONFIG).map((status) => (
                                                        <DropdownMenuItem
                                                            key={status}
                                                            onClick={() => handleStatusUpdate(shipment.id, status)}
                                                            className={shipment.status === status ? "bg-accent" : ""}
                                                        >
                                                            {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
