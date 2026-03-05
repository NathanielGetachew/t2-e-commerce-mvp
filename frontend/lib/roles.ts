export type AppRole = "SUPER_ADMIN" | "ADMIN" | "CUSTOMER"

// Placeholder implementation while running without Clerk.
// In dev/mock mode we don't have a global auth context here, so these helpers
// should be replaced with route-specific logic if needed.
export async function getClerkRole(): Promise<AppRole> {
  return "CUSTOMER"
}

export async function requireRole(allowed: AppRole[]) {
  const role = await getClerkRole()
  if (!allowed.includes(role)) {
    throw new Error("Forbidden")
  }
}


