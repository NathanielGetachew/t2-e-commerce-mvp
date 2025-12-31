"use client"

import { Button } from "@/components/ui/button"
import { Users, Bell, Search, User as UserIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { User } from "@/app/auth/actions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { createAdmin } from "@/app/auth/actions"

interface AdminHeaderProps {
    user: User | null
}

export function AdminHeader({ user }: AdminHeaderProps) {
    // Add Admin State
    const [newAdminEmail, setNewAdminEmail] = useState("")
    const [newAdminPassword, setNewAdminPassword] = useState("")
    const [newAdminName, setNewAdminName] = useState("")
    const [newAdminPhone, setNewAdminPhone] = useState("")
    const [addAdminLoading, setAddAdminLoading] = useState(false)
    const [addAdminMessage, setAddAdminMessage] = useState<string | null>(null)
    const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        setAddAdminLoading(true)
        setAddAdminMessage(null)

        try {
            const result = await createAdmin({
                email: newAdminEmail,
                password: newAdminPassword,
                fullName: newAdminName,
                phone: newAdminPhone,
            })

            if (result.error) {
                setAddAdminMessage(`Error: ${result.error}`)
            } else {
                setAddAdminMessage("Admin created successfully!")
                setNewAdminEmail("")
                setNewAdminPassword("")
                setNewAdminName("")
                setNewAdminPhone("")
            }
        } catch (err) {
            setAddAdminMessage("An unexpected error occurred.")
        } finally {
            setAddAdminLoading(false)
        }
    }

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
            <div className="w-96">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search..." className="pl-9 w-full bg-background/50" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {user?.role === "super-admin" && (
                    <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="hidden md:flex">
                                <Users className="mr-2 h-4 w-4" /> Add Administrator
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Administrator</DialogTitle>
                                <DialogDescription>
                                    Create a new admin account with limited privileges.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateAdmin} className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label>{"Full Name"}</Label>
                                    <Input value={newAdminName} onChange={e => setNewAdminName(e.target.value)} required placeholder="Admin Name" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{"Email"}</Label>
                                    <Input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required type="email" placeholder="admin@t2.com" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{"Phone"}</Label>
                                    <Input value={newAdminPhone} onChange={e => setNewAdminPhone(e.target.value)} required placeholder="09..." />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{"Password"}</Label>
                                    <Input value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} required type="password" />
                                </div>
                                {addAdminMessage && (
                                    <p className={`text-sm ${addAdminMessage.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
                                        {addAdminMessage}
                                    </p>
                                )}
                                <Button type="submit" disabled={addAdminLoading} className="w-full">
                                    {addAdminLoading ? "Creating..." : "Create Admin"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 border border-card" />
                </Button>

                <div className="flex items-center gap-2 pl-4 border-l">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="h-4 w-4" />
                    </div>
                    <div className="hidden md:block">
                        <div className="text-sm font-medium">{user?.role === 'super-admin' ? 'Super Admin' : user?.fullName || 'Admin'}</div>
                        <div className="text-xs text-muted-foreground capitalize">{user?.role?.replace('-', ' ')}</div>
                    </div>
                </div>
            </div>
        </header>
    )
}
