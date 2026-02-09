import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const isDatabaseAvailable = !!process.env.DATABASE_URL

if (!isDatabaseAvailable) {
  console.warn("Warning: DATABASE_URL is missing. Some features may fall back to mock data.")
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Provide a dummy URL if missing to prevent crash on initialization, 
    // although we should check isDatabaseAvailable before calling prisma methods.
    datasources: !isDatabaseAvailable ? {
      db: {
        url: "postgresql://postgres:postgres@localhost:5432/postgres"
      }
    } : undefined
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma


