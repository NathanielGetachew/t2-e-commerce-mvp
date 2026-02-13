import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Note: We'll create a ProductProposal model in Prisma later
// For now, we'll use a simplified in-memory approach or JSON file

interface ProductProposal {
    id: string;
    type: 'add' | 'remove' | 'update';
    status: 'pending' | 'approved' | 'rejected';
    productData?: any;
    targetProductId?: string;
    proposedBy: string;
    proposedAt: Date;
    reviewedBy?: string;
    reviewedAt?: Date;
}

// In-memory storage (replace with database table in production)
const proposals: ProductProposal[] = [];

export class ProposalService {
    /**
     * Create a product proposal
     */
    static async createProposal(
        type: 'add' | 'remove' | 'update',
        productData: any,
        targetProductId: string | undefined,
        userId: string
    ): Promise<ProductProposal> {
        const proposal: ProductProposal = {
            id: `proposal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            type,
            status: 'pending',
            productData,
            targetProductId,
            proposedBy: userId,
            proposedAt: new Date(),
        };

        proposals.push(proposal);

        logger.info(`Product proposal created: ${proposal.id} by ${userId}`);

        return proposal;
    }

    /**
     * Get all proposals
     */
    static async getProposals(status?: 'pending' | 'approved' | 'rejected'): Promise<ProductProposal[]> {
        if (status) {
            return proposals.filter(p => p.status === status);
        }
        return proposals;
    }

    /**
     * Get proposal by ID
     */
    static async getProposalById(id: string): Promise<ProductProposal | null> {
        return proposals.find(p => p.id === id) || null;
    }

    /**
     * Approve proposal
     */
    static async approveProposal(id: string, userId: string): Promise<ProductProposal> {
        const proposal = proposals.find(p => p.id === id);

        if (!proposal) {
            throw new Error('Proposal not found');
        }

        if (proposal.status !== 'pending') {
            throw new Error('Proposal already processed');
        }

        // Execute the proposal based on type
        if (proposal.type === 'add' && proposal.productData) {
            await prisma.product.create({
                data: proposal.productData,
            });
        } else if (proposal.type === 'update' && proposal.targetProductId) {
            await prisma.product.update({
                where: { id: proposal.targetProductId },
                data: proposal.productData,
            });
        } else if (proposal.type === 'remove' && proposal.targetProductId) {
            await prisma.product.update({
                where: { id: proposal.targetProductId },
                data: { isActive: false },
            });
        }

        proposal.status = 'approved';
        proposal.reviewedBy = userId;
        proposal.reviewedAt = new Date();

        logger.info(`Proposal approved: ${id} by ${userId}`);

        return proposal;
    }

    /**
     * Reject proposal
     */
    static async rejectProposal(id: string, userId: string): Promise<ProductProposal> {
        const proposal = proposals.find(p => p.id === id);

        if (!proposal) {
            throw new Error('Proposal not found');
        }

        if (proposal.status !== 'pending') {
            throw new Error('Proposal already processed');
        }

        proposal.status = 'rejected';
        proposal.reviewedBy = userId;
        proposal.reviewedAt = new Date();

        logger.info(`Proposal rejected: ${id} by ${userId}`);

        return proposal;
    }
}
