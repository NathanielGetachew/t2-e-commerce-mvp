import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// For now, middleware just passes through. All auth is handled via mock session
// in app/auth/actions.ts. We keep this file so we can easily add custom logic later.
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
}

