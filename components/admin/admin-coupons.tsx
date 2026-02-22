"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tag, Plus, Loader2 } from "lucide-react"
import { getCoupons, createCoupon } from "@/app/actions/coupon-actions"
import type { Coupon } from "@/app/actions/coupon-actions"
import type { User } from "@/app/auth/actions"

interface AdminCouponsProps {
    user: User | null
}

export function AdminCoupons({ user }: AdminCouponsProps) {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [newCouponCode, setNewCouponCode] = useState("")
    const [newCouponDiscount, setNewCouponDiscount] = useState(10)
    const [newCouponHours, setNewCouponHours] = useState(24)
    const [isAddCouponOpen, setIsAddCouponOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [user?.id])

    const loadData = async () => {
        setLoading(true)
        if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
            const data = await getCoupons()
            setCoupons(data)
        }
        setLoading(false)
    }

    const handleCreateCoupon = async () => {
        if (!newCouponCode) return
        await createCoupon({
            code: newCouponCode,
            discountPercentage: Number(newCouponDiscount),
            validHours: Number(newCouponHours),
            targetProductId: "" // Global for now
        })
        setIsAddCouponOpen(false)
        setNewCouponCode("")
        loadData()
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Coupons</h2>
                    <p className="text-muted-foreground">Manage discount codes and promotions.</p>
                </div>
                {user?.role === "SUPER_ADMIN" && (
                    <Dialog open={isAddCouponOpen} onOpenChange={setIsAddCouponOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Create Coupon</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Coupon</DialogTitle>
                                <DialogDescription>Generate a discount code.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Coupon Code</Label>
                                    <Input value={newCouponCode} onChange={e => setNewCouponCode(e.target.value.toUpperCase())} placeholder="SAVE20" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Discount Percentage (%)</Label>
                                    <Input type="number" value={newCouponDiscount} onChange={e => setNewCouponDiscount(Number(e.target.value))} min={1} max={100} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Valid Duration (Hours)</Label>
                                    <Input type="number" value={newCouponHours} onChange={e => setNewCouponHours(Number(e.target.value))} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddCouponOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateCoupon}>Create Coupon</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Coupons</CardTitle>
                    <CardDescription>List of all active discount codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Expires</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.map(coupon => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                                    <TableCell><span className="text-green-600 font-bold">{coupon.discountPercentage}% OFF</span></TableCell>
                                    <TableCell>{coupon.createdBy}</TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(coupon.validUntil).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            {coupons.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No active coupons found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
