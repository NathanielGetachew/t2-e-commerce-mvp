"use server"

import { apiClient } from "@/lib/api"
import { getUser } from "@/app/auth/actions"

export interface Product {
    id: string
    name: string
    price: number
    images: string[]
    category?: string
    description?: string
    inStock?: boolean
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

export async function getProducts(): Promise<Product[]> {
    const response = await apiClient.getProducts()

    if (!response.success || !response.data?.products) {
        console.error('Failed to fetch products:', response.error)
        return []
    }

    // Transform backend product format to frontend format
    return response.data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.singlePriceCents / 100, // Convert cents to dollars
        images: p.images || [], // Keep as array
        category: p.categoryId || 'Uncategorized',
        description: p.description,
        inStock: p.stock > 0,
        // Add other fields as needed
    }))
}

export async function getProposals(): Promise<ProductProposal[]> {
    // This would need admin endpoint
    // For now, return empty array
    return []
}

export async function proposeProduct(action: "add" | "remove" | "update", data: {
    productData?: Partial<Product>,
    targetProductId?: string
}) {
    // This would need to be implemented in backend
    return { error: "Product proposals not implemented yet" }
}

export async function handleProposal(proposalId: string, action: "approve" | "reject") {
    // This would need super admin endpoint
    return { error: "Proposal handling not implemented yet" }
}