import api from './client'
import { staticMenu } from './staticClient'

export interface MenuItem {
  item_id: string
  name: string
  category: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  config_json: Record<string, string[]> | null
  tags: string[] | null
}

// ── Toggle: set VITE_STATIC_MODE=true to bypass the backend (GitHub Pages) ──
const STATIC = import.meta.env.VITE_STATIC_MODE === 'true'

export const getMenuItems = (category?: string): Promise<MenuItem[]> => {
  if (STATIC) {
    return staticMenu<MenuItem[]>().then(items =>
      category ? items.filter(i => i.category === category || i.tags?.includes(category)) : items
    )
  }
  return api.get<MenuItem[]>('/menu/', { params: category ? { category } : {} }).then(r => r.data)
}

export const getCategories = (): Promise<string[]> => {
  if (STATIC) {
    return staticMenu<MenuItem[]>().then(items => [...new Set(items.map(i => i.category))])
  }
  return api.get<{ categories: string[] }>('/menu/categories').then(r => r.data.categories)
}
