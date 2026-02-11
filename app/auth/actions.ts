"use server"
import { UserRole } from "@prisma/client"
import { prisma, isDatabaseAvailable } from "@/lib/prisma"

// Helper for reading mock DB - adding this to support the custom login/signup pages
// that were referencing these missing actions.
import { promises as fs } from "fs"
import path from "path"
import { cookies } from "next/headers"

const MOCK_DB_PATH = path.join(process.cwd(), "app/auth/mock-db.json")

async function getMockUsers() {
    try {
        const data = await fs.readFile(MOCK_DB_PATH, "utf-8")
        return JSON.parse(data)
    } catch (e) {
        return []
    }
}

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
    // For development, we run purely in mock mode (no Clerk).
    // We first try the database if available, otherwise fall back to the mock-session cookie.

    if (!isDatabaseAvailable) {
        // Check for mock session cookie
        const cookieStore = await cookies()
        const mockSession = cookieStore.get("mock-session")

        if (mockSession) {
            try {
                const sessionData = JSON.parse(mockSession.value)
                return {
                    id: sessionData.id,
                    email: sessionData.email,
                    fullName: sessionData.fullName,
                    role: sessionData.role as UserRole, // Ensure role matches UserRole type
                    isAmbassador: !!sessionData.isAmbassador
                }
            } catch (e) {
                console.error("Failed to parse mock session", e)
            }
        }

        return null
    }

    // If we do have a DB, we could in the future look up a user from a custom session.
    // For now, return null to keep behavior simple in development.
    return null
}

export async function signOut() {
    // Clerk handles sign out via client component usually (useClerk), 
    // but for server actions we can't clear cookies easily without Redirect.
    // This function is mainly for the mock compatibility. 
    // The Header component should calls `clerk.signOut()` on client.

    // Clear mock session
    const cookieStore = await cookies()
    cookieStore.delete("mock-session")

    return { success: true }
}

export async function signIn(data: any) {
    const users = await getMockUsers()
    const user = users.find((u: any) => u.email === data.email && u.password === data.password)

    if (!user) {
        return { error: "Invalid email or password" }
    }

    // Note: This only works for the mock UI. 
    // It doesn't actually sign the user into Clerk.

    // Set cookie for mock session
    const cookieStore = await cookies()
    cookieStore.set("mock-session", JSON.stringify({
        id: user.id || "mock-user-id",
        email: user.email,
        fullName: user.fullName,
        role: user.role.toUpperCase(),
        isAmbassador: !!user.isAmbassador
    }), { secure: false, httpOnly: true, path: '/' }) // secure false for localhost dev

    return {
        success: true,
        role: user.role.toLowerCase(),
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role.toUpperCase() as UserRole,
            isAmbassador: !!user.isAmbassador
        }
    }
}

export async function signUp(data: any) {
    const users = await getMockUsers()

    if (users.find((u: any) => u.email === data.email)) {
        return { error: "User already exists" }
    }

    // In a real app, we would create the user in Clerk and the DB.
    // For now, we'll just simulate success for the UI.
    return { success: true }
}

export async function createAdmin(data: any) {
    const users = await getMockUsers()

    if (users.find((u: any) => u.email === data.email)) {
        return { error: "User already exists" }
    }

    const newUser = {
        id: `admin-${Date.now()}`,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        role: "admin",
        isAmbassador: false
    }

    users.push(newUser)
    await fs.writeFile(MOCK_DB_PATH, JSON.stringify(users, null, 2))

    return { success: true }
}



