import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // get a pending proposal
    const proposal = await prisma.productProposal.findFirst({
        where: { status: 'PENDING' }
    });
    
    if (!proposal) {
        console.log("No pending proposals found!");
        return;
    }
    
    // get an admin
    const admin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });
    
    console.log(`Approving proposal: ${proposal.id} with admin ${admin!.id}`);
    
    try {
        const { ProposalService } = require('./src/services/proposal.service');
        await ProposalService.approveProposal(proposal.id, admin!.id);
        console.log("Approval successful!");
    } catch(err) {
        console.error("Approval failed:", err);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
