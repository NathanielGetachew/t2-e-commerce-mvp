/**
 * Server-Side API Helper
 * 
 * This module provides fetch helpers that properly forward authentication
 * cookies from the browser → Next.js server → backend API.
 * 
 * WHY THIS EXISTS:
 * When a Next.js Server Action calls the backend API, it runs on the
 * Next.js server process — NOT in the browser. So `credentials: 'include'`
 * and `document.cookie` don't work. We must manually read the auth_token
 * from the incoming request cookies (via `next/headers`) and attach it
 * as an Authorization header or Cookie header on outgoing fetch calls.
 */
import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export interface ServerApiResponse<T = any> {
    success: boolean
    data?: T
    message?: string
    error?: any
    requestId?: string
}

/**
 * Make an authenticated fetch from a Server Action/RSC to the backend.
 * Automatically forwards the auth_token cookie.
 */
export async function serverFetch<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ServerApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`

    // Read auth token from the browser's cookie (forwarded to Next.js via the request)
    let token: string | undefined
    try {
        const cookieStore = await cookies()
        token = cookieStore.get('auth_token')?.value
    } catch {
        // cookies() may fail outside of request context
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    }

    // Forward the auth token to the backend
    if (token) {
        headers['Cookie'] = `auth_token=${token}`
        headers['Authorization'] = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            // Important: don't cache authenticated requests
            cache: 'no-store',
        })

        const data = await response.json()

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`
            if (data?.error) {
                if (typeof data.error === 'string') {
                    errorMessage = data.error
                } else if (data.error.message) {
                    errorMessage = data.error.message
                }
            } else if (data?.message) {
                errorMessage = data.message
            }

            return {
                success: false,
                error: errorMessage,
            }
        }

        return data
    } catch (error) {
        console.error(`[serverFetch] ${endpoint} failed:`, error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        }
    }
}

/**
 * Make an authenticated fetch with FormData (file uploads).
 * Does NOT set Content-Type (browser/node will set multipart boundary).
 */
export async function serverFetchFormData<T = any>(
    endpoint: string,
    formData: FormData
): Promise<ServerApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`

    let token: string | undefined
    try {
        const cookieStore = await cookies()
        token = cookieStore.get('auth_token')?.value
    } catch { }

    const headers: Record<string, string> = {}
    if (token) {
        headers['Cookie'] = `auth_token=${token}`
        headers['Authorization'] = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
            cache: 'no-store',
        })

        const data = await response.json()

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`
            if (data?.error?.message) errorMessage = data.error.message
            else if (typeof data?.error === 'string') errorMessage = data.error
            return { success: false, error: errorMessage }
        }

        return data
    } catch (error) {
        console.error(`[serverFetchFormData] ${endpoint} failed:`, error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        }
    }
}
