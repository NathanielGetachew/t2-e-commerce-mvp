"use server"

import { cookies } from "next/headers"
import fs from "fs/promises"
import path from "path"
import type { User } from "@/app/auth/actions"

const DB_PATH = path.join(process.cwd(), "app/auth/mock-db.json")

// Helper to read DB (duplicated from auth/actions for safety/speed in this MVP)
async function getDB(): Promise<User[]> {
    try {
        await fs.access(DB_PATH)
        const data = await fs.readFile(DB_PATH, "utf-8")
        return JSON.parse(data)
    } catch {
        return []
    }
}

async function writeDB(users: User[]) {
    await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2))
}

export async function validateReferralCode(code: string) {
    const users = await getDB()
    // Only valid if ambassador is approved
    const ambassador = users.find(u =>
        (u.referralCode === code || u.customCode === code) &&
        u.isAmbassador &&
        u.ambassadorStatus === "approved"
    )

    if (ambassador) {
        return {
            valid: true,
            discountPercentage: 5, // Default discount
            ambassadorName: ambassador.fullName
        }
    }

    return { valid: false }
}

export async function submitApplication(formData: any) {
    const users = await getDB()
    const userIndex = users.findIndex(u => u.id === formData.userId)

    if (userIndex === -1) {
        return { success: false, error: "User not found" }
    }

    users[userIndex].ambassadorStatus = "pending"
    users[userIndex].applicationData = {
        socialLinks: formData.socialLinks,
        whyJoin: formData.whyJoin,
        marketingStrategy: formData.marketingStrategy
    }

    await writeDB(users)
    return { success: true }
}

export async function approveAmbassador(userId: string) {
    const users = await getDB()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) return { success: false, error: "User not found" }

    // Generate code if not exists
    const code = users[userIndex].customCode || `AMB-${users[userIndex].fullName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`

    users[userIndex].ambassadorStatus = "approved"
    users[userIndex].isAmbassador = true
    users[userIndex].referralCode = code
    users[userIndex].commissionRate = 5
    if (!users[userIndex].metrics) {
        users[userIndex].metrics = { clicks: 0, conversions: 0, revenueGenerated: 0 }
    }

    await writeDB(users)
    return { success: true }
}

export async function rejectAmbassador(userId: string) {
    const users = await getDB()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) return { success: false, error: "User not found" }

    users[userIndex].ambassadorStatus = "rejected"
    await writeDB(users)
    return { success: true }
}

export async function updateCustomCode(userId: string, newCode: string) {
    const users = await getDB()

    // Check uniqueness
    const exists = users.find(u => u.referralCode === newCode || u.customCode === newCode)
    if (exists) {
        return { success: false, error: "Code already taken" }
    }

    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) return { success: false, error: "User not found" }

    users[userIndex].referralCode = newCode
    users[userIndex].customCode = newCode

    await writeDB(users)
    return { success: true }
}

export async function trackReferralClick(code: string) {
    const users = await getDB()
    const ambassadorIndex = users.findIndex(u => (u.referralCode === code || u.customCode === code) && u.ambassadorStatus === "approved")

    if (ambassadorIndex === -1) return { success: false }

    const ambassador = users[ambassadorIndex]
    if (!ambassador.metrics) {
        ambassador.metrics = { clicks: 0, conversions: 0, revenueGenerated: 0 }
    }

    ambassador.metrics.clicks += 1

    users[ambassadorIndex] = ambassador
    await writeDB(users)

    return { success: true }
}

export async function recordCommission(referralCode: string, orderAmount: number) {
    const users = await getDB()
    const ambassadorIndex = users.findIndex(u => (u.referralCode === referralCode || u.customCode === referralCode) && u.isAmbassador)

    if (ambassadorIndex === -1) {
        return { success: false, error: "Ambassador not found" }
    }

    const ambassador = users[ambassadorIndex]
    const commissionRate = ambassador.commissionRate || 5
    const commissionEarned = (orderAmount * commissionRate) / 100

    // Update earnings
    ambassador.totalEarnings = (ambassador.totalEarnings || 0) + commissionEarned

    // Update metrics
    if (!ambassador.metrics) {
        ambassador.metrics = { clicks: 0, conversions: 0, revenueGenerated: 0 }
    }
    ambassador.metrics.conversions += 1
    ambassador.metrics.revenueGenerated += orderAmount

    users[ambassadorIndex] = ambassador
    await writeDB(users)

    return {
        success: true,
        earned: commissionEarned
    }
}

export async function getReferralStats(userId: string) {
    const users = await getDB()
    const user = users.find(u => u.id === userId)

    if (!user || !user.isAmbassador) {
        return null
    }

    return {
        referralCode: user.customCode || user.referralCode,
        commissionRate: user.commissionRate,
        totalEarnings: user.totalEarnings,
        metrics: user.metrics || { clicks: 0, conversions: 0, revenueGenerated: 0 },
        monthlyEarnings: [
            { month: 'Jan', amount: 0 },
            { month: 'Feb', amount: user.totalEarnings || 0 }
        ]
    }
}

export async function getAmbassadorApplications() {
    const users = await getDB()
    return users.filter(u => u.ambassadorStatus === "pending")
}

export async function getAllAmbassadors() {
    const users = await getDB()
    return users.filter(u => u.isAmbassador && u.ambassadorStatus === "approved")
}
