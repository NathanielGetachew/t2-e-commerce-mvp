// Admin dashboard types
export type DashboardOrderStatus = 'ordered' | 'warehouse_china' | 'shipped' | 'customs_addis' | 'delivered'

export interface DashboardOrder {
  id: string
  orderNumber?: string
  customerName: string
  customerEmail: string
  product: string
  totalAmount: number
  status: DashboardOrderStatus
}