import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AmbassadorApplicationStatus } from '@prisma/client';

export interface AmbassadorResponse {
    id: string;
    email: string | null;
    name: string | null;
    ambassadorCode: string | null;
    commissionRateBp: number;
    isAmbassador: boolean;
    applicationStatus?: AmbassadorApplicationStatus;
    totalEarnings?: number;
    metrics?: {
        clicks: number;
        conversions: number;
        revenueGenerated: number;
    };
}

export interface ReferralStatsResponse {
    ambassadorCode: string | null;
    commissionRateBp: number;
    totalEarnings: number;
    pendingEarnings: number;
    availableForWithdrawal: number;
    metrics: {
        clicks: number;
        conversions: number;
        revenueGenerated: number;
    };
    recentReferrals: Array<{
        id: string;
        orderNumber: string;
        customerName: string | null;
        commissionCents: number;
        status: 'pending' | 'available';
        createdAt: Date;
    }>;
}

export class AffiliateService {
    /**
     * Submit ambassador application
     */
    static async submitApplication(
        userId: string,
        data: {
            socialLinks?: any;
            whyJoin: string;
            marketingStrategy: string;
        }
    ): Promise<void> {
        // Check if user already has an application
        const existing = await prisma.ambassadorApplication.findFirst({
            where: { userId },
        });

        if (existing) {
            throw new Error('You have already submitted an application');
        }

        // Create application
        await prisma.ambassadorApplication.create({
            data: {
                userId,
                status: AmbassadorApplicationStatus.PENDING,
                notes: JSON.stringify({
                    socialLinks: data.socialLinks,
                    whyJoin: data.whyJoin,
                    marketingStrategy: data.marketingStrategy,
                }),
            },
        });

        logger.info(`Ambassador application submitted by user ${userId}`);
    }

