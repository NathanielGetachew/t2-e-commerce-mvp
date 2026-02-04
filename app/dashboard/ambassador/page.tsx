"use client"

import { useState, useEffect } from "react"
import { getUser, User } from "@/app/auth/actions"
import { updateCustomCode, getReferralStats } from "@/app/actions/affiliate-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Copy, Users, DollarSign, TrendingUp, Check, AlertCircle, Edit2 } from "lucide-react"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { AmbassadorApplicationForm } from "@/components/ambassador/application-form"
import { useToast } from "@/components/ui/use-toast"

interface DashboardStats {
    clicks: number
    conversions: number
    revenueGenerated: number
    totalEarnings: number
    commissionRate: number
}

export default function AmbassadorDashboard() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats | null>(null)

    // Copy state
    const [copiedCode, setCopiedCode] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)

    // Custom code state
    const [isEditingCode, setIsEditingCode] = useState(false)
    const [newCode, setNewCode] = useState("")
    const [codeError, setCodeError] = useState("")
    const [codeLoading, setCodeLoading] = useState(false)

    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        fetchUserAndStats()
    }, [router])

    async function fetchUserAndStats() {
        const u = await getUser()
        if (!u) {
            router.push("/auth/login?redirect=/dashboard/ambassador")
            return
        }
        setUser(u)
        setNewCode(u.customCode || u.referralCode || "")

        if (u.embassadorStatus === 'approved' || u.isAmbassador) {
            const s = await getReferralStats(u.id)
            if (s) {
                setStats({
                    clicks: s.metrics.clicks,
                    conversions: s.metrics.conversions,
                    revenueGenerated: s.metrics.revenueGenerated,
                    totalEarnings: s.totalEarnings,
                    commissionRate: s.commissionRate
                })
            }
        }
        setLoading(false)
    }

    const handleCodeUpdate = async () => {
        if (!user) return
        setCodeLoading(true)
        setCodeError("")

        try {
            const result = await updateCustomCode(user.id, newCode)
            if (result.success) {
                setIsEditingCode(false)
                await fetchUserAndStats()
            } else {
                setCodeError(result.error || "Failed to update code")
            }
        } catch (err) {
            setCodeError("An error occurred")
        } finally {
            setCodeLoading(false)
        }
    }

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        const setCopied = type === 'code' ? setCopiedCode : setCopiedLink

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text)
                setCopied(true)
            } else {
                throw new Error("Clipboard API unavailable")
            }
        } catch (err) {
            // Fallback
            const textArea = document.createElement("textarea")
            textArea.value = text
            textArea.style.position = "fixed"
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            try {
                document.execCommand('copy')
                setCopied(true)
            } catch (err) { }
            document.body.removeChild(textArea)
        }

        setTimeout(() => setCopied(false), 2000)
    }

    // RENDER HELPERS
    const handleApplicationSuccess = () => {
        toast({
            title: "Application Submitted!",
            description: "We've received your application. Redirecting to home...",
        })
        fetchUserAndStats()

        // Redirect to home after 2 seconds as requested, but also showing the pending state briefly
        setTimeout(() => {
            window.location.href = '/'
        }, 2000)
    }

    const renderApplication = () => (
        <div className="max-w-2xl mx-auto">
            <AmbassadorApplicationForm
                userId={user!.id}
                onSuccess={handleApplicationSuccess}
            />
        </div>
    )

    const renderPending = () => (
        <div className="max-w-xl mx-auto text-center py-20">
            <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Application Under Review</h2>
            <p className="text-muted-foreground text-lg mb-8">
                Thanks for applying! Our team is reviewing your application.
                We usually respond within 24-48 hours. Check back soon.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
                Return to Store
            </Button>
        </div>
    )

    const renderRejected = () => (
        <div className="max-w-xl mx-auto text-center py-20">
            <div className="bg-red-500/10 text-red-500 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Application Status</h2>
            <p className="text-muted-foreground text-lg mb-8">
                Unfortunately, your application to the Ambassador Program was not approved at this time.
            </p>
            <Button variant="default" onClick={() => window.location.href = '/'}>
                Return to Store
            </Button>
        </div>
    )

    const renderDashboard = () => (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-card border rounded-xl p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">My Referral Code</h2>
                        <div className="flex items-center gap-3">
                            {isEditingCode ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={newCode}
                                        onChange={(e) => setNewCode(e.target.value)}
                                        placeholder="Enter custom code"
                                        className="max-w-[200px]"
                                    />
                                    <Button size="sm" onClick={handleCodeUpdate} disabled={codeLoading}>
                                        {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingCode(false)}>Cancel</Button>
                                </div>
                            ) : (
                                <>
                                    <code className="text-3xl font-mono font-bold text-primary">
                                        {user?.customCode || user?.referralCode}
                                    </code>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditingCode(true)}>
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </>
                            )}
                        </div>
                        {codeError && <p className="text-red-500 text-sm mt-2">{codeError}</p>}
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="w-full justify-between gap-4"
                            onClick={() => copyToClipboard(user?.customCode || user?.referralCode || "", 'code')}
                        >
                            Copy Code
                            {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                            className="w-full justify-between gap-4"
                            onClick={() => {
                                const link = `${window.location.origin}/?ref=${user?.customCode || user?.referralCode}`
                                copyToClipboard(link, 'link')
                            }}
                        >
                            Copy Affiliate Link
                            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.totalEarnings?.toFixed(2) || "0.00"}</div>
                        <p className="text-xs text-muted-foreground">Lifetime commission</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.clicks || 0}</div>
                        <p className="text-xs text-muted-foreground">Total unique visitors</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.conversions || 0}</div>
                        <p className="text-xs text-muted-foreground">Completed orders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.clicks ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : "0.0"}%
                        </div>
                        <p className="text-xs text-muted-foreground">Click to purchase</p>
                    </CardContent>
                </Card>
            </div>

            {/* Guide Section */}
            <div className="bg-card border rounded-xl p-8">
                <h3 className="text-xl font-bold mb-4">Ambassador Guide</h3>
                <div className="prose dark:prose-invert max-w-none">
                    <p>Share your unique code <strong>{user?.customCode || user?.referralCode}</strong> with your audience.</p>
                    <ul>
                        <li>They get <strong>5% off</strong> their purchase.</li>
                        <li>You earn <strong>5% commission</strong> on every sale.</li>
                        <li>Use your affiliate link to automatically apply the code at checkout.</li>
                    </ul>
                </div>
            </div>
        </div>
    )

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header
                activeTab="ambassador"
                onTabChange={(tab) => {
                    window.location.href = `/?tab=${tab}`
                }}
                user={user}
                isAdmin={user.role === 'admin' || user.role === 'super-admin'}
            />

            <div className="container mx-auto max-w-5xl px-4 pt-24 text-left">
                {!user.ambassadorStatus || user.ambassadorStatus === 'none' ? renderApplication() :
                    user.ambassadorStatus === 'pending' ? renderPending() :
                        user.ambassadorStatus === 'rejected' ? renderRejected() :
                            renderDashboard()}
            </div>
        </div>
    )
}
