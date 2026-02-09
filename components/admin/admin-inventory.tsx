"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Edit, Trash2, Check, X, Search, Filter } from "lucide-react"

import { getProducts, getProposals, proposeProduct, handleProposal, uploadImage } from "@/app/actions/product-actions"
import type { Product, ProductProposal } from "@/app/actions/product-actions"
import type { User } from "@/app/auth/actions"

interface AdminInventoryProps {
    user: User | null
}

export function AdminInventory({ user }: AdminInventoryProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [proposals, setProposals] = useState<ProductProposal[]>([])
    const [newProduct, setNewProduct] = useState<Partial<Product>>({})
    const [isAddProductOpen, setIsAddProductOpen] = useState(false)
    const [isEditProductOpen, setIsEditProductOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [imageUploadLoading, setImageUploadLoading] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [productsData, proposalsData] = await Promise.all([
            getProducts(),
            getProposals()
        ])
        setProducts(productsData)
        setProposals(proposalsData.filter(p => p.status === 'pending'))
        setLoading(false)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImageUploadLoading(true)
        const formData = new FormData()
        formData.append("file", file)

        const result = await uploadImage(formData)
        setImageUploadLoading(false)

        if (result.success && result.url) {
            setNewProduct(prev => ({ ...prev, image: result.url }))
        } else {
            alert("Image upload failed")
        }
    }

    const handleProposeProduct = async () => {
        if (!newProduct.name || !newProduct.price) return

        await proposeProduct("add", {
            productData: {
                ...newProduct,
                category: newProduct.category || "General",
                price: Number(newProduct.price),
                originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
                inStock: newProduct.inStock !== undefined ? newProduct.inStock : true,
                tags: typeof newProduct.tags === 'string' ? (newProduct.tags as string).split(',').map(t => t.trim()) : newProduct.tags,
                image: newProduct.image || "/placeholder.svg"
            } as Product
        })
        setIsAddProductOpen(false)
        setNewProduct({})
        loadData()
        alert("Product proposal submitted for Super Admin approval.")
    }

    const handleEditProductClick = (product: Product) => {
        setEditingProduct(product)
        setNewProduct(product)
        setIsEditProductOpen(true)
    }

    const handleProposeEdit = async () => {
        if (!editingProduct || !newProduct.name || !newProduct.price) return

        await proposeProduct("update", {
            targetProductId: editingProduct.id,
            productData: {
                ...editingProduct,
                ...newProduct,
                price: Number(newProduct.price),
                originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
                tags: typeof newProduct.tags === 'string' ? (newProduct.tags as string).split(',').map(t => t.trim()) : newProduct.tags,
            }
        })
        setIsEditProductOpen(false)
        setEditingProduct(null)
        setNewProduct({})
        loadData()
        alert("Update proposal submitted for Super Admin approval.")
    }

    const handleDeleteProduct = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This will create a removal proposal.`)) return

        await proposeProduct("remove", {
            targetProductId: id
        })
        loadData()
        alert("Deletion proposal submitted for Super Admin approval.")
    }

    const handleApproveProposal = async (id: string) => {
        await handleProposal(id, "approve")
        loadData()
    }

    const handleRejectProposal = async (id: string) => {
        await handleProposal(id, "reject")
        loadData()
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground">Manage products and approve pending changes.</p>
                </div>
                <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            <DialogDescription>Submit a proposal for a new product.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {/* Form Fields (Reused) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Product Name</Label>
                                    <Input value={newProduct.name || ""} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Input value={newProduct.category || ""} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Price (ETB)</Label>
                                    <Input type="number" value={newProduct.price || ""} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Original Price (Optional)</Label>
                                    <Input type="number" value={newProduct.originalPrice || ""} onChange={e => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Image</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploadLoading} />
                                    {imageUploadLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                </div>
                                {newProduct.image && (
                                    <div className="w-full h-32 relative border rounded overflow-hidden bg-muted/20 flex items-center justify-center">
                                        <img src={newProduct.image} alt="Preview" className="object-contain h-full" />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label>Tags (comma separated)</Label>
                                <Input value={Array.isArray(newProduct.tags) ? newProduct.tags.join(', ') : (newProduct.tags || "")} onChange={e => setNewProduct({ ...newProduct, tags: e.target.value as any })} placeholder="electronics, gadget, sale" />
                            </div>

                            <div className="flex items-center space-x-2 border p-3 rounded-md">
                                <Switch id="instock" checked={newProduct.inStock !== false} onCheckedChange={(c: boolean) => setNewProduct({ ...newProduct, inStock: c })} />
                                <Label htmlFor="instock" className="cursor-pointer">In Stock</Label>
                            </div>

                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea value={newProduct.description || ""} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>Cancel</Button>
                            <Button onClick={handleProposeProduct} disabled={imageUploadLoading}>Submit Proposal</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Product: {editingProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Product Name</Label>
                                <Input value={newProduct.name || ""} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Input value={newProduct.category || ""} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Price (ETB)</Label>
                                <Input type="number" value={newProduct.price || ""} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Original Price (Optional)</Label>
                                <Input type="number" value={newProduct.originalPrice || ""} onChange={e => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Image</Label>
                            <div className="flex items-center gap-2">
                                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploadLoading} />
                                {imageUploadLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>
                            {newProduct.image && (
                                <div className="w-full h-32 relative border rounded overflow-hidden bg-muted/20 flex items-center justify-center">
                                    <img src={newProduct.image} alt="Preview" className="object-contain h-full" />
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>Tags (comma separated)</Label>
                            <Input value={Array.isArray(newProduct.tags) ? newProduct.tags.join(', ') : (newProduct.tags || "")} onChange={e => setNewProduct({ ...newProduct, tags: e.target.value as any })} />
                        </div>

                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                            <Switch id="edit-instock" checked={newProduct.inStock !== false} onCheckedChange={(c: boolean) => setNewProduct({ ...newProduct, inStock: c })} />
                            <Label htmlFor="edit-instock" className="cursor-pointer">In Stock</Label>
                        </div>

                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={newProduct.description || ""} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditProductOpen(false)}>Cancel</Button>
                        <Button onClick={handleProposeEdit} disabled={imageUploadLoading}>Submit Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Product List */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search inventory..." className="pl-9" />
                        </div>
                        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                    </div>

                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg">Current Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-4">Product</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead className="text-right pr-4">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell className="pl-4 font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                                                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                                                    </div>
                                                    <span>{product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell>{product.price.toLocaleString()} ETB</TableCell>
                                            <TableCell>
                                                <Badge variant={product.inStock ? "outline" : "destructive"}>
                                                    {product.inStock ? "In Stock" : "Out of Stock"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditProductClick(product)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id, product.name)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Approval Queue */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        Approval Queue
                        {proposals.length > 0 && <Badge variant="secondary">{proposals.length}</Badge>}
                    </h3>
                    <div className="space-y-3">
                        {proposals.map(proposal => (
                            <Card key={proposal.id} className="overflow-hidden">
                                <div className={`h-1 w-full ${proposal.type === 'add' ? 'bg-green-500' : proposal.type === 'update' ? 'bg-blue-500' : 'bg-red-500'}`} />
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{proposal.type}</div>
                                            <div className="font-bold">
                                                {proposal.productData?.name || (products.find(p => p.id === proposal.targetProductId)?.name || "Unknown Product")}
                                            </div>
                                        </div>
                                        <Badge variant={proposal.status === 'pending' ? 'outline' : proposal.status === 'approved' ? 'default' : 'destructive'}>
                                            {proposal.status}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Proposed by <span className="font-medium text-foreground">{proposal.proposedBy}</span>
                                    </div>

                                    {proposal.status === 'pending' && user?.role === 'SUPER_ADMIN' && (
                                        <div className="flex gap-2 pt-2">
                                            <Button size="sm" variant="outline" className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => handleRejectProposal(proposal.id)}>
                                                Reject
                                            </Button>
                                            <Button size="sm" className="flex-1" onClick={() => handleApproveProposal(proposal.id)}>
                                                Approve
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {proposals.length === 0 && (
                            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                                No pending proposals
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
