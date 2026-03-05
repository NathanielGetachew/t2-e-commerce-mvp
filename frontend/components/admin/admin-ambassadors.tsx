"use client"

import { useState, useEffect } from "react"
import { getAmbassadorApplications, getAllAmbassadors, approveAmbassador, rejectAmbassador } from "@/app/actions/affiliate-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Check, X, ExternalLink, RefreshCcw } from "lucide-react"

// Matches the shape returned by backend GET /api/affiliates
interface AmbassadorData {
    id: string
    email: string | null
    name: string | null
    ambassadorCode: string | null
    commissionRateBp: number
    isAmbassador: boolean
    totalEarnings?: number
    metrics?: { clicks: number; conversions: number; revenueGenerated: number }
}

// Matches the shape returned by backend GET /api/affiliates/applications
interface ApplicationData {
    id: string
    userId: string
    userEmail: string
    userName: string | null
    applicationData: {
        socialLinks?: Record<string, string>
        whyJoin?: string
        marketingStrategy?: string
    } | null
    status: string
    createdAt: string
}

export function AdminAmbassadors() {
    const [activeTab, setActiveTab] = useState("overview")
    const [applications, setApplications] = useState<ApplicationData[]>([])
    const [ambassadors, setAmbassadors] = useState<AmbassadorData[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        const [apps, ambs] = await Promise.all([
            getAmbassadorApplications(),
            getAllAmbassadors()
        ])
        setApplications(apps)
        setAmbassadors(ambs)
        setLoading(false)
    }

    const handleApprove = async (userId: string) => {
        setProcessingId(userId)
        await approveAmbassador(userId)
        await fetchAllData()
        setProcessingId(null)
    }

    const handleReject = async (userId: string) => {
        setProcessingId(userId)
        await rejectAmbassador(userId)
        await fetchAllData()
        setProcessingId(null)
    }

    if (loading && ambassadors.length === 0 && applications.length === 0) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Ambassador Management</h2>
                <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading}>
                    <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview & Stats</TabsTrigger>
                    <TabsTrigger value="applications">
                        Applications
                        {applications.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {applications.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Ambassadors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{ambassadors.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Apps</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{applications.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{ambassadors.reduce((sum, a) => sum + (a.metrics?.clicks || 0), 0)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${ambassadors.reduce((sum, a) => sum + (a.metrics?.revenueGenerated || 0), 0).toFixed(2)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Ambassadors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="py-3 font-medium">Name</th>
                                            <th className="py-3 font-medium">Code</th>
                                            <th className="py-3 font-medium">Clicks</th>
                                            <th className="py-3 font-medium">Conversions</th>
                                            <th className="py-3 font-medium">Revenue</th>
                                            <th className="py-3 font-medium">Earnings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ambassadors.map(amb => (
                                            <tr key={amb.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-3">{amb.name || amb.email || "—"}</td>
                                                <td className="py-3 font-mono">{amb.ambassadorCode || "—"}</td>
                                                <td className="py-3">{amb.metrics?.clicks || 0}</td>
                                                <td className="py-3">{amb.metrics?.conversions || 0}</td>
                                                <td className="py-3">${amb.metrics?.revenueGenerated?.toFixed(2) || "0.00"}</td>
                                                <td className="py-3 font-bold text-green-600">${amb.totalEarnings?.toFixed(2) || "0.00"}</td>
                                            </tr>
                                        ))}
                                        {ambassadors.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-muted-foreground">No active ambassadors yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="applications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Applications</CardTitle>
                            <CardDescription>Review and approve new ambassador requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {applications.map(app => (
                                    <div key={app.id} className="flex flex-col md:flex-row justify-between p-6 border rounded-xl gap-6 bg-card hover:bg-muted/30 transition-colors">
                                        <div className="space-y-4 flex-1">
                                            <div>
                                                <h3 className="font-bold text-lg">{app.userName || app.userEmail || "—"}</h3>
                                                <p className="text-sm text-muted-foreground">{app.userEmail}</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="bg-muted p-3 rounded-lg">
                                                    <p className="font-semibold mb-1">Why they want to join:</p>
                                                    <p className="text-muted-foreground">{app.applicationData?.whyJoin}</p>
                                                </div>
                                                <div className="bg-muted p-3 rounded-lg">
                                                    <p className="font-semibold mb-1">Marketing Strategy:</p>
                                                    <p className="text-muted-foreground">{app.applicationData?.marketingStrategy}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {app.applicationData?.socialLinks && Object.entries(app.applicationData.socialLinks as Record<string, string>).map(([platform, url]) => (
                                                    <a
                                                        key={platform}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-xs hover:bg-blue-500/20 capitalize"
                                                    >
                                                        {platform} <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[120px]">
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleApprove(app.id)}
                                                disabled={!!processingId}
                                            >
                                                {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Approve</>}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => handleReject(app.id)}
                                                disabled={!!processingId}
                                            >
                                                {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-2" /> Reject</>}
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {applications.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No pending applications.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
