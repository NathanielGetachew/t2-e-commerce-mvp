import { PrismaClient } from '@prisma/client';
import { ProposalService } from './src/services/proposal.service';

const prisma = new PrismaClient();

async function run() {
    const proposal = await prisma.productProposal.findFirst({
        where: { status: 'PENDING' }
    });

    if (!proposal) {
        console.log("No pending proposal found.");
        return;
    }

    // find super admin
    const admin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    console.log(`Approving proposal: ${proposal.id} by ${admin!.id}`);

    try {
        await ProposalService.approveProposal(proposal.id, admin!.id);
        console.log("Success!");
    } catch (err) {
        console.error("Failed:", err);
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
