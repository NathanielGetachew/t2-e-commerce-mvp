"use server"
import { UserRole } from "@prisma/client"
import { apiClient } from "@/lib/api"
import { cookies } from "next/headers"

// Define a User type that matches what the UI and Mock system expects
export interface User {
    id: string
    email: string
    fullName: string
    role: UserRole
    isAmbassador: boolean
    // Ambassador / Affiliate fields
    referralCode?: string
    customCode?: string
    ambassadorStatus?: "pending" | "approved" | "rejected"
    commissionRate?: number
    totalEarnings?: number
    metrics?: {
        clicks: number
        conversions: number
        revenueGenerated: number
    }
    applicationData?: {
        socialLinks: { platform: string; url: string }[]
        whyJoin: string
        marketingStrategy: string
    }
    phone?: string
}


export async function getUser(): Promise<User | null> {
    // For now, return null - we'll implement proper session checking later
    // This would typically check for auth_token cookie and validate with backend
    return null
}

export async function signOut() {
    // Call backend logout
    await apiClient.logout()

    return { success: true }
}

export async function signIn(data: { email: string; password: string }) {
    const response = await apiClient.login(data.email, data.password)

    if (!response.success) {
        return { error: response.error || "Login failed" }
    }

    const user = response.data?.user
    if (!user) {
        return { error: "Invalid response from server" }
    }

    return {
        success: true,
        role: user.role.toLowerCase(),
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role as UserRole,
            isAmbassador: user.isAmbassador || false
        }
    }
}

export async function signUp(data: { email: string; password: string; fullName: string; phone?: string }) {
    const response = await apiClient.signup(data.email, data.password, data.fullName)

    if (!response.success) {
        return { error: response.error || "Signup failed" }
    }

    return { success: true }
}

export async function createAdmin(data: any) {
    // This would need to be implemented in the backend
    // For now, return error
    return { error: "Admin creation not implemented via API yet" }
}



