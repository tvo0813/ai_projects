import api from './client'
import { staticLocations } from './staticClient'

export interface Location {
  name: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  hours: string | null
  phone: string | null
  full_address: string
  maps_embed_url_keyed: string
  maps_embed_url_legacy: string
  maps_link_url: string
}

// ── Toggle: set VITE_STATIC_MODE=true to bypass the backend (GitHub Pages) ──
const STATIC = import.meta.env.VITE_STATIC_MODE === 'true'

export const getLocations = (): Promise<Location[]> => {
  if (STATIC) return staticLocations<Location[]>()
  return api.get<Location[]>('/locations/').then(r => r.data)
}
