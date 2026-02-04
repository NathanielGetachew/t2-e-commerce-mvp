"use server"

import { cookies } from "next/headers"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// CONSTANTS
const MOCK_SESSION_COOKIE = "mock-auth-session"
const DB_PATH = path.join(process.cwd(), "app/auth/mock-db.json")

export type UserRole = "customer" | "admin" | "super-admin"

export interface User {
    id: string
    email: string
    password: string // Storing plain text for MOCK purposes only
    fullName: string
    phone: string
    role: UserRole
    // Ambassador fields
    isAmbassador?: boolean
    referralCode?: string
    commissionRate?: number // e.g., 5 for 5%
    totalEarnings?: number
}

const DEFAULT_SUPER_USER: User = {
    id: "super-admin-id",
    email: "superuser@t2.com",
    password: "password",
    fullName: "Super Administrator",
    phone: "0000000000",
    role: "super-admin"
}

// Helper to read/write DB
async function getDB(): Promise<User[]> {
    try {
        await fs.access(DB_PATH)
        const data = await fs.readFile(DB_PATH, "utf-8")
        return JSON.parse(data)
    } catch {
        // If file doesn't exist, create it with super user
        const initialData = [DEFAULT_SUPER_USER]
        await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2))
        return initialData
    }
}

async function writeDB(users: User[]) {
    await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2))
}

export async function signUp(data: {
    email: string
    password: string
    fullName: string
    phone: string
    // isAdmin is removed from public sign up, defaulting to customer
}) {
    console.log("SIMULATED Action: signUp called for", data.email)

    await new Promise(resolve => setTimeout(resolve, 500))

    try {
        const users = await getDB()

        if (users.find(u => u.email === data.email)) {
            return { error: "User with this email already exists" }
        }

        const newUser: User = {
            id: uuidv4(),
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            phone: data.phone,
            role: "customer"
        }

        users.push(newUser)
        await writeDB(users)

        // Auto login after sign up
        const cookieStore = await cookies()
        cookieStore.set(MOCK_SESSION_COOKIE, JSON.stringify({
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.fullName,
            role: newUser.role,
            isAmbassador: false,
            simulated: true
        }), {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        return { success: true }
    } catch (error) {
        console.error("Simulation error:", error)
        return { error: "An unexpected error occurred during simulated sign up" }
    }
}

export async function signIn(data: {
    email: string
    password: string
}) {
    console.log("SIMULATED Action: signIn called for", data.email)

    await new Promise(resolve => setTimeout(resolve, 500))

    try {
        const users = await getDB()
        const user = users.find(u => u.email === data.email && u.password === data.password)

        if (!user) {
            return { error: "Invalid credentials" }
        }

        const cookieStore = await cookies()
        cookieStore.set(MOCK_SESSION_COOKIE, JSON.stringify({
            id: user.id,
            email: user.email,
            full_name: user.fullName,
            role: user.role,
            isAmbassador: user.isAmbassador || false,
            simulated: true
        }), {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7
        })

        return { success: true, role: user.role }
    } catch (error) {
        console.error("Simulation error:", error)
        return { error: "An unexpected error occurred during simulated login" }
    }
}

export async function createAdmin(data: {
    email: string
    password: string
    fullName: string
    phone: string
}) {
    console.log("SIMULATED Action: createAdmin called for", data.email)

    // Authorization check
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(MOCK_SESSION_COOKIE)
    if (!sessionCookie) {
        return { error: "Unauthorized" }
    }
    const session = JSON.parse(sessionCookie.value)
    if (session.role !== "super-admin") {
        return { error: "Only Super Admin can create admins" }
    }

    try {
        const users = await getDB()

        if (users.find(u => u.email === data.email)) {
            return { error: "User with this email already exists" }
        }

        const newAdmin: User = {
            id: uuidv4(),
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            phone: data.phone,
            role: "admin"
        }

        users.push(newAdmin)
        await writeDB(users)

        return { success: true }
    } catch (error) {
        console.error("Simulation error:", error)
        return { error: "Failed to create admin" }
    }
}

export async function getUser() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(MOCK_SESSION_COOKIE)
    if (!sessionCookie) {
        return null
    }
    try {
        return JSON.parse(sessionCookie.value)
    } catch {
        return null
    }
}

export async function signOut() {
    const cookieStore = await cookies()
    cookieStore.delete(MOCK_SESSION_COOKIE)
    return { success: true }
}

export async function upgradeToAmbassador(userId: string) {
    const users = await getDB()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
        return { error: "User not found" }
    }

    const user = users[userIndex]

    if (user.isAmbassador) {
        return { error: "User is already an ambassador" }
    }

    // Generate unique referral code (simplified for mock)
    const code = `AMB-${user.email.split('@')[0].toUpperCase().substring(0, 5)}-${Math.floor(Math.random() * 1000)}`

    user.isAmbassador = true
    user.referralCode = code
    user.commissionRate = 5 // Default 5% commission
    user.totalEarnings = 0

    users[userIndex] = user
    await writeDB(users)

    // Update session if it's the current user
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(MOCK_SESSION_COOKIE)
    if (sessionCookie) {
        const session = JSON.parse(sessionCookie.value)
        if (session.id === userId) {
            cookieStore.set(MOCK_SESSION_COOKIE, JSON.stringify({
                ...session,
                isAmbassador: true,
                referralCode: code
            }), {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7
            })
        }
    }

    return { success: true, code }
}
