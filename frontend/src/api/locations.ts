import api from './client'

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

export const getLocations = () =>
  api.get<Location[]>('/locations/').then((r) => r.data)
