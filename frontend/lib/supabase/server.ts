import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Server-side Supabase client for use in Server Components and Route Handlers.
 * Do not store in global variables - always create fresh instance.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    })
}
