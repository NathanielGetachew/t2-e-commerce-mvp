// Admin dashboard types
// These match both the Prisma schema OrderStatus values AND legacy frontend values
export type DashboardOrderStatus =
  // Prisma enum values (actual DB values)
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  // Legacy frontend display values (kept for backward compatibility)
  | 'ordered'
  | 'warehouse_china'
  | 'customs_addis'

export interface DashboardOrder {
  id: string
  orderNumber?: string
  customerName: string
  customerEmail: string
  product: string
  totalAmount: number
  status: DashboardOrderStatus
}