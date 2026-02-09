"use server"

import { promises as fs } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { getUser } from "@/app/auth/actions"

const DB_PATH = path.join(process.cwd(), "app/lib/mock-db")
const COUPONS_FILE = path.join(DB_PATH, "coupons.json")

export interface Coupon {
    id: string
    code: string
    discountPercentage: number // 0-100
    targetProductId?: string // If null, applies to whole cart (optional future feature)
    validUntil: string
    createdBy: string
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

export async function getCoupons(): Promise<Coupon[]> {
    const user = await getUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
        return []
    }
    return await readJSON(COUPONS_FILE)
}

export async function createCoupon(data: {
    code: string
    discountPercentage: number
    targetProductId: string
    validHours: number
}) {
    const user = await getUser()
    if (!user || user.role !== "SUPER_ADMIN") {
        return { error: "Only Super Admin can create coupons" }
    }

    const coupons = await readJSON(COUPONS_FILE)

    if (coupons.some((c: Coupon) => c.code === data.code)) {
        return { error: "Coupon code already exists" }
    }

    const validUntil = new Date()
    validUntil.setHours(validUntil.getHours() + data.validHours)

    const newCoupon: Coupon = {
        id: uuidv4(),
        code: data.code.toUpperCase(),
        discountPercentage: data.discountPercentage,
        targetProductId: data.targetProductId,
        validUntil: validUntil.toISOString(),
        createdBy: user.email,
    }

    coupons.push(newCoupon)
    await writeJSON(COUPONS_FILE, coupons)
    return { success: true, coupon: newCoupon }
}

export async function validateCoupon(code: string, productId: string) {
    const coupons = await readJSON(COUPONS_FILE)
    const coupon = coupons.find((c: Coupon) => c.code === code.toUpperCase())

    if (!coupon) {
        return { error: "Invalid coupon code" }
    }

    if (new Date(coupon.validUntil) < new Date()) {
        return { error: "Coupon has expired" }
    }

    if (coupon.targetProductId && coupon.targetProductId !== productId) {
        return { error: "This coupon is not valid for this product" }
    }

    return { success: true, discountPercentage: coupon.discountPercentage }
}