    /**
     * Get all pending applications (Admin only)
     */
    static async getPendingApplications(): Promise<any[]> {
        const applications = await prisma.ambassadorApplication.findMany({
            where: { status: AmbassadorApplicationStatus.PENDING },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return applications.map(app => ({
            id: app.id,
            userId: app.user.id,
            userEmail: app.user.email,
            userName: app.user.name,
            applicationData: app.notes ? JSON.parse(app.notes) : null,
            status: app.status,
            createdAt: app.createdAt,
        }));
    }

    /**
     * Approve ambassador application
     */
    static async approveApplication(applicationId: string): Promise<void> {
        const application = await prisma.ambassadorApplication.findUnique({
            where: { id: applicationId },
            include: { user: true },
        });

        if (!application) {
            throw new Error('Application not found');
        }

        if (application.status !== AmbassadorApplicationStatus.PENDING) {
            throw new Error('Application has already been processed');
        }

        // Generate unique ambassador code
        const baseCode = `AMB-${application.user.name?.substring(0, 3).toUpperCase() || 'USR'}-${Math.floor(Math.random() * 10000)}`;

        // Check uniqueness
        let code = baseCode;
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.user.findFirst({
                where: { ambassadorCode: code },
            });

            if (!existing) break;
            code = `${baseCode}-${attempts}`;
            attempts++;
        }

        // Update user and application in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: application.userId },
                data: {
                    isAmbassador: true,
                    ambassadorCode: code,
                    commissionRateBp: 500, // 5% default
                },
            }),
            prisma.ambassadorApplication.update({
                where: { id: applicationId },
                data: { status: AmbassadorApplicationStatus.APPROVED },
            }),
        ]);

        logger.info(`Ambassador application approved for user ${application.userId}, code: ${code}`);
    }

    /**
     * Reject ambassador application
     */
    static async rejectApplication(applicationId: string): Promise<void> {
        const application = await prisma.ambassadorApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new Error('Application not found');
        }

        if (application.status !== AmbassadorApplicationStatus.PENDING) {
            throw new Error('Application has already been processed');
        }

        await prisma.ambassadorApplication.update({
            where: { id: applicationId },
            data: { status: AmbassadorApplicationStatus.REJECTED },
        });

        logger.info(`Ambassador application rejected for user ${application.userId}`);
    }

    /**
     * Update custom ambassador code
     */
    static async updateCustomCode(userId: string, newCode: string): Promise<void> {
        // Check if user is an ambassador
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.isAmbassador) {
            throw new Error('Only ambassadors can update their code');
        }

        // Check if code is already taken
        const existing = await prisma.user.findFirst({
            where: {
                ambassadorCode: newCode,
                NOT: { id: userId },
            },
        });

        if (existing) {
            throw new Error('This code is already taken');
        }

        // Update code
        await prisma.user.update({
            where: { id: userId },
            data: { ambassadorCode: newCode },
        });

        logger.info(`Ambassador code updated for user ${userId} to ${newCode}`);
    }

    /**
     * Validate referral code and return discount info
     */
    static async validateReferralCode(code: string): Promise<{
        valid: boolean;
        ambassadorId?: string;
        ambassadorName?: string;
        discountPercentage?: number;
    }> {
        const ambassador = await prisma.user.findFirst({
            where: {
                ambassadorCode: code,
                isAmbassador: true,
            },
        });

        if (!ambassador) {
            return { valid: false };
        }

        // Check if there are any rejected applications (fraud check)
        const rejectedApp = await prisma.ambassadorApplication.findFirst({
            where: {
                userId: ambassador.id,
                status: AmbassadorApplicationStatus.REJECTED,
            },
        });

        if (rejectedApp) {
            logger.warn(`Attempted use of code from rejected ambassador: ${code}`);
            return { valid: false };
        }

        return {
            valid: true,
            ambassadorId: ambassador.id,
            ambassadorName: ambassador.name || 'Ambassador',
            discountPercentage: 5, // Default 5% discount for customers
        };
    }

    /**
     * Record commission when an order is placed
     * Commission starts as PENDING and will be made available after 14 days
     */
    static async recordCommission(
        orderId: string,
        ambassadorCode: string
    ): Promise<void> {
        // Get ambassador
        const ambassador = await prisma.user.findFirst({
            where: { ambassadorCode, isAmbassador: true },
        });

        if (!ambassador) {
            throw new Error('Invalid ambassador code');
        }

        // Get order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        // Fraud check: Ambassador cannot refer themselves
        if (order.userId === ambassador.id) {
            logger.warn(`Ambassador ${ambassador.id} attempted self-referral on order ${orderId}`);
            throw new Error('Ambassadors cannot refer themselves');
        }

        // Calculate commission
        const commissionCents = Math.floor(
            (order.totalCents * ambassador.commissionRateBp) / 10000
        );

        // Create referral record
        await prisma.ambassadorReferral.create({
            data: {
                ambassadorId: ambassador.id,
                customerId: order.userId,
                orderId: order.id,
                referralCodeUsed: ambassadorCode,
                referralSource: 'direct_link',
                commissionRateBp: ambassador.commissionRateBp,
                commissionCents,
            },
        });

        logger.info(`Commission recorded: ${commissionCents} cents for ambassador ${ambassador.id} on order ${orderId}`);
    }

    /**
     * Get referral stats for an ambassador
     */
    static async getReferralStats(userId: string): Promise<ReferralStatsResponse> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.isAmbassador) {
            throw new Error('User is not an ambassador');
        }

        // Get all referrals
        const referrals = await prisma.ambassadorReferral.findMany({
            where: { ambassadorId: userId },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        createdAt: true,
                    },
                },
                customer: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate totals
        const totalCommissionCents = referrals.reduce((sum, ref) => sum + ref.commissionCents, 0);

        // Pending commissions (orders less than 14 days old)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const pendingCommissionCents = referrals
            .filter(ref => ref.createdAt > fourteenDaysAgo)
            .reduce((sum, ref) => sum + ref.commissionCents, 0);

        const availableCommissionCents = totalCommissionCents - pendingCommissionCents;

        // Calculate metrics
        const totalOrders = referrals.length;
        const totalRevenueCents = referrals.reduce((sum, ref) => {
            // We'd need to get the order total here, simplified for now
            return sum + (ref.commissionCents * 10000 / user.commissionRateBp);
        }, 0);

        return {
            ambassadorCode: user.ambassadorCode,
            commissionRateBp: user.commissionRateBp,
            totalEarnings: totalCommissionCents,
            pendingEarnings: pendingCommissionCents,
            availableForWithdrawal: availableCommissionCents,
            metrics: {
                clicks: 0, // Would need separate click tracking table
                conversions: totalOrders,
                revenueGenerated: totalRevenueCents,
            },
            recentReferrals: referrals.slice(0, 10).map(ref => ({
                id: ref.id,
                orderNumber: ref.order.orderNumber,
                customerName: ref.customer.name,
                commissionCents: ref.commissionCents,
                status: ref.createdAt > fourteenDaysAgo ? 'pending' : 'available',
                createdAt: ref.createdAt,
            })),
        };
    }

    /**
     * Get all ambassadors (Admin only)
     */
    static async getAllAmbassadors(): Promise<AmbassadorResponse[]> {
        const ambassadors = await prisma.user.findMany({
            where: { isAmbassador: true },
            select: {
                id: true,
                email: true,
                name: true,
                ambassadorCode: true,
                commissionRateBp: true,
                isAmbassador: true,
            },
        });

        return ambassadors.map(amb => ({
            id: amb.id,
            email: amb.email,
            name: amb.name,
            ambassadorCode: amb.ambassadorCode,
            commissionRateBp: amb.commissionRateBp,
            isAmbassador: amb.isAmbassador,
        }));
    }
}
