import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/products(.*)",
  "/categories(.*)",
  "/search(.*)",
  "/api/webhooks/stripe",
  "/sign-in(.*)",
  "/sign-up(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims, userId } = await auth()
  const role = sessionClaims?.publicMetadata?.role

  // Admins are back-office only; they can test shopping by creating a separate Customer account.
  if (userId && role === "ADMIN") {
    const { pathname } = req.nextUrl
    if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) {
      const url = new URL("/admin", req.url)
      return NextResponse.redirect(url)
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|.*\\..*).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}


