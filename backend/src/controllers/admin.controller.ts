import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { ResponseHandler } from '../utils/responses';
import { logger } from '../utils/logger';
import { OrderStatus, ShipmentStatus } from '@prisma/client';

export class AdminController {
    /**
     * GET /api/admin/orders
     * Get all orders with optional status filter
     */
    static async getOrders(req: Request, res: Response): Promise<Response> {
        try {
            const { page = '1', limit = '20', status } = req.query;

            const result = await AdminService.getOrders(
                parseInt(page as string),
                parseInt(limit as string),
                status as OrderStatus | undefined
            );

            return ResponseHandler.success(res, {
                orders: result.orders,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total: result.total,
                    pages: Math.ceil(result.total / parseInt(limit as string)),
                },
            });
        } catch (error: any) {
            logger.error('Get orders error:', error);
            return ResponseHandler.error(res, 'Failed to get orders');
        }
    }

    /**
     * GET /api/admin/orders/:id
     * Get order by ID
     */
    static async getOrder(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;

            const order = await AdminService.getOrderById(id);

            if (!order) {
                return ResponseHandler.notFound(res, 'Order not found');
            }

            return ResponseHandler.success(res, { order });
        } catch (error: any) {
            logger.error('Get order error:', error);
            return ResponseHandler.error(res, 'Failed to get order');
        }
    }

    /**
     * PATCH /api/admin/orders/:id/status
     * Update order status
     */
    static async updateOrderStatus(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const order = await AdminService.updateOrderStatus(id, status);

            return ResponseHandler.success(res, { order }, 'Order status updated successfully');
        } catch (error: any) {
            logger.error('Update order status error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to update order status', 400);
        }
    }

    /**
     * GET /api/admin/shipments
     * Get all shipments
     */
    static async getShipments(req: Request, res: Response): Promise<Response> {
        try {
            const { page = '1', limit = '20', status } = req.query;

            const result = await AdminService.getShipments(
                parseInt(page as string),
                parseInt(limit as string),
                status as ShipmentStatus | undefined
            );

            return ResponseHandler.success(res, {
                shipments: result.shipments,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total: result.total,
                    pages: Math.ceil(result.total / parseInt(limit as string)),
                },
            });
        } catch (error: any) {
            logger.error('Get shipments error:', error);
            return ResponseHandler.error(res, 'Failed to get shipments');
        }
    }

    /**
     * GET /api/admin/shipments/:id
     * Get shipment by ID
     */
    static async getShipment(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;

            const shipment = await AdminService.getShipmentById(id);

            if (!shipment) {
                return ResponseHandler.notFound(res, 'Shipment not found');
            }

            return ResponseHandler.success(res, { shipment });
        } catch (error: any) {
            logger.error('Get shipment error:', error);
            return ResponseHandler.error(res, 'Failed to get shipment');
        }
    }

    /**
     * PATCH /api/admin/shipments/:id/status
     * Update shipment status
     */
    static async updateShipmentStatus(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const userId = req.user!.userId;

            const shipment = await AdminService.updateShipmentStatus(id, status, userId, notes);

            return ResponseHandler.success(res, { shipment }, 'Shipment status updated successfully');
        } catch (error: any) {
            logger.error('Update shipment status error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to update shipment status', 400);
        }
    }

    /**
     * GET /api/admin/analytics
     * Get analytics data for admin dashboard
     */
    static async getAnalytics(req: Request, res: Response): Promise<Response> {
        try {
            const analytics = await AdminService.getAnalytics();

            return ResponseHandler.success(res, analytics);
        } catch (error: any) {
            logger.error('Get analytics error:', error);
            return ResponseHandler.error(res, 'Failed to get analytics');
        }
    }
}
