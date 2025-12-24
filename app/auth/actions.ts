"use server"

import { cookies } from "next/headers"

// MOCK CONSTANTS
const MOCK_SESSION_COOKIE = "mock-auth-session"

export async function signUp(data: {
    email: string
    password: string
    fullName: string
    phone: string
    isAdmin: boolean
}) {
    console.log("SIMULATED Action: signUp called for", data.email)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
        const cookieStore = await cookies()

        // Set a mock session cookie
        cookieStore.set(MOCK_SESSION_COOKIE, JSON.stringify({
            email: data.email,
            full_name: data.fullName,
            is_admin: data.isAdmin,
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
        const cookieStore = await cookies()

        cookieStore.set(MOCK_SESSION_COOKIE, JSON.stringify({
            email: data.email,
            full_name: "Mock User",
            is_admin: data.email.includes("admin"),
            simulated: true
        }), {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7
        })

        return { success: true }
    } catch (error) {
        console.error("Simulation error:", error)
        return { error: "An unexpected error occurred during simulated login" }
    }
}

export async function signOut() {
    const cookieStore = await cookies()
    cookieStore.delete(MOCK_SESSION_COOKIE)
    return { success: true }
}
