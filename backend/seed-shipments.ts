import { PrismaClient, ShipmentStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding shipments...");
    await prisma.shipment.create({
        data: { containerId: "TRK-99887766", status: ShipmentStatus.SHIPPED_FROM_CHINA, notes: "Solar panels" }
    });
    await prisma.shipment.create({
        data: { containerId: "TRK-11223344", status: ShipmentStatus.IN_PRODUCTION, notes: "Sewing machines" }
    });
    await prisma.shipment.create({
        data: { containerId: "TRK-55443322", status: ShipmentStatus.IN_CUSTOMS, notes: "Hydraulic presses" }
    });
    console.log("Seeded shipments.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
