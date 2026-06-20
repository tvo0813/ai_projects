# Frontend — Detailed Reference

## Stack & Versions

| Package | Version | Purpose |
|---|---|---|
| react | 18.3.1 | UI framework |
| react-dom | 18.3.1 | DOM rendering |
| react-router-dom | 6.23.1 | Client-side routing |
| axios | 1.7.2 | HTTP client |
| zustand | 4.5.2 | State management |
| framer-motion | 11.2.11 | Animations |
| react-hot-toast | 2.4.1 | Toast notifications |
| @stripe/react-stripe-js | 2.7.1 | Stripe Elements UI |
| @stripe/stripe-js | 3.4.1 | Stripe.js loader |
| typescript | 5.4.5 | Type safety |
| vite | 5.2.13 | Build tool + dev server |

## Directory Structure

```
frontend/src/
├── App.tsx               — root component, React Router routes
├── main.tsx              — entry point
├── index.css             — global design tokens + utility classes
├── api/
│   ├── client.ts         — Axios base instance + interceptors
│   ├── auth.ts           — register(), login(), getMe()
│   ├── menu.ts           — getMenuItems(), getCategories()
│   ├── orders.ts         — getPaymentIntent(), createOrder(), getMyOrders(), getOrderStatus()
│   └── deals.ts          — spinForDeal(), validateCode()
├── store/
│   ├── useAuthStore.ts   — user + JWT, persisted to localStorage key "auth-storage"
│   └── useCartStore.ts   — cart items, deal discount, total()
├── pages/
│   ├── Home.tsx          — landing page
│   ├── Menu.tsx          — menu with category filter + customization modal
│   ├── Deals.tsx         — spin-to-win UI
│   ├── Cart.tsx          — cart management
│   ├── Checkout.tsx      — Stripe payment flow
│   ├── Login.tsx         — login form
│   ├── Register.tsx      — registration form
│   ├── Orders.tsx        — order history + status
│   └── admin/
│       └── AdminDashboard.tsx — live orders, menu CRUD, deal creation (is_admin only)
└── components/
    ├── layout/
    │   └── Navbar.tsx    — top navigation; auth state aware
    ├── menu/
    │   └── MenuCard.tsx  — single menu item card with customization options
    ├── cart/
    │   └── CartSidebar.tsx — slide-in cart panel
    └── deals/
        └── SpinWheel.tsx — animated spin wheel component
```

## Zustand Stores

### useAuthStore (`store/useAuthStore.ts`)
```typescript
{
  user: User | null,
  token: string | null,
  setAuth: (user, token) => void,
  logout: () => void
}
```
- Persisted to localStorage under key `"auth-storage"`
- `logout()` clears both user and token, redirects to `/login`

### useCartStore (`store/useCartStore.ts`)
```typescript
{
  items: CartItem[],               // {menuItem, quantity, customizations}
  dealCode: string | null,
  dealDiscount: number,            // in cents
  addItem: (item, customizations) => void,
  removeItem: (itemId) => void,
  updateQuantity: (itemId, qty) => void,
  applyDeal: (code, discount) => void,
  clearDeal: () => void,
  clearCart: () => void,
  total: () => number              // subtotal minus discount, in cents
}
```
- Persisted to localStorage under key `"cart-storage"`

## Axios Client (`api/client.ts`)

```typescript
const client = axios.create({ baseURL: '/api' })

// Request: inject JWT
client.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: 401 → redirect to /login
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) window.location.href = '/login'
    return Promise.reject(err)
  }
)
```

## Vite Config (`vite.config.ts`)

Dev server runs on port 5173. The `/api` proxy:
```typescript
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:8000', changeOrigin: true }
  }
}
```

## CSS Design Tokens (`index.css`)

All UI must use these variables:

```css
/* Browns (coffee theme) */
--brown-900: #3b1a0a;
--brown-700: #6b3a1f;
--brown-500: #a0522d;
--brown-300: #d2956a;
--brown-100: #f5e6d8;

/* Accents */
--green-matcha: #4a7c59;
--cream: #faf6f0;
--cream-dark: #f0e8dc;

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0,0,0,.08);
--shadow-md: 0 4px 12px rgba(0,0,0,.12);
--shadow-lg: 0 8px 24px rgba(0,0,0,.16);

/* Radii */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 16px;
--radius-full: 9999px;
```

Global utility classes: `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.card`, `.badge-*`, `.container` (max-width 1200px)
