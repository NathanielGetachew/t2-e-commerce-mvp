"use client"

import { useState, useEffect } from "react"
import { getUser, User } from "@/app/auth/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { upgradeToAmbassador } from "@/app/auth/actions"
import { Loader2, Copy, Users, DollarSign, TrendingUp } from "lucide-react"
import { Header } from "@/components/header"

export default function AmbassadorDashboard() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isUpgrading, setIsUpgrading] = useState(false)

    useEffect(() => {
        getUser().then(u => {
            setUser(u)
            setLoading(false)
        })
    }, [])

    const handleUpgrade = async () => {
        if (!user) return
        setIsUpgrading(true)
        const result = await upgradeToAmbassador(user.id)
        if (result.success) {
            const updatedUser = await getUser()
            setUser(updatedUser)
        }
        setIsUpgrading(false)
    }

    const copyCode = () => {
        if (user?.referralCode) {
            navigator.clipboard.writeText(user.referralCode)
            alert("Referral code copied!")
        }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!user) {
        return <div className="p-8 text-center">Please login to access this page.</div>
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header activeTab="ambassador" onTabChange={() => { }} user={user} isAdmin={user.role === 'admin' || user.role === 'super-admin'} />

            <div className="container mx-auto max-w-5xl px-4 pt-24 text-left">
                <h1 className="text-3xl font-bold mb-2">Ambassador Program</h1>
                <p className="text-muted-foreground mb-8">Promote T2 products and earn commissions on every sale.</p>

                {!user.isAmbassador ? (
                    <Card className="text-center p-8 border-dashed border-2">
                        <CardHeader>
                            <CardTitle className="text-2xl">Become a T2 Brand Ambassador</CardTitle>
                            <CardDescription className="text-lg mt-2">
                                Join our network of successful partners. Earn 5% commission on all orders made using your unique referral code.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
                                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div className="bg-primary/10 p-3 h-fit rounded-full">
                                        <TrendingUp className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Track Sales</h3>
                                        <p className="text-sm text-muted-foreground">Real-time dashboard to monitor your performance.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div className="bg-primary/10 p-3 h-fit rounded-full">
                                        <DollarSign className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Earn Cash</h3>
                                        <p className="text-sm text-muted-foreground">Get paid monthly for all successful referrals.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div className="bg-primary/10 p-3 h-fit rounded-full">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Grow Network</h3>
                                        <p className="text-sm text-muted-foreground">Exclusive access to top-tier networking events.</p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleUpgrade} size="lg" className="w-full max-w-md" disabled={isUpgrading}>
                                {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Join Now - It's Free"}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">{user.totalEarnings || 0} ETB</div>
                                    <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">{user.commissionRate}%</div>
                                    <p className="text-xs text-muted-foreground mt-1">Standard Tier</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">0</div>
                                    <p className="text-xs text-muted-foreground mt-1">Successful Orders</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Referral Code */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">Your Unique Referral Code</h3>
                                    <p className="text-sm text-muted-foreground">Share this code with your network. They get a discount, you get paid.</p>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <div className="bg-background border px-4 py-2 rounded-lg font-mono text-lg font-bold tracking-wider">
                                        {user.referralCode}
                                    </div>
                                    <Button variant="outline" size="icon" onClick={copyCode}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
