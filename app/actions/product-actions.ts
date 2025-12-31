"use server"

import { promises as fs } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { getUser } from "@/app/auth/actions"

const DB_PATH = path.join(process.cwd(), "app/lib/mock-db")
const PRODUCTS_FILE = path.join(DB_PATH, "products.json")
const PROPOSALS_FILE = path.join(DB_PATH, "proposals.json")

export interface Product {
    id: string
    name: string
    price: number
    originalPrice?: number
    category: string
    image: string
    description?: string
    specifications?: Record<string, string>
    rating?: number
    reviewCount?: number
    inStock?: boolean
    tags?: string[]
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

async function readJSON(filePath: string) {
    try {
        const data = await fs.readFile(filePath, "utf-8")
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

async function writeJSON(filePath: string, data: any) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

export async function getProducts(): Promise<Product[]> {
    return await readJSON(PRODUCTS_FILE)
}

export async function getProposals(): Promise<ProductProposal[]> {
    return await readJSON(PROPOSALS_FILE)
}

export async function proposeProduct(action: "add" | "remove" | "update", data: {
    productData?: Partial<Product>,
    targetProductId?: string
}) {
    const user = await getUser()
    if (!user || (user.role !== "admin" && user.role !== "super-admin")) {
        return { error: "Unauthorized" }
    }

    const proposals = await getProposals()
    const newProposal: ProductProposal = {
        id: uuidv4(),
        type: action,
        status: "pending",
        productData: data.productData,
        targetProductId: data.targetProductId,
        proposedBy: user.email,
        proposedAt: new Date().toISOString(),
    }

    proposals.push(newProposal)
    await writeJSON(PROPOSALS_FILE, proposals)
    return { success: true, proposal: newProposal }
}

export async function handleProposal(proposalId: string, action: "approve" | "reject") {
    const user = await getUser()
    if (!user || user.role !== "super-admin") {
        return { error: "Only Super Admin can approve/reject proposals" }
    }

    const proposals = await getProposals()
    const proposalIndex = proposals.findIndex(p => p.id === proposalId)

    if (proposalIndex === -1) {
        return { error: "Proposal not found" }
    }

    const proposal = proposals[proposalIndex]

    if (proposal.status !== "pending") {
        return { error: "Proposal already processed" }
    }

    if (action === "reject") {
        proposal.status = "rejected"
        await writeJSON(PROPOSALS_FILE, proposals)
        return { success: true, status: "rejected" }
    }

    // Handle Approval
    const products = await getProducts()

    if (proposal.type === "add" && proposal.productData) {
        const newProduct: Product = {
            id: proposal.productData.id || uuidv4(),
            name: proposal.productData.name || "New Product",
            price: proposal.productData.price || 0,
            category: proposal.productData.category || "Uncategorized",
            image: proposal.productData.image || "/placeholder.jpg",
            description: proposal.productData.description || "",
            specifications: proposal.productData.specifications || {},
            rating: 0,
            reviewCount: 0,
            inStock: true,
            tags: proposal.productData.tags || [],
            ...proposal.productData
        }
        products.push(newProduct)
    } else if (proposal.type === "remove" && proposal.targetProductId) {
        const index = products.findIndex(p => p.id === proposal.targetProductId)
        if (index !== -1) {
            products.splice(index, 1)
        }
    } else if (proposal.type === "update" && proposal.targetProductId && proposal.productData) {
        const index = products.findIndex(p => p.id === proposal.targetProductId)
        if (index !== -1) {
            products[index] = { ...products[index], ...proposal.productData }
        }
    }

    proposal.status = "approved"

    // ... (existing code)
    await writeJSON(PRODUCTS_FILE, products)
    await writeJSON(PROPOSALS_FILE, proposals)

    return { success: true, status: "approved" }
}

export async function uploadImage(formData: FormData): Promise<{ success: boolean, url?: string, error?: string }> {
    const file = formData.get("file") as File
    if (!file) {
        return { success: false, error: "No file provided" }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
    const publicPath = path.join(process.cwd(), "public", "product-images", filename)

    try {
        await fs.writeFile(publicPath, buffer)
        return { success: true, url: `/product-images/${filename}` }
    } catch (error) {
        console.error("Error uploading file:", error)
        return { success: false, error: "Failed to upload image" }
    }
}
