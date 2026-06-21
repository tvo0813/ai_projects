# Frontend — Detailed Reference

## Stack

| Package | Version | Purpose |
|---|---|---|
| react + react-dom | 18.3.1 | UI framework |
| react-router-dom | 6.23.1 | Client-side routing |
| axios | 1.7.2 | HTTP client |
| zustand | 4.5.2 | State management |
| framer-motion | 11.2.11 | Animations + modals |
| react-hot-toast | 2.4.1 | Toast notifications |
| typescript | 5.4.5 | Type safety |
| vite | 5.2.13 | Build tool + dev server |

## Directory Structure

```
frontend/src/
├── App.tsx                    — root component, React Router routes
├── main.tsx                   — entry point
├── index.css                  — global design tokens + utility classes
├── config/
│   └── store.ts               — STORE_NAME, STORE_TAGLINE, GRAB_URL (from VITE_ env vars)
├── api/
│   ├── client.ts              — Axios base instance + JWT interceptor + 401 redirect
│   ├── auth.ts                — register(), login(), getMe()
│   ├── menu.ts                — getMenuItems(), getCategories(), MenuItem interface
│   ├── deals.ts               — getPublicDeals(), spinForDeal(), validateCode()
│   └── locations.ts           — getLocations(), Location interface
├── store/
│   ├── useAuthStore.ts        — user + JWT token, persisted to localStorage "auth-storage"
│   └── useCartStore.ts        — cart items + deal discount, persisted to "cart-storage"
├── pages/
│   ├── Home.tsx               — hero, Vietnam origin story, 4 pillars, signature drinks grid
│   ├── Menu.tsx               — section-based menu with sticky nav + IntersectionObserver scroll-spy
│   ├── Deals.tsx              — fetches /api/deals/public; deal cards; empty state if none
│   ├── Locations.tsx          — Google Maps embed cards + address/hours/phone
│   ├── Careers.tsx            — static: benefits, 3-step apply process, email CTA
│   ├── PrivacyPolicy.tsx      — loads /privacy-policy.txt from public folder
│   ├── Login.tsx              — not linked from public nav; navigate to /login directly
│   ├── Register.tsx
│   └── admin/
│       └── AdminDashboard.tsx — menu CRUD, deal management, orders (is_admin only)
└── components/
    ├── layout/
    │   ├── Navbar.tsx         — Home/Menu/Deals center; Locations + Order (Grab) right; admin controls if is_admin
    │   └── Footer.tsx         — copyright left; Careers + Privacy Policy + Instagram/Facebook/TikTok right
    ├── menu/
    │   └── MenuCard.tsx       — circular image (140px); click opens description modal (Framer Motion AnimatePresence)
    └── deals/
        └── SpinWheel.tsx      — animated spin wheel component
```

## Routes

| Path | Component | Auth |
|---|---|---|
| `/` | Home | Public |
| `/menu` | Menu | Public |
| `/deals` | Deals | Public |
| `/locations` | Locations | Public |
| `/careers` | Careers | Public |
| `/privacy` | PrivacyPolicy | Public |
| `/login` | Login | Public (not in nav) |
| `/register` | Register | Public (not in nav) |
| `/admin` | AdminDashboard | `is_admin` only |

## Menu Page Details

- Section layout: Signature Drinks, Coffee, Matcha, Latte, Tea, Hot Drinks
- Sticky sub-nav with IntersectionObserver scroll-spy highlighting the active section
- Signature items tagged with their base category (e.g. `coffee`) appear in both the Signature section AND that base section
- Grid: `repeat(auto-fill, minmax(160px, 1fr))` — 4–5 cards per row
- **MenuCard:** circular image → click opens AnimatePresence modal with full image, name, price, description, badges

## Zustand Stores

### useAuthStore
```typescript
{ user: User | null, token: string | null, setAuth(user, token): void, logout(): void }
```
Persisted to localStorage `"auth-storage"`.

### useCartStore
```typescript
{ items: CartItem[], dealCode: string | null, dealDiscount: number,
  addItem / removeItem / updateQuantity / applyDeal / clearDeal / clearCart,
  total(): number }
```
Persisted to localStorage `"cart-storage"`.

## Axios Client (`api/client.ts`)

```typescript
const client = axios.create({ baseURL: '/api' })

// Inject JWT on every request
client.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → logout + redirect
client.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) { logout(); window.location.href = '/login' }
  return Promise.reject(err)
})
```

## Vite Config

```typescript
server: {
  port: 5173,
  proxy: {
    '/api':    { target: 'http://localhost:8000', changeOrigin: true },
    '/static': { target: 'http://localhost:8000', changeOrigin: true }
  }
}
```

Both `/api` and `/static` proxy to the backend in dev. `/static` is needed for local menu item images.

## CSS Design Tokens

All UI must use these tokens — never hardcode colors.

```css
--green:        #00704A;   /* primary CTA buttons */
--green-dark:   #1E3932;   /* headers, navbar, hero backgrounds */
--green-mid:    #2E6D5E;
--green-hover:  #005F3E;
--green-light:  #D4E9E2;
--green-xlight: #EEF7F2;
--gold:         #CBA258;   /* loyalty / popular badges */
--gold-light:   #F5E7CA;
--cream:        #F2F0EB;   /* page background */
--cream-dark:   #E6E3D9;
--white:        #FFFFFF;   /* card backgrounds */
--border:       #E0DFDB;
--text-primary:   #1E3932;
--text-secondary: #4A4A4A;
--text-muted:     #767676;
```

Utility classes: `.btn`, `.btn-primary`, `.btn-outline`, `.btn-outline-white`, `.btn-ghost`
Badges: `.badge-green`, `.badge-gold`, `.badge-red`, `.badge-gray`
Layout: `.container` (max-width 1200px), `.section-label`, `.card`, `.spinner`
