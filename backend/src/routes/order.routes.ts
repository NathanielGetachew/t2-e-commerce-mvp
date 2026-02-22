import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create new order & initialize payment (Requires User login)
router.post('/', authenticate, OrderController.createOrder);

// Get orders (User sees theirs, Admin sees all)
router.get('/', authenticate, OrderController.getOrders);

export default router;
