import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()

  // Clear all auth-related cookies
  cookieStore.delete("auth_token")
  cookieStore.delete("mock-session")

  return NextResponse.json({ success: true })
}
