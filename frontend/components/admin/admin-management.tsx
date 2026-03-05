"use client"

import { useState, useTransition } from "react"
import { updateAdminAction, deleteAdminAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, ShieldCheck, UserCircle2 } from "lucide-react"

interface AdminUser {
    id: string
    email: string | null
    fullName: string | null
    role: string
    isAmbassador: boolean
}

interface AdminManagementProps {
    admins: AdminUser[]
}

export function AdminManagement({ admins: initialAdmins }: AdminManagementProps) {
    const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins)
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
    const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editError, setEditError] = useState<string | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const openEdit = (admin: AdminUser) => {
        setEditingAdmin(admin)
        setEditName(admin.fullName || "")
        setEditEmail(admin.email || "")
        setEditError(null)
    }

    const handleEdit = () => {
        if (!editingAdmin) return
        setEditError(null)

        const updates: { name?: string; email?: string } = {}
        if (editName.trim() && editName.trim() !== editingAdmin.fullName) updates.name = editName.trim()
        if (editEmail.trim() && editEmail.trim() !== editingAdmin.email) updates.email = editEmail.trim()

        if (Object.keys(updates).length === 0) {
            setEditingAdmin(null)
            return
        }

        startTransition(async () => {
            const result = await updateAdminAction(editingAdmin.id, updates)
            if (result.error) {
                setEditError(result.error)
                return
            }
            // Optimistically update local state
            setAdmins((prev) =>
                prev.map((a) =>
                    a.id === editingAdmin.id
                        ? { ...a, fullName: updates.name ?? a.fullName, email: updates.email ?? a.email }
                        : a
                )
            )
            setEditingAdmin(null)
        })
    }

    const handleDelete = () => {
        if (!deletingAdminId) return
        setDeleteError(null)

        startTransition(async () => {
            const result = await deleteAdminAction(deletingAdminId)
            if (result.error) {
                setDeleteError(result.error)
                return
            }
            setAdmins((prev) => prev.filter((a) => a.id !== deletingAdminId))
            setDeletingAdminId(null)
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Admin Management</h1>
                <p className="text-muted-foreground">
                    Manage admin accounts. Only Super Admins can view this page.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Admin Accounts
                    </CardTitle>
                    <CardDescription>
                        {admins.length} admin{admins.length !== 1 ? "s" : ""} in the system
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No admin accounts found.
                        </p>
                    ) : (
                        <div className="divide-y rounded-md border">
                            {admins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium leading-none">
                                                {admin.fullName || "(No name)"}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {admin.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">ADMIN</Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEdit(admin)}
                                            title="Edit admin"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => {
                                                setDeleteError(null)
                                                setDeletingAdminId(admin.id)
                                            }}
                                            title="Delete admin"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingAdmin} onOpenChange={(open) => !open && setEditingAdmin(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Admin</DialogTitle>
                        <DialogDescription>Update the admin&apos;s name or email address.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Full name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="admin@example.com"
                            />
                        </div>
                        {editError && (
                            <p className="text-sm text-destructive">{editError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingAdmin(null)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={isPending}>
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deletingAdminId}
                onOpenChange={(open) => !open && setDeletingAdminId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this admin account? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <p className="text-sm text-destructive px-1">{deleteError}</p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
