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
    proposedBy: string // user email
    proposedAt: string
}

/**
 * Helper to ensure absolute image URLs
 */
const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    // We configured next.config.mjs to proxy /uploads/* -> http://localhost:8080/uploads/*
    // Therefore, outputting the relative path ensures browser fetches securely via NextJS instead of a brittle Absolute port URL.
    return url.startsWith('/') ? url : `/${url}`;
};

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

    // Transform backend product format to frontend format
    return data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: (p.singlePriceCents || 0) / 100,
        singlePriceCents: p.singlePriceCents,
        images: (p.images || []).map(getImageUrl),
        image: getImageUrl(p.images?.[0]),
        category: p.categoryId || 'Uncategorized',
        description: p.description,
        inStock: p.stock > 0,
        slug: p.slug,
        stock: p.stock,
    }))
}

/**
 * Get product proposals (admin only — uses serverFetch with auth)
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
        productData: p.productData ? {
            ...p.productData,
            images: (p.productData.images || []).map(getImageUrl),
            image: getImageUrl(p.productData.images?.[0]),
        } : undefined
    }))
}

/**
 * Propose a product action (admin only)
 */
export async function proposeProduct(action: "add" | "remove" | "update", data: {
    productData?: Partial<Product>,
    targetProductId?: string
}) {
    const response = await serverFetch('/products/proposals', {
        method: 'POST',
        body: JSON.stringify({ type: action, ...data }),
    })

    if (!response.success) {
        return { error: response.error || 'Failed to submit proposal' }
    }

    return { success: true }
}

/**
 * Handle a proposal (super admin only)
 */
export async function handleProposal(proposalId: string, action: "approve" | "reject") {
    const response = await serverFetch(`/products/proposals/${proposalId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
    })

    if (!response.success) {
        return { error: response.error || 'Failed to handle proposal' }
    }

    return { success: true }
}

/**
 * Create a product (admin only)
 */
export async function createProduct(productData: {
    name: string
    description: string
    price: number
    images: string[]
    category?: string
    stock?: number
    slug?: string
}): Promise<{ success: boolean; product?: Product; error?: string }> {
    const backendData = {
        name: productData.name,
        description: productData.description,
        slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        singlePriceCents: Math.round(productData.price * 100),
        currency: 'USD',
        stock: productData.stock || 0,
        categoryId: productData.category,
        images: productData.images, // We intentionally send backend paths or user-provided absolute paths
        isActive: true,
    }

    const response = await serverFetch('/products', {
        method: 'POST',
        body: JSON.stringify(backendData),
    })

    if (!response.success) {
        const err = response.error || 'Failed to create product'
        return { success: false, error: typeof err === 'string' ? err : JSON.stringify(err) }
    }

    const p = response.data as any
    return {
        success: true,
        product: {
            id: p.id,
            name: p.name,
            price: (p.singlePriceCents || 0) / 100,
            images: (p.images || []).map(getImageUrl),
            image: getImageUrl(p.images?.[0]),
            category: p.categoryId,
            description: p.description,
            inStock: p.stock > 0,
        }
    }
}

/**
 * Upload a product image (admin only)
 */
export async function uploadImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    const response = await serverFetchFormData('/products/upload-image', formData)

    if (!response.success) {
        const err = response.error || 'Failed to upload image'
        return { success: false, error: typeof err === 'string' ? err : JSON.stringify(err) }
    }

    return {
        success: true,
        url: getImageUrl((response.data as { url: string })?.url)
    }
}