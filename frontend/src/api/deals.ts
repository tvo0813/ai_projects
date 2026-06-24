import api from './client'
import { staticDeals } from './staticClient'

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

// ── Toggle: set VITE_STATIC_MODE=true to bypass the backend (GitHub Pages) ──
const STATIC = import.meta.env.VITE_STATIC_MODE === 'true'

export const getPublicDeals = (): Promise<PublicDeal[]> => {
  if (STATIC) return staticDeals<PublicDeal[]>()
  return api.get<PublicDeal[]>('/deals/public').then(r => r.data)
}

export const spinForDeal = () => api.post<SpinResult>('/deals/spin').then((r) => r.data)

export const validateCode = (code: string) =>
  api.get<{ valid: boolean; discount_type: string; discount_value: number; title: string }>(
    `/deals/validate/${code}`
  ).then((r) => r.data)
