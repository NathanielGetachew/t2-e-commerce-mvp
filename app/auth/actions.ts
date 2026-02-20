"use server"
import { UserRole } from "@prisma/client"
import { cookies } from "next/headers"
import { serverFetch } from "@/lib/server-api"

// Define a User type that matches what the UI expects
export interface User {
    id: string
    email: string
    fullName: string
    role: UserRole
    isAmbassador: boolean
    token?: string
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

/**
 * Get the currently authenticated user.
 * 
 * Reads the auth_token cookie set by the login page, then calls
 * the backend /auth/me endpoint to get fresh user data.
 */
export async function getUser(): Promise<User | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
        console.log('[getUser] No auth_token cookie found');
        return null
    }

    console.log('[getUser] Found token, validating with backend...');

    try {
        // Call backend with the token to get full user data
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Cookie': `auth_token=${token}`,
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            return null
        }

        const data = await response.json()
        if (!data.success || !data.data?.user) {
            console.log('[getUser] Backend validation failed:', data);
            return null
        }

        console.log('[getUser] Token validated successfully for user:', data.data.user.email);
        const user = data.data.user
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName || user.name || '',
            role: user.role as UserRole,
            isAmbassador: user.isAmbassador || false,
            token,
        }
    } catch (error) {
        console.error('[getUser] Failed to validate token:', error)
        return null
    }
}

/**
 * Sign in a user.
 * 
 * IMPORTANT: This runs as a Next.js Server Action. We call the backend
 * login endpoint, get the JWT token from the response body, and set it
 * as a cookie on the Next.js response going back to the browser.
 */
export async function signIn(data: { email: string; password: string }) {
    try {
        const url = `${API_BASE_URL}/auth/login`;
        console.log(`[signIn] Attempting login to: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            cache: 'no-store',
        })

        console.log(`[signIn] Response status: ${response.status}`);
        const result = await response.json()
        console.log(`[signIn] Response result:`, JSON.stringify(result).substring(0, 200));

        if (!response.ok || !result.success) {
            const errorMsg = result.error?.message || result.error || result.message || 'Login failed'
            return { error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) }
        }

        const user = result.data?.user
        const token = result.data?.token

        if (!user || !token) {
            return { error: "Invalid response from server — no token received" }
        }

        // Set the auth_token cookie on the Next.js response → browser.
        // This is the KEY step: it bridges backend JWT → browser cookie.
        const cookieStore = await cookies()
        cookieStore.set('auth_token', token, {
            httpOnly: false,      // Must be false so client JS can also read it
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        })

        return {
            success: true,
            token,
            role: user.role,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName || user.name || '',
                role: user.role as UserRole,
                isAmbassador: user.isAmbassador || false,
            }
        }
    } catch (error) {
        console.error('[signIn] Error:', error)
        return { error: error instanceof Error ? error.message : 'Login failed' }
    }
}

/**
 * Sign up a new user.
 */
export async function signUp(data: { email: string; password: string; fullName: string; phone?: string }) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            cache: 'no-store',
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
            const errorMsg = result.error?.message || result.error || 'Signup failed'
            return { error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) }
        }

        const token = result.data?.token
        if (token) {
            // Auto-login: set cookie after successful signup
            const cookieStore = await cookies()
            cookieStore.set('auth_token', token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60,
            })
        }

        return { success: true }
    } catch (error) {
        console.error('[signUp] Error:', error)
        return { error: error instanceof Error ? error.message : 'Signup failed' }
    }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
    try {
        // Call backend to clear server-side cookie
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value

        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Cookie': `auth_token=${token}`,
                    'Authorization': `Bearer ${token}`,
                },
                cache: 'no-store',
            })
        }

        // Clear the cookie on the Next.js side
        cookieStore.delete('auth_token')

        return { success: true }
    } catch (error) {
        console.error('[signOut] Error:', error)
        // Still clear the cookie even if backend call fails
        try {
            const cookieStore = await cookies()
            cookieStore.delete('auth_token')
        } catch { }
        return { success: true }
    }
}

/**
 * Create an admin user (Super Admin only).
 */
export async function createAdmin(data: { email: string; password: string; fullName: string; phone?: string }) {
    const response = await serverFetch('/auth/admin/create', {
        method: 'POST',
        body: JSON.stringify(data),
    })

    if (!response.success) {
        return { error: response.error || 'Failed to create admin' }
    }

    return { success: true, user: response.data?.user }
}
