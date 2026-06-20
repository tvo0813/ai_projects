import api from './client'

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

export const getMenuItems = (category?: string) =>
  api.get<MenuItem[]>('/menu/', { params: category ? { category } : {} }).then((r) => r.data)

export const getCategories = () =>
  api.get<{ categories: string[] }>('/menu/categories').then((r) => r.data.categories)
