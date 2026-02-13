import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import { orderStatusUpdateSchema, shipmentStatusUpdateSchema } from '../types/admin.types';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, adminOnly);

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with optional filters
 * @access  Admin only
 */
router.get('/orders', AdminController.getOrders);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get order by ID
 * @access  Admin only
 */
router.get('/orders/:id', AdminController.getOrder);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Update order status
 * @access  Admin only
 */
router.patch(
    '/orders/:id/status',
    validate(orderStatusUpdateSchema),
    AdminController.updateOrderStatus
);

/**
 * @route   GET /api/admin/shipments
 * @desc    Get all shipments with optional filters
 * @access  Admin only
 */
router.get('/shipments', AdminController.getShipments);

/**
 * @route   GET /api/admin/shipments/:id
 * @desc    Get shipment by ID
 * @access  Admin only
 */
router.get('/shipments/:id', AdminController.getShipment);

/**
 * @route   PATCH /api/admin/shipments/:id/status
 * @desc    Update shipment status
 * @access  Admin only
 */
router.patch(
    '/shipments/:id/status',
    validate(shipmentStatusUpdateSchema),
    AdminController.updateShipmentStatus
);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get dashboard analytics
 * @access  Admin only
 */
router.get('/analytics', AdminController.getAnalytics);

export default router;
