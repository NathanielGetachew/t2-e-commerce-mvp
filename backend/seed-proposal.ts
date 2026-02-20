import { PrismaClient, ProposalType, ProposalStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding test proposal...");
    
    // Get the super admin or any user
    const user = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });
    
    if (!user) {
        throw new Error("No super admin found");
    }

    const proposal = await prisma.productProposal.create({
        data: {
            type: ProposalType.ADD,
            status: ProposalStatus.PENDING,
            proposedByUserId: user.id,
            productData: {
                name: "Test Solar Generator",
                description: "This is a seeded test proposal to verify the queue.",
                price: 15000,
                inStock: true
            }
        }
    });
    
    console.log("Seeded test proposal:", proposal.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
