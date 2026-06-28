/**
 * Static data client — reads pre-generated JSON from /public/data/<slug>/.
 * Used when VITE_STATIC_MODE=true (GitHub Pages / no backend).
 * To re-enable the live backend: remove VITE_STATIC_MODE from your env / workflow.
 */

import { STORE_SLUG } from '../config/store'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

async function fetchJSON<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}/data/${STORE_SLUG}/${file}`)
  if (!res.ok) throw new Error(`Static data fetch failed: ${file}`)
  return res.json() as Promise<T>
}

export const staticMenu      = <T>() => fetchJSON<T>('menu.json')
export const staticDeals     = <T>() => fetchJSON<T>('deals.json')
export const staticLocations = <T>() => fetchJSON<T>('locations.json')
