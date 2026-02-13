import { z } from 'zod';
import { OrderStatus, ShipmentStatus } from '@prisma/client';

// Order status update schema
export const orderStatusUpdateSchema = z.object({
    status: z.nativeEnum(OrderStatus),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

// Shipment status update schema
export const shipmentStatusUpdateSchema = z.object({
    status: z.nativeEnum(ShipmentStatus),
    notes: z.string().optional(),
});

export type ShipmentStatusUpdateInput = z.infer<typeof shipmentStatusUpdateSchema>;

// Query params schema
export const paginationSchema = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
