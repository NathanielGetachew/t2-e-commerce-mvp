import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { OrderStatus, ShipmentStatus } from '@prisma/client';

export interface OrderResponse {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    userId: string;
    customerName: string | null;
    customerEmail: string | null;
    currency: string;
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    items: OrderItemResponse[];
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItemResponse {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    appliedUnitPriceCents: number;
    lineTotalCents: number;
}

export interface ShipmentResponse {
    id: string;
    containerId: string;
    status: ShipmentStatus;
    notes: string | null;
    productionStartedAt: Date | null;
    shippedFromChinaAt: Date | null;
    inCustomsAt: Date | null;
    receivedAtWarehouseAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface AnalyticsResponse {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    activeShipments: number;
    revenueTrend: { month: string; revenue: number }[];
    topProducts: { name: string; sales: number; revenue: number }[];
    ordersByStatus: { status: string; count: number }[];
}

export class AdminService {
    /**
     * Get all orders with pagination and optional status filter
     */
    static async getOrders(
        page: number = 1,
        limit: number = 20,
        status?: OrderStatus
    ): Promise<{ orders: OrderResponse[]; total: number }> {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.order.count({ where }),
        ]);

        return {
            orders: orders.map(this.formatOrder),
            total,
        };
    }

    /**
     * Get order by ID
     */
    static async getOrderById(id: string): Promise<OrderResponse | null> {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) return null;

        return this.formatOrder(order);
    }

    /**
     * Update order status
     */
    static async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderResponse> {
        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        logger.info(`Order ${order.orderNumber} status updated to ${status}`);

        return this.formatOrder(order);
    }

    /**
     * Get all shipments with pagination
     */
    static async getShipments(
        page: number = 1,
        limit: number = 20,
        status?: ShipmentStatus
    ): Promise<{ shipments: ShipmentResponse[]; total: number }> {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        const [shipments, total] = await prisma.$transaction([
            prisma.shipment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.shipment.count({ where }),
        ]);

        return {
            shipments: shipments.map(this.formatShipment),
            total,
        };
    }

    /**
     * Get shipment by ID
     */
    static async getShipmentById(id: string): Promise<ShipmentResponse | null> {
        const shipment = await prisma.shipment.findUnique({
            where: { id },
        });

        if (!shipment) return null;

        return this.formatShipment(shipment);
    }

    /**
     * Update shipment status
     */
    static async updateShipmentStatus(
        id: string,
        status: ShipmentStatus,
        userId: string,
        notes?: string
    ): Promise<ShipmentResponse> {
        // Update shipment status and timestamp based on status
        const updateData: any = {
            status,
            notes,
            updatedByUserId: userId,
        };

        // Set appropriate timestamp based on status
        switch (status) {
            case ShipmentStatus.IN_PRODUCTION:
                updateData.productionStartedAt = new Date();
                break;
            case ShipmentStatus.SHIPPED_FROM_CHINA:
                updateData.shippedFromChinaAt = new Date();
                break;
            case ShipmentStatus.IN_CUSTOMS:
                updateData.inCustomsAt = new Date();
                break;
            case ShipmentStatus.RECEIVED_AT_WAREHOUSE:
                updateData.receivedAtWarehouseAt = new Date();
                break;
        }

        const shipment = await prisma.shipment.update({
            where: { id },
            data: updateData,
        });

        // Create status history entry
        await prisma.shipmentStatusHistory.create({
            data: {
                shipmentId: id,
                status,
                note: notes,
                changedByUserId: userId,
            },
        });

        logger.info(`Shipment ${shipment.containerId} status updated to ${status}`);

        return this.formatShipment(shipment);
    }

    /**
     * Get analytics data
     */
    static async getAnalytics(): Promise<AnalyticsResponse> {
        // Get total revenue from all completed orders
        const completedOrders = await prisma.order.findMany({
            where: {
                status: {
                    in: [OrderStatus.PAID, OrderStatus.DELIVERED],
                },
            },
            select: {
                totalCents: true,
                createdAt: true,
            },
        });

        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalCents, 0);

        // Get order counts
        const [totalOrders, pendingOrders] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        ]);

        // Get active shipments
        const activeShipments = await prisma.shipment.count({
            where: {
                status: {
                    not: ShipmentStatus.RECEIVED_AT_WAREHOUSE,
                },
            },
        });

        // Revenue trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyOrders = await prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: {
                    gte: sixMonthsAgo,
                },
                status: {
                    in: [OrderStatus.PAID, OrderStatus.DELIVERED],
                },
            },
            _sum: {
                totalCents: true,
            },
        });

        // Group by month
        const revenueTrend = this.groupByMonth(monthlyOrders);

        // Top products by revenue
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
                lineTotalCents: true,
            },
            orderBy: {
                _sum: {
                    lineTotalCents: 'desc',
                },
            },
            take: 10,
        });

        // Get product names
        const topProductsWithNames = await Promise.all(
            topProducts.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true },
                });

                return {
                    name: product?.name || 'Unknown Product',
                    sales: item._sum.quantity || 0,
                    revenue: item._sum.lineTotalCents || 0,
                };
            })
        );

        // Orders by status
        const ordersByStatus = await prisma.order.groupBy({
            by: ['status'],
            _count: true,
        });

        return {
            totalRevenue,
            totalOrders,
            pendingOrders,
            activeShipments,
            revenueTrend,
            topProducts: topProductsWithNames,
            ordersByStatus: ordersByStatus.map((item) => ({
                status: item.status,
                count: item._count,
            })),
        };
    }

    /**
     * Format order response
     */
    private static formatOrder(order: any): OrderResponse {
        return {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            userId: order.userId,
            customerName: order.user?.name || null,
            customerEmail: order.user?.email || null,
            currency: order.currency,
            subtotalCents: order.subtotalCents,
            discountCents: order.discountCents,
            totalCents: order.totalCents,
            items: order.items?.map((item: any) => ({
                id: item.id,
                productId: item.productId,
                productName: item.product?.name || 'Unknown Product',
                quantity: item.quantity,
                appliedUnitPriceCents: item.appliedUnitPriceCents,
                lineTotalCents: item.lineTotalCents,
            })) || [],
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }

    /**
     * Format shipment response
     */
    private static formatShipment(shipment: any): ShipmentResponse {
        return {
            id: shipment.id,
            containerId: shipment.containerId,
            status: shipment.status,
            notes: shipment.notes,
            productionStartedAt: shipment.productionStartedAt,
            shippedFromChinaAt: shipment.shippedFromChinaAt,
            inCustomsAt: shipment.inCustomsAt,
            receivedAtWarehouseAt: shipment.receivedAtWarehouseAt,
            createdAt: shipment.createdAt,
            updatedAt: shipment.updatedAt,
        };
    }

    /**
     * Group orders by month for revenue trend
     */
    private static groupByMonth(orders: any[]): { month: string; revenue: number }[] {
        const monthMap = new Map<string, number>();

        orders.forEach((order) => {
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const revenue = monthMap.get(monthKey) || 0;
            monthMap.set(monthKey, revenue + (order._sum?.totalCents || 0));
        });

        // Convert to array and format
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return Array.from(monthMap.entries())
            .map(([key, revenue]) => {
                const [_year, month] = key.split('-');
                return {
                    month: months[parseInt(month) - 1],
                    revenue,
                };
            })
            .sort((a, b) => {
                const monthA = months.indexOf(a.month);
                const monthB = months.indexOf(b.month);
                return monthA - monthB;
            });
    }
}
