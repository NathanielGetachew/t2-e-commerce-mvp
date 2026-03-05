import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // DISK: console.log("Middleware: updateSession for", request.nextUrl.pathname)

  // 1. CHECK FOR MOCK SESSION FIRST TO BYPASS SUPABASE
  const mockSession = request.cookies.get("mock-auth-session")
  if (mockSession) {
    let userData = null;
    try {
      userData = JSON.parse(mockSession.value);
    } catch (e) {
      // invalid cookie, ignore
    }

    if (userData) {
      const isAdmin = userData.is_admin === true;
      const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

      // Redirect away from auth pages if logged in
      if (isAuthPage && !request.nextUrl.pathname.includes("sign-up-success")) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // Admin page protection
      if (request.nextUrl.pathname.startsWith("/admin") && !isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // If everything is fine for mock session, just proceed
      return NextResponse.next();
    }
  }

  // 2. FALLBACK TO SUPABASE (Original logic)
  let supabaseResponse = NextResponse.next({
    request,
  })

  // ... (rest of the Supabase logic)
  const trimmedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()!;
  const trimmedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()!;

  const supabase = createServerClient(
    trimmedUrl,
    trimmedKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    const isAdmin = user.user_metadata?.is_admin === true
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  if (!user && (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/checkout"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
