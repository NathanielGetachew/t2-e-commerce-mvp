"use server"

import { serverFetch, serverFetchFormData } from "@/lib/server-api"

export interface Product {
    id: string
    name: string
    price: number
    images: string[]
    image?: string
    category?: string
    description?: string
    inStock?: boolean
    slug?: string
    stock?: number
    singlePriceCents?: number
    originalPrice?: number
    tags?: string[]
    rating?: number
    reviewCount?: number
    bulkPricing?: { minQty: number; price: number }[]
    specifications?: Record<string, string>
}

export interface ProductProposal {
    id: string
    type: "add" | "remove" | "update"
    status: "pending" | "approved" | "rejected"
    productData?: Partial<Product>
    targetProductId?: string
    proposedBy: string
    proposedAt: string
}

/**
 * Ensures image URLs are always absolute/properly rooted.
 * Next.js proxies /uploads/* → backend, so we output relative paths.
 */
const getImageUrl = (url?: string): string => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v\d+)?$/, '') || ''
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * Shared helper: maps a raw backend product object to the frontend Product shape.
 * Centralises the mapping so createProduct, updateProduct, and getProducts all stay in sync.
 */
const formatProductFromBackend = (p: any): Product => ({
    id: p.id,
    name: p.name,
    price: (p.singlePriceCents || 0) / 100,
    singlePriceCents: p.singlePriceCents,
    images: (p.images || []).map(getImageUrl),
    image: getImageUrl(p.images?.[0]),
    category: p.categoryId || undefined,
    description: p.description,
    inStock: (p.stock ?? 0) > 0,
    slug: p.slug,
    stock: p.stock ?? 0,
})

/** Sanitize a string into a valid URL slug */
const toSlug = (input: string): string =>
    input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product'

// ─── Public Read ─────────────────────────────────────────────────────────────

/**
 * Get all products (public endpoint — no auth required)
 */
export async function getProducts(): Promise<Product[]> {
    const response = await serverFetch('/products')
    const data = response.data as { products?: any[] } | undefined
    if (!response.success || !data?.products) {
        console.error('[getProducts] Failed:', response.error)
        return []
    }
    return data.products.map(formatProductFromBackend)
}

// ─── Proposals ────────────────────────────────────────────────────────────────

/**
 * Get product proposals (admin only)
 */
export async function getProposals(): Promise<ProductProposal[]> {
    const response = await serverFetch('/products/proposals')
    if (!response.success || !response.data?.proposals) {
        console.error('[getProposals] Failed:', response.error)
        return []
    }
    return response.data.proposals.map((p: any) => ({
        ...p,
        type: p.type?.toLowerCase(),
        status: p.status?.toLowerCase(),
        // Backend returns nested proposedByUser — flatten to proposedBy
        proposedBy: p.proposedByUser?.name || p.proposedByUser?.email || p.proposedBy || 'Unknown',
        productData: p.productData ? {
            ...p.productData,
            images: (p.productData.images || []).map(getImageUrl),
            image: getImageUrl(p.productData.images?.[0]),
        } : undefined,
    }))
}

/**
 * Create a product proposal (admin only)
 */
export async function proposeProduct(
    action: "add" | "remove" | "update",
    data: { productData?: Partial<Product>; targetProductId?: string }
): Promise<{ success?: boolean; error?: string }> {
    const response = await serverFetch('/products/proposals', {
        method: 'POST',
        body: JSON.stringify({ type: action, ...data }),
    })
    if (!response.success) return { error: response.error || 'Failed to submit proposal' }
    return { success: true }
}

/**
 * Approve or reject a proposal (super admin only)
 */
export async function handleProposal(
    proposalId: string,
    action: "approve" | "reject"
): Promise<{ success?: boolean; error?: string }> {
    const response = await serverFetch(`/products/proposals/${proposalId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
    })
    if (!response.success) return { error: response.error || 'Failed to handle proposal' }
    return { success: true }
}

// ─── Product CRUD ─────────────────────────────────────────────────────────────

/**
 * Create a product (admin only)
 */
export async function createProduct(productData: {
    name: string
    description: string
    price: number
    images: string[]
    stock?: number
}): Promise<{ success: boolean; product?: Product; error?: string }> {
    const response = await serverFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
            name: productData.name,
            description: productData.description,
            slug: toSlug(productData.name),
            singlePriceCents: Math.round(productData.price * 100),
            currency: 'ETB',
            stock: productData.stock ?? 0,
            images: productData.images,
            isActive: true,
            // categoryId intentionally omitted: form uses free-text, not a real FK UUID
        }),
    })
    if (!response.success) {
        const err = response.error || 'Failed to create product'
        return { success: false, error: typeof err === 'string' ? err : JSON.stringify(err) }
    }
    const raw = (response.data as any)?.product ?? response.data
    return { success: true, product: formatProductFromBackend(raw) }
}

/**
 * Update a product directly (super admin only — bypasses proposal workflow)
 */
export async function updateProduct(
    productId: string,
    productData: {
        name?: string
        description?: string
        price?: number
        images?: string[]
        stock?: number
    }
): Promise<{ success: boolean; product?: Product; error?: string }> {
    const backendData: Record<string, any> = {}
    if (productData.name !== undefined) backendData.name = productData.name
    if (productData.description !== undefined) backendData.description = productData.description
    if (productData.price !== undefined) backendData.singlePriceCents = Math.round(productData.price * 100)
    if (productData.stock !== undefined) backendData.stock = productData.stock
    if (productData.images !== undefined) backendData.images = productData.images

    const response = await serverFetch(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(backendData),
    })
    if (!response.success) {
        const err = response.error || 'Failed to update product'
        return { success: false, error: typeof err === 'string' ? err : JSON.stringify(err) }
    }
    const raw = (response.data as any)?.product ?? response.data
    return { success: true, product: formatProductFromBackend(raw) }
}

/**
 * Soft-delete a product (super admin only — sets isActive=false immediately)
 */
export async function deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    const response = await serverFetch(`/products/${productId}`, { method: 'DELETE' })
    if (!response.success) {
        const err = response.error || 'Failed to delete product'
        return { success: false, error: typeof err === 'string' ? err : JSON.stringify(err) }
    }
    return { success: true }
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

/**
 * Upload a product image (admin only)
 */
export async function uploadImage(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    const response = await serverFetchFormData('/products/upload-image', formData)
    if (!response.success) {
        const err = response.error || 'Failed to upload image'
        return { success: false, error: typeof err === 'string' ? err : JSON.stringify(err) }
    }
    return { success: true, url: (response.data as { url: string })?.url }
}