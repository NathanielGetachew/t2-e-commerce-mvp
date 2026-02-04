import { PrismaClient, ShipmentStatus, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Categories
  const categories = await prisma.category.createMany({
    data: [
      { name: "Electronics", slug: "electronics" },
      { name: "Industrial", slug: "industrial" },
      { name: "Home & Kitchen", slug: "home-kitchen" },
    ],
    skipDuplicates: true,
  })

  void categories

  const electronics = await prisma.category.findUnique({ where: { slug: "electronics" } })
  const industrial = await prisma.category.findUnique({ where: { slug: "industrial" } })

  // Users (Clerk-backed; we store clerkId + role + ambassador state)
  const superAdmin = await prisma.user.upsert({
    where: { clerkId: "clerk_super_admin_demo" },
    update: { role: UserRole.SUPER_ADMIN, email: "superadmin@example.com", name: "Super Admin" },
    create: {
      clerkId: "clerk_super_admin_demo",
      role: UserRole.SUPER_ADMIN,
      email: "superadmin@example.com",
      name: "Super Admin",
    },
  })

  const admin = await prisma.user.upsert({
    where: { clerkId: "clerk_admin_demo" },
    update: { role: UserRole.ADMIN, email: "admin@example.com", name: "Admin" },
    create: {
      clerkId: "clerk_admin_demo",
      role: UserRole.ADMIN,
      email: "admin@example.com",
      name: "Admin",
    },
  })

  const ambassador = await prisma.user.upsert({
    where: { clerkId: "clerk_ambassador_demo" },
    update: {
      role: UserRole.CUSTOMER,
      isAmbassador: true,
      ambassadorCode: "T2-AMB-1001",
      commissionRateBp: 500,
      email: "ambassador@example.com",
      name: "Ambassador",
    },
    create: {
      clerkId: "clerk_ambassador_demo",
      role: UserRole.CUSTOMER,
      isAmbassador: true,
      ambassadorCode: "T2-AMB-1001",
      commissionRateBp: 500,
      email: "ambassador@example.com",
      name: "Ambassador",
    },
  })

  void superAdmin
  void admin
  void ambassador

  // Products + bulk tiers
  const p1 = await prisma.product.upsert({
    where: { slug: "lenovo-thinkpad-laptop" },
    update: {},
    create: {
      slug: "lenovo-thinkpad-laptop",
      name: "Lenovo ThinkPad Laptop",
      description: "Business-grade laptop with strong durability and excellent keyboard.",
      images: ["/lenovo-thinkpad-laptop.jpg"],
      singlePriceCents: 129900,
      stock: 120,
      categoryId: electronics?.id,
      bulkTiers: {
        create: [
          { minQty: 1, maxQty: 49, unitPriceCents: 129900 },
          { minQty: 50, maxQty: 99, unitPriceCents: 118900 },
          { minQty: 100, maxQty: null, unitPriceCents: 109900 },
        ],
      },
    },
  })

  const p2 = await prisma.product.upsert({
    where: { slug: "hydraulic-press-machine" },
    update: {},
    create: {
      slug: "hydraulic-press-machine",
      name: "Hydraulic Press Machine",
      description: "Industrial-grade hydraulic press for manufacturing and assembly lines.",
      images: ["/hydraulic-press-machine.jpg"],
      singlePriceCents: 849900,
      stock: 15,
      categoryId: industrial?.id,
      bulkTiers: {
        create: [
          { minQty: 1, maxQty: 4, unitPriceCents: 849900 },
          { minQty: 5, maxQty: 9, unitPriceCents: 799900 },
          { minQty: 10, maxQty: null, unitPriceCents: 749900 },
        ],
      },
    },
  })

  void p1
  void p2

  // Shipments + history
  await prisma.shipment.upsert({
    where: { containerId: "T2-CN-0001" },
    update: {},
    create: {
      containerId: "T2-CN-0001",
      status: ShipmentStatus.SHIPPED_FROM_CHINA,
      notes: "First demo container",
      shippedFromChinaAt: new Date(),
      history: {
        create: [
          { status: ShipmentStatus.IN_PRODUCTION, note: "Production started" },
          { status: ShipmentStatus.SHIPPED_FROM_CHINA, note: "Left port in China" },
        ],
      },
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


