import { auth } from "@clerk/nextjs/server"

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "CUSTOMER"

export async function getClerkRole(): Promise<AppRole> {
  const { sessionClaims } = await auth()
  const role = (sessionClaims as any)?.publicMetadata?.role
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "CUSTOMER") return role
  return "CUSTOMER"
}

export async function requireRole(allowed: AppRole[]) {
  const role = await getClerkRole()
  if (!allowed.includes(role)) {
    throw new Error("Forbidden")
  }
}


