import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Middleware to protect frontend routes that require authentication
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  // Array of protected paths that require an active session
  const protectedPrefixes = ['/admin', '/dashboard']

  const isProtectedPath = protectedPrefixes.some(prefix =>
    request.nextUrl.pathname.startsWith(prefix)
  )

  if (isProtectedPath && !token) {
    // If user tries to access a protected route without a token, redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Apply middleware to all paths except Next.js internals and static assets
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
}
