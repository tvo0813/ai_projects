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
│   ├── client.ts              — Axios base instance
│   ├── menu.ts                — getMenuItems(), getCategories(), MenuItem interface
│   ├── deals.ts               — getPublicDeals()
│   ├── chat.ts                — sendChatMessage(messages)
│   └── locations.ts           — getLocations(), Location interface
├── store/
│   └── useCartStore.ts        — cart items + deal discount, persisted to "cart-storage"
├── pages/
│   ├── Home.tsx               — hero, Vietnam origin story, 4 pillars, signature drinks grid, chatbot
│   ├── Menu.tsx               — section-based menu with sticky nav + IntersectionObserver scroll-spy
│   ├── Deals.tsx              — fetches /api/deals/public; deal cards; empty state if none
│   ├── Locations.tsx          — Google Maps embed cards + address/hours/phone
│   ├── Careers.tsx            — static: benefits, 3-step apply process, email CTA
│   └── PrivacyPolicy.tsx      — loads /privacy-policy.txt from public folder
└── components/
    ├── layout/
    │   ├── Navbar.tsx         — Home/Menu/Deals/Locations center; Order (Grab) button right; no auth UI
    │   └── Footer.tsx         — copyright left; Careers + Privacy Policy + social links right
    ├── menu/
    │   └── MenuCard.tsx       — circular image (140px); click opens description modal (Framer Motion)
    ├── deals/
    │   └── SpinWheel.tsx      — animated spin wheel component (visual only — no backend spin endpoint active)
    └── ChatBot.tsx            — menu assistant on Home page; suggestion pills; typing indicator; conversation history
```

## Routes

| Path | Component | Notes |
|---|---|---|
| `/` | Home | Public |
| `/menu` | Menu | Public |
| `/deals` | Deals | Public |
| `/locations` | Locations | Public |
| `/careers` | Careers | Public |
| `/privacy` | PrivacyPolicy | Public |

Login, Register, and AdminDashboard are **not routed** — removed from `App.tsx`.

## Menu Page Details

- Section layout: Signature Drinks, Coffee, Matcha, Latte, Tea, Hot Drinks
- Sticky sub-nav with IntersectionObserver scroll-spy highlighting the active section
- Signature items tagged with their base category appear in both sections
- Grid: `repeat(auto-fill, minmax(160px, 1fr))` — 4–5 cards per row
- **MenuCard:** circular image → click opens AnimatePresence modal with full image, name, price, description, badges

## Zustand Stores

### useCartStore
```typescript
{ items: CartItem[], dealCode: string | null, dealDiscount: number,
  addItem / removeItem / updateQuantity / applyDeal / clearDeal / clearCart,
  total(): number }
```
Persisted to localStorage `"cart-storage"`.

> `useAuthStore` exists in the codebase but is not used by any active route or component.

## Axios Client (`api/client.ts`)

```typescript
const client = axios.create({ baseURL: '/api' })
```

No auth interceptor — all active endpoints are public.

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

Both `/api` and `/static` proxy to the backend in dev.

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
