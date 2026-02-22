import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ResponseHandler } from '../utils/responses';
import { PaymentService } from '../services/payment.service';
import { CreateOrderPayload } from '../types/order.types';
import { logger } from '../utils/logger';

export class OrderController {
    /**
     * POST /api/orders
     * Create a new order and initialize Chapa payment
     */
    static async createOrder(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return ResponseHandler.unauthorized(res, 'Must be logged in to create an order');
            }

            const payload: CreateOrderPayload = req.body;
            if (!payload || !payload.cart || payload.cart.length === 0) {
                return ResponseHandler.error(res, 'Cart is empty', 400);
            }

            // 1. Calculate and verify prices from DB
            let subtotalCents = 0;
            const orderItemsInput = [];

            for (const item of payload.cart) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product || !product.isActive) {
                    return ResponseHandler.error(res, `Product ${item.productId} is not available`, 400);
                }

                if (product.stock < item.quantity) {
                    return ResponseHandler.error(res, `Not enough stock for ${product.name}`, 400);
                }

                const lineTotal = product.singlePriceCents * item.quantity;
                subtotalCents += lineTotal;

                orderItemsInput.push({
                    productId: product.id,
                    quantity: item.quantity,
                    appliedUnitPriceCents: product.singlePriceCents,
                    lineTotalCents: lineTotal
                });
            }

            // 2. Simplification: Assume no discounts for now unless calculated
            const discountCents = 0;
            const totalCents = subtotalCents - discountCents;

            // 3. Generate tracking info
            const timestamp = Date.now().toString();
            const orderNumber = `ORD-${timestamp.slice(-6)}-${Math.floor(Math.random() * 1000)}`;
            const tx_ref = `T2-${timestamp}-${Math.floor(Math.random() * 10000)}`;

            // 4. Create Order in Pending State
            const order = await prisma.order.create({
                data: {
                    orderNumber,
                    userId,
                    subtotalCents,
                    discountCents,
                    totalCents,
                    chapaTransactionRef: tx_ref,
                    status: 'PENDING',
                    items: {
                        create: orderItemsInput
                    }
                }
            });

            // 5. Initialize Chapa Payment
            const amountBirr = (totalCents / 100).toString();
            const chapaPayload = {
                amount: amountBirr,
                currency: "ETB",
                email: payload.customer?.email || req.user?.email || "nathigechmaranata@gmail.com",
                first_name: payload.customer?.firstName || req.user?.name?.split(' ')[0] || "Customer",
                last_name: payload.customer?.lastName || req.user?.name?.split(' ').slice(1).join(' ') || "Name",
                phone_number: payload.customer?.phone || "0900000000",
                tx_ref: tx_ref,
                callback_url: `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/webhooks/chapa`,
                return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success?order=${orderNumber}`,
                customization: {
                    title: "T2 Shop",
                    description: `Order ${orderNumber}`,
                }
            };

            const chapaResponse = await PaymentService.initializeChapaPayment(chapaPayload);

            if (!chapaResponse.success) {
                logger.error('Failed to initialize Chapa payment:', chapaResponse.error);
                // We keep the order as PENDING. The user might retry.
                return ResponseHandler.error(res, 'Payment initialization failed', 500);
            }

            // Return the checkout URL from Chapa and the order info
            return ResponseHandler.success(res, {
                orderId: order.id,
                orderNumber: order.orderNumber,
                checkoutUrl: chapaResponse.data.checkout_url
            }, 'Order initialized successfully', 201);

        } catch (error: any) {
            logger.error('Create order error:', error);
            return ResponseHandler.error(res, 'Failed to create order', 500);
        }
    }

    /**
     * GET /api/orders
     * Fetch all orders (Admin route) or user's orders
     */
    static async getOrders(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return ResponseHandler.unauthorized(res);
            }

            const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

            // Admins see all, users see their own
            const whereClause = isAdmin ? {} : { userId: user.userId };

            const orders = await prisma.order.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    items: {
                        include: {
                            product: { select: { name: true, images: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return ResponseHandler.success(res, { orders });
        } catch (error: any) {
            logger.error('Get orders error:', error);
            return ResponseHandler.error(res, 'Failed to fetch orders', 500);
        }
    }
}
