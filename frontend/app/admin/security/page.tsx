"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, Unlock, Mail, Clock } from "lucide-react"
import { getSecurityRisksAction, toggleUserBlockAction } from "@/app/admin/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { AdminLayout } from "@/components/admin/admin-layout"

interface SecurityRiskUser {
    id: string
    name: string | null
    email: string | null
    failedLoginAttempts: number
    totalFailedLoginAttempts: number
    lockedUntil: string | null
    isBlocked: boolean
    createdAt: string
}

export default function SecurityPage() {
    const [risks, setRisks] = useState<SecurityRiskUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const res = await getSecurityRisksAction()
        if (res.error) {
            toast.error(res.error)
        } else {
            setRisks(res.risks || [])
        }
        setLoading(false)
    }

    const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
        const loadingToast = toast.loading(isBlocked ? "Unblocking user..." : "Blocking user...")
        const res = await toggleUserBlockAction(userId, !isBlocked)

        if (res.error) {
            toast.error(res.error, { id: loadingToast })
        } else {
            toast.success(isBlocked ? "User has been unblocked" : "User has been permanently blocked", { id: loadingToast })
            await loadData()
        }
    }

    const isCurrentlyLocked = (lockedUntil: string | null) => {
        if (!lockedUntil) return false
        return new Date(lockedUntil) > new Date()
    }

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor potential security threats and manage user access.
                    </p>
                </div>

                <div className="grid gap-6">
                    <Card className="border-red-200 shadow-sm">
                        <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900 pb-4">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <ShieldAlert className="h-5 w-5" />
                                <CardTitle className="text-lg">High-Risk Accounts</CardTitle>
                            </div>
                            <CardDescription>
                                Users with over 10 total failed login attempts or currently blocked accounts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">Analysing security data...</div>
                            ) : risks.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                                        <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <p className="text-lg font-medium text-emerald-700 dark:text-emerald-400">No active security threats</p>
                                    <p className="text-sm">Your systems are currently secure.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {risks.map((user) => {
                                        const locked = isCurrentlyLocked(user.lockedUntil)
                                        return (
                                            <div key={user.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors hover:bg-muted/50 ${user.isBlocked ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${user.isBlocked ? 'bg-red-100 text-red-600' : locked ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {user.isBlocked ? <Lock className="h-5 w-5" /> : locked ? <Clock className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-lg">{user.name || 'Unnamed User'}</h3>
                                                            {user.isBlocked ? (
                                                                <Badge variant="destructive">Blocked</Badge>
                                                            ) : locked ? (
                                                                <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">Temp Locked</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Warning</Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail className="h-3.5 w-3.5" />
                                                                {user.email || 'No email provided'}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
                                                            <div>
                                                                <span className="text-muted-foreground mr-2">Lifetime Failed Attempts:</span>
                                                                <span className={`font-mono font-medium ${user.totalFailedLoginAttempts > 50 ? 'text-red-600' : 'text-orange-600'}`}>
                                                                    {user.totalFailedLoginAttempts}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground mr-2">Recent Failed Attempts:</span>
                                                                <span className="font-mono font-medium select-all">{user.failedLoginAttempts}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0">
                                                    <Button
                                                        variant={user.isBlocked ? "outline" : "destructive"}
                                                        onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                                                        className="w-full md:w-auto"
                                                    >
                                                        {user.isBlocked ? (
                                                            <>
                                                                <Unlock className="h-4 w-4 mr-2" />
                                                                Unblock User
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Lock className="h-4 w-4 mr-2" />
                                                                Block Permanently
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    )
}
