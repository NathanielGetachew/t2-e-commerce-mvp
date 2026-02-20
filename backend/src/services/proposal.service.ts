import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ProposalType, ProposalStatus } from '@prisma/client';

export class ProposalService {
    /**
     * Create a product proposal
     */
    static async createProposal(
        type: 'add' | 'remove' | 'update',
        productData: any,
        targetProductId: string | undefined,
        userId: string
    ) {
        const proposal = await prisma.productProposal.create({
            data: {
                type: type.toUpperCase() as ProposalType,
                productData: productData ?? undefined,
                targetProductId: targetProductId ?? undefined,
                proposedByUserId: userId,
            }
        });

        logger.info(`Product proposal created: ${proposal.id} by ${userId}`);

        return proposal;
    }

    /**
     * Get all proposals
     */
    static async getProposals(status?: 'pending' | 'approved' | 'rejected') {
        const where: any = {};
        if (status) {
            where.status = status.toUpperCase() as ProposalStatus;
        }

        return prisma.productProposal.findMany({
            where,
            include: {
                proposedByUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                targetProduct: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                proposedAt: 'desc'
            }
        });
    }

    /**
     * Get proposal by ID
     */
    static async getProposalById(id: string) {
        return prisma.productProposal.findUnique({
            where: { id },
            include: {
                proposedByUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                targetProduct: true
            }
        });
    }

    /**
     * Approve proposal
     */
    static async approveProposal(id: string, userId: string) {
        try {
            console.log(`[ProposalService] Starting approval for id=${id}`);
            const proposal = await prisma.productProposal.findUnique({
                where: { id }
            });

            if (!proposal) {
                console.error(`[ProposalService] Proposal not found id=${id}`);
                throw new Error('Proposal not found');
            }

            if (proposal.status !== ProposalStatus.PENDING) {
                console.error(`[ProposalService] Proposal already processed id=${id}, status=${proposal.status}`);
                throw new Error('Proposal already processed');
            }

            console.log(`[ProposalService] Processing type=${proposal.type}, data=${JSON.stringify(proposal.productData)}`);

            // Execute the proposal based on type
            if (proposal.type === ProposalType.ADD && proposal.productData) {
                const data: any = proposal.productData;

                // Only attach categoryId if it's a valid ID
                // to avoid constraint null errors

                const createPayload = {
                    name: String(data.name || 'Unnamed Product'),
                    description: String(data.description || ''),
                    slug: String(data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now().toString().slice(-4) : `product-${Date.now()}`)),
                    singlePriceCents: Number(data.singlePriceCents ?? Math.round((data.price || 0) * 100)),
                    currency: String(data.currency || 'ETB'),
                    stock: Number(data.stock ?? (data.inStock ? 100 : 0)),
                    categoryId: data.categoryId || data.category || undefined,
                    images: Array.isArray(data.images) ? data.images : [],
                    isActive: Boolean(data.isActive ?? true),
                };

                console.log(`[ProposalService] Payload for Prisma create:`, JSON.stringify(createPayload));

                await prisma.product.create({
                    data: createPayload as any,
                });
            } else if (proposal.type === ProposalType.UPDATE && proposal.targetProductId) {
                const data: any = proposal.productData || {};
                const updateData: any = {};

                if (data.name !== undefined) updateData.name = String(data.name);
                if (data.description !== undefined) updateData.description = String(data.description);
                if (data.slug !== undefined) updateData.slug = String(data.slug);
                if (data.price !== undefined) updateData.singlePriceCents = Number(Math.round(data.price * 100));
                if (data.singlePriceCents !== undefined) updateData.singlePriceCents = Number(data.singlePriceCents);
                if (data.currency !== undefined) updateData.currency = String(data.currency);
                if (data.stock !== undefined) updateData.stock = Number(data.stock);
                if (data.inStock !== undefined && data.stock === undefined) updateData.stock = data.inStock ? 100 : 0;

                const cid = data.categoryId || data.category;
                if (cid && typeof cid === 'string' && cid !== 'Uncategorized' && cid.length > 5) {
                    updateData.categoryId = cid;
                }

                if (data.images !== undefined) updateData.images = Array.isArray(data.images) ? data.images : [];
                if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

                console.log(`[ProposalService] Payload for Prisma update target=${proposal.targetProductId}:`, JSON.stringify(updateData));

                await prisma.product.update({
                    where: { id: proposal.targetProductId },
                    data: updateData,
                });
            } else if (proposal.type === ProposalType.REMOVE && proposal.targetProductId) {
                console.log(`[ProposalService] Soft-deleting target=${proposal.targetProductId}`);
                await prisma.product.update({
                    where: { id: proposal.targetProductId },
                    data: { isActive: false },
                });
            }

            // Update proposal status
            const updatedProposal = await prisma.productProposal.update({
                where: { id },
                data: {
                    status: ProposalStatus.APPROVED,
                    reviewedByUserId: userId,
                    reviewedAt: new Date()
                }
            });

            logger.info(`Proposal approved: ${id} by ${userId}`);

            return updatedProposal;
        } catch (error) {
            console.error(`[ProposalService] Fatal error in approveProposal:`, error);
            throw error;
        }
    }

    /**
     * Reject proposal
     */
    static async rejectProposal(id: string, userId: string) {
        const proposal = await prisma.productProposal.findUnique({
            where: { id }
        });

        if (!proposal) {
            throw new Error('Proposal not found');
        }

        if (proposal.status !== ProposalStatus.PENDING) {
            throw new Error('Proposal already processed');
        }

        const updatedProposal = await prisma.productProposal.update({
            where: { id },
            data: {
                status: ProposalStatus.REJECTED,
                reviewedByUserId: userId,
                reviewedAt: new Date()
            }
        });

        logger.info(`Proposal rejected: ${id} by ${userId}`);

        return updatedProposal;
    }
}
