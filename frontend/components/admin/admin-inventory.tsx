"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2, Edit, Trash2, Search, AlertCircle, Package } from "lucide-react"
import { toast } from "sonner"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
    getProducts, getProposals, proposeProduct, handleProposal,
    uploadImage, createProduct, updateProduct, deleteProduct,
} from "@/app/actions/product-actions"
import type { Product, ProductProposal } from "@/app/actions/product-actions"
import type { User } from "@/app/auth/actions"

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminInventoryProps {
    user: User | null
}

type ProductFormData = Pick<Product, 'name' | 'description' | 'price' | 'stock' | 'images' | 'inStock'>

// ─── Shared ProductFormFields Sub-component ──────────────────────────────────

interface ProductFormFieldsProps {
    value: Partial<ProductFormData>
    onChange: (patch: Partial<ProductFormData>) => void
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    imageUploading: boolean
}

function ProductFormFields({ value, onChange, onImageUpload, imageUploading }: ProductFormFieldsProps) {
    const set = (patch: Partial<ProductFormData>) => onChange({ ...value, ...patch })

    return (
        <div className="space-y-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
                <Label>Product Name <span className="text-destructive">*</span></Label>
                <Input
                    value={value.name || ""}
                    onChange={e => set({ name: e.target.value })}
                    placeholder="e.g. Industrial Sewing Machine"
                />
            </div>

            {/* Price + Stock side by side */}
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Price (ETB) <span className="text-destructive">*</span></Label>
                    <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={value.price || ""}
                        onChange={e => set({ price: Number(e.target.value) })}
                        placeholder="0.00"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Stock Quantity</Label>
                    <Input
                        type="number"
                        min={0}
                        value={value.stock ?? ""}
                        onChange={e => {
                            const qty = Number(e.target.value)
                            set({ stock: qty, inStock: qty > 0 })
                        }}
                        placeholder="0"
                    />
                </div>
            </div>

            {/* In Stock toggle (linked to stock qty) */}
            <div className="flex items-center space-x-3 border p-3 rounded-md bg-muted/30">
                <Switch
                    checked={value.inStock !== false}
                    onCheckedChange={c => set({ inStock: c, stock: c ? (value.stock || 1) : 0 })}
                />
                <div>
                    <Label className="cursor-pointer">In Stock</Label>
                    <p className="text-xs text-muted-foreground">Toggle or set quantity above</p>
                </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
                <Label>Description <span className="text-destructive">*</span></Label>
                <Textarea
                    value={value.description || ""}
                    onChange={e => set({ description: e.target.value })}
                    placeholder="Describe the product in detail..."
                    className="min-h-[90px] resize-none"
                />
            </div>

            {/* Images */}
            <div className="grid gap-2">
                <Label>Images</Label>
                <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" onChange={onImageUpload} disabled={imageUploading} />
                    {imageUploading && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-muted-foreground" />}
                </div>
                {(value.images?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-1">
                        {value.images!.map((img, i) => (
                            <div key={i} className="relative group aspect-square border rounded-md overflow-hidden bg-muted/20">
                                <img src={img || "/placeholder.svg"} alt={`Image ${i + 1}`} className="object-cover w-full h-full" />
                                <button
                                    type="button"
                                    onClick={() => set({ images: value.images!.filter((_, idx) => idx !== i) })}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────

const EMPTY_FORM: Partial<ProductFormData> = { inStock: true, stock: 1 }

export function AdminInventory({ user }: AdminInventoryProps) {
    const isSuperAdmin = user?.role === 'SUPER_ADMIN'

    // Data
    const [products, setProducts] = useState<Product[]>([])
    const [proposals, setProposals] = useState<ProductProposal[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Add dialog
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [addForm, setAddForm] = useState<Partial<ProductFormData>>(EMPTY_FORM)
    const [isCreating, setIsCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    // Edit dialog
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [editForm, setEditForm] = useState<Partial<ProductFormData>>({})
    const [isUpdating, setIsUpdating] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)

    // Delete dialog
    const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Shared
    const [imageUploading, setImageUploading] = useState(false)
    const [proposalLoading, setProposalLoading] = useState<string | null>(null)

    // ── Data fetching ──────────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        setLoading(true)
        const [productsData, proposalsData] = await Promise.all([getProducts(), getProposals()])
        setProducts(productsData)
        setProposals(proposalsData.filter(p => p.status === 'pending'))
        setLoading(false)
    }, [])

    useEffect(() => { loadData() }, [loadData])

    // ── Client-side search ─────────────────────────────────────────────────────

    const filteredProducts = searchQuery.trim()
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : products

    // ── Image upload (factory creates isolated handler per form) ───────────────

    const makeImageUploadHandler = (setForm: React.Dispatch<React.SetStateAction<Partial<ProductFormData>>>) =>
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (!file) return
            setImageUploading(true)
            const fd = new FormData()
            fd.append("file", file)
            const result = await uploadImage(fd)
            setImageUploading(false)
            if (result.success && result.url) {
                setForm(prev => ({ ...prev, images: [...(prev.images || []), result.url as string] }))
                toast.success("Image uploaded")
            } else {
                toast.error("Upload failed: " + result.error)
            }
        }

    // ── Create ─────────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!addForm.name?.trim() || !addForm.price || !addForm.description?.trim()) {
            setCreateError("Please fill in all required fields: name, price, and description.")
            return
        }
        setCreateError(null)
        setIsCreating(true)

        const productData = {
            name: addForm.name,
            description: addForm.description,
            price: Number(addForm.price),
            images: addForm.images || [],
            stock: addForm.stock ?? (addForm.inStock !== false ? 1 : 0),
        }

        if (isSuperAdmin) {
            const result = await createProduct(productData)
            setIsCreating(false)
            if (result.success) {
                setIsAddOpen(false)
                setAddForm(EMPTY_FORM)
                loadData()
                toast.success("Product created successfully!")
            } else {
                setCreateError(result.error || 'Failed to create product')
            }
        } else {
            const result = await proposeProduct("add", { productData })
            setIsCreating(false)
            if (result.success !== false && !result.error) {
                setIsAddOpen(false)
                setAddForm(EMPTY_FORM)
                loadData()
                toast.success("Product creation proposal submitted for Super Admin approval.")
            } else {
                setCreateError(result.error || 'Failed to submit proposal')
            }
        }
    }

    // ── Edit ──────────────────────────────────────────────────────────────────

    const openEdit = (product: Product) => {
        setEditingProduct(product)
        setEditForm({
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            inStock: product.inStock,
            images: product.images,
        })
        setEditError(null)
        setIsEditOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editingProduct || !editForm.name?.trim() || !editForm.price) return
        setEditError(null)

        if (isSuperAdmin) {
            setIsUpdating(true)
            const result = await updateProduct(editingProduct.id, {
                name: editForm.name,
                description: editForm.description,
                price: Number(editForm.price),
                images: editForm.images,
                stock: editForm.stock ?? (editForm.inStock !== false ? 1 : 0),
            })
            setIsUpdating(false)
            if (result.success) {
                setIsEditOpen(false)
                loadData()
                toast.success("Product updated!")
            } else {
                setEditError(result.error || 'Failed to update product')
            }
        } else {
            // Regular ADMIN: submit a proposal for Super Admin review
            await proposeProduct("update", {
                targetProductId: editingProduct.id,
                productData: { ...editForm, price: Number(editForm.price) },
            })
            setIsEditOpen(false)
            loadData()
            toast.success("Update proposal submitted for Super Admin approval.")
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return
        setIsDeleting(true)
        if (isSuperAdmin) {
            const result = await deleteProduct(productToDelete.id)
            setIsDeleting(false)
            setProductToDelete(null)
            if (result.success) {
                loadData()
                toast.success("Product deactivated.")
            } else {
                toast.error(result.error || "Failed to deactivate product")
            }
        } else {
            await proposeProduct("remove", { targetProductId: productToDelete.id })
            setIsDeleting(false)
            setProductToDelete(null)
            loadData()
            toast.success("Removal proposal submitted for Super Admin approval.")
        }
    }

    // ── Proposals ─────────────────────────────────────────────────────────────

    const handleProposalAction = async (id: string, action: "approve" | "reject") => {
        setProposalLoading(id)
        const result = await handleProposal(id, action)
        setProposalLoading(null)
        if (result.error) {
            toast.error(`Failed to ${action} proposal: ` + result.error)
        } else {
            toast.success(`Proposal ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
            loadData()
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading inventory...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* ── Delete Confirmation ── */}
            <AlertDialog open={!!productToDelete} onOpenChange={open => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate "{productToDelete?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isSuperAdmin
                                ? "This will immediately mark the product as inactive and remove it from the store."
                                : "This will create a removal proposal for the Super Admin to review and approve."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                                : isSuperAdmin ? "Deactivate" : "Submit Proposal"
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Header + Add Product Dialog ── */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        {isSuperAdmin
                            ? "Manage products directly and review pending proposals."
                            : "Propose changes for Super Admin review."
                        }
                    </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={open => {
                    setIsAddOpen(open)
                    if (!open) { setCreateError(null); setAddForm(EMPTY_FORM) }
                }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[580px]">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            {createError && (
                                <Alert variant="destructive" className="mt-3">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{createError}</AlertDescription>
                                </Alert>
                            )}
                        </DialogHeader>
                        <ProductFormFields
                            value={addForm}
                            onChange={setAddForm}
                            onImageUpload={makeImageUploadHandler(setAddForm)}
                            imageUploading={imageUploading}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isCreating}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={imageUploading || isCreating}>
                                {isCreating
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                                    : "Create Product"
                                }
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* ── Edit Product Dialog ── */}
            <Dialog open={isEditOpen} onOpenChange={open => {
                setIsEditOpen(open)
                if (!open) setEditError(null)
            }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[580px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isSuperAdmin ? "Edit" : "Propose Edit:"} {editingProduct?.name}
                        </DialogTitle>
                        {editError && (
                            <Alert variant="destructive" className="mt-3">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{editError}</AlertDescription>
                            </Alert>
                        )}
                        {!isSuperAdmin && (
                            <p className="text-xs text-muted-foreground pt-1">
                                Changes will be submitted as a proposal for Super Admin approval.
                            </p>
                        )}
                    </DialogHeader>
                    <ProductFormFields
                        value={editForm}
                        onChange={setEditForm}
                        onImageUpload={makeImageUploadHandler(setEditForm)}
                        imageUploading={imageUploading}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={imageUploading || isUpdating}>
                            {isUpdating
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                                : isSuperAdmin ? "Save Changes" : "Submit Proposal"
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Product Table */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or description..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>Products</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {filteredProducts.length}{searchQuery ? ' found' : ' total'}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
                                    <Package className="h-10 w-10 opacity-25" />
                                    <p className="text-sm">
                                        {searchQuery
                                            ? `No products match "${searchQuery}"`
                                            : "No products yet. Click \"Add Product\" to get started."
                                        }
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-4">Product</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead className="text-right pr-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map(product => (
                                            <TableRow key={product.id}>
                                                <TableCell className="pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={product.images?.[0] || product.image || "/placeholder.svg"}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">{product.name}</p>
                                                            {product.description && (
                                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                    {product.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {product.price.toLocaleString()} ETB
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={product.inStock ? "outline" : "destructive"}>
                                                        {product.inStock
                                                            ? `In Stock${product.stock ? ` (${product.stock})` : ''}`
                                                            : "Out of Stock"
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-4">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => openEdit(product)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setProductToDelete({ id: product.id, name: product.name })}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Approval Queue */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        Approval Queue
                        {proposals.length > 0 && (
                            <Badge variant="secondary">{proposals.length}</Badge>
                        )}
                    </h3>

                    <div className="space-y-3">
                        {proposals.map(proposal => {
                            const isLoading = proposalLoading === proposal.id
                            const proposalProductName =
                                proposal.productData?.name ||
                                products.find(p => p.id === proposal.targetProductId)?.name ||
                                "Unknown Product"

                            return (
                                <Card key={proposal.id} className="overflow-hidden">
                                    <div className={`h-1 w-full ${proposal.type === 'add' ? 'bg-emerald-500' :
                                        proposal.type === 'update' ? 'bg-blue-500' : 'bg-red-500'
                                        }`} />
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <Badge variant="outline" className="text-xs mb-1 capitalize">
                                                    {proposal.type}
                                                </Badge>
                                                <p className="font-semibold truncate">{proposalProductName}</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            Submitted by{" "}
                                            <span className="font-medium text-foreground">{proposal.proposedBy}</span>
                                        </p>

                                        {proposal.status === 'pending' && isSuperAdmin && (
                                            <div className="flex gap-2 pt-1">
                                                <Button
                                                    size="sm" variant="outline"
                                                    className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                                                    disabled={isLoading}
                                                    onClick={() => handleProposalAction(proposal.id, "reject")}
                                                >
                                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject"}
                                                </Button>
                                                <Button
                                                    size="sm" className="flex-1"
                                                    disabled={isLoading}
                                                    onClick={() => handleProposalAction(proposal.id, "approve")}
                                                >
                                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {proposals.length === 0 && (
                            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground text-sm">
                                No pending proposals
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
