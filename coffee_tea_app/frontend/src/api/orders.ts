import api from './client'

export interface OrderItemPayload {
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
  customizations?: Record<string, string>
}

export interface CreateOrderPayload {
  items: OrderItemPayload[]
  customer_name?: string
  customer_email?: string
  special_instructions?: string
  applied_deal_code?: string
}

export interface Order {
  id: number
  status: string
  total_amount: number
  discount_amount: number
  customer_name: string | null
  items: OrderItemPayload[]
  created_at: string
}

export const getPaymentIntent = (payload: CreateOrderPayload) =>
  api.post<{ client_secret: string; payment_intent_id: string; subtotal: number; discount: number; total: number }>(
    '/orders/payment-intent', payload
  ).then((r) => r.data)

export const createOrder = (payload: CreateOrderPayload, paymentIntentId: string) =>
  api.post<Order>(`/orders/?payment_intent_id=${paymentIntentId}`, payload).then((r) => r.data)

export const getMyOrders = () => api.get<Order[]>('/orders/my').then((r) => r.data)

export const getOrderStatus = (id: number) => api.get<Order>(`/orders/${id}`).then((r) => r.data)
