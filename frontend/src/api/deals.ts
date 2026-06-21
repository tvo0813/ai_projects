import api from './client'

export interface PublicDeal {
  title: string
  description: string
  discount_type: string
  discount_value: number
  label: string
  expires_at: string | null
  badge: string | null
}

export interface SpinResult {
  won: boolean
  deal_code: string | null
  title: string | null
  description: string | null
  discount_type: string | null
  discount_value: number | null
  message: string
}

export const getPublicDeals = () =>
  api.get<PublicDeal[]>('/deals/public').then((r) => r.data)

export const spinForDeal = () => api.post<SpinResult>('/deals/spin').then((r) => r.data)

export const validateCode = (code: string) =>
  api.get<{ valid: boolean; discount_type: string; discount_value: number; title: string }>(
    `/deals/validate/${code}`
  ).then((r) => r.data)
