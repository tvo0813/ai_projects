import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MenuItem } from '../api/menu'

export interface CartItem {
  item_id: string
  item_name: string
  unit_price: number
  quantity: number
  customizations: Record<string, string>
  image_url: string | null
}

interface CartState {
  items: CartItem[]
  dealCode: string | null
  dealDiscount: number
  addItem: (item: MenuItem, qty: number, customizations: Record<string, string>) => void
  removeItem: (item_id: string) => void
  updateQty: (item_id: string, qty: number) => void
  setDeal: (code: string, discount: number) => void
  clearDeal: () => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      dealCode: null,
      dealDiscount: 0,
      addItem: (item, qty, customizations) => {
        const existing = get().items.find(
          (i) => i.item_id === item.item_id && JSON.stringify(i.customizations) === JSON.stringify(customizations)
        )
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.item_id === item.item_id ? { ...i, quantity: i.quantity + qty } : i
            ),
          }))
        } else {
          set((s) => ({
            items: [
              ...s.items,
              { item_id: item.item_id, item_name: item.name, unit_price: item.price, quantity: qty, customizations, image_url: item.image_url },
            ],
          }))
        }
      },
      removeItem: (item_id) => set((s) => ({ items: s.items.filter((i) => i.item_id !== item_id) })),
      updateQty: (item_id, qty) => {
        if (qty <= 0) {
          get().removeItem(item_id)
        } else {
          set((s) => ({ items: s.items.map((i) => (i.item_id === item_id ? { ...i, quantity: qty } : i)) }))
        }
      },
      setDeal: (code, discount) => set({ dealCode: code, dealDiscount: discount }),
      clearDeal: () => set({ dealCode: null, dealDiscount: 0 }),
      clearCart: () => set({ items: [], dealCode: null, dealDiscount: 0 }),
      total: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
)
