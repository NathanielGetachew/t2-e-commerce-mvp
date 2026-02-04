import { auth } from "@clerk/nextjs/server"

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "CUSTOMER"

export function getClerkRole(): AppRole {
  const { sessionClaims } = auth()
  const role = sessionClaims?.publicMetadata?.role
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "CUSTOMER") return role
  return "CUSTOMER"
}

export function requireRole(allowed: AppRole[]) {
  const role = getClerkRole()
  if (!allowed.includes(role)) {
    throw new Error("Forbidden")
  }
}


