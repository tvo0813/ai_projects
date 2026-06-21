# API Endpoints — Full Reference

All endpoints prefixed with `/api`. JWT required unless marked Public.

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account; returns `Token + UserOut` |
| POST | `/auth/login` | Public | Login; returns `Token + UserOut` |

## Menu — `/api/menu`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/menu/` | Public | List all items; optional `?category=` filter |
| GET | `/menu/categories` | Public | List distinct categories |
| GET | `/menu/{item_id}` | Public | Get single item |
| POST | `/menu/` | Admin | Create item |
| PUT | `/menu/{item_id}` | Admin | Update item |
| DELETE | `/menu/{item_id}` | Admin | Delete item |

## Deals — `/api/deals`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/deals/public` | Public | Active deals from `deals.csv` — no auth |
| POST | `/deals/spin` | User | Spin the wheel; returns `SpinResult` |
| GET | `/deals/validate/{code}` | User | Validate a deal code |
| GET | `/deals/` | Admin | List all DB deals |
| POST | `/deals/` | Admin | Create deal |
| PATCH | `/deals/{id}/toggle` | Admin | Toggle deal active/inactive |

### SpinResult
```json
{ "won": true, "deal_code": "BREW-A1B2C", "message": "You won 20% off!",
  "discount_type": "percentage", "discount_value": 20.0 }
```

### PublicDealOut (from deals.csv)
```json
{ "title": "Happy Hour", "description": "15% off all iced drinks",
  "discount_type": "percentage", "discount_value": 15.0,
  "label": "15% OFF", "expires_at": null, "badge": "green" }
```

## Locations — `/api/locations`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/locations/` | Public | Store locations with Maps URLs |

### LocationOut
```json
{
  "name": "Phin and Beans",
  "address": "5000 Long Beach Blvd", "city": "Long Beach", "state": "CA",
  "zip": "90805", "country": "US",
  "hours": "Mon–Fri 7am–6pm · Sat–Sun 8am–5pm",
  "phone": "+1(111)111-1111",
  "full_address": "5000 Long Beach Blvd, Long Beach, CA 90805, US",
  "maps_embed_url_keyed": "https://www.google.com/maps/embed/v1/place?key=...&q=...",
  "maps_embed_url_legacy": "https://maps.google.com/maps?q=...&output=embed",
  "maps_link_url": "https://www.google.com/maps/search/?api=1&query=..."
}
```

Frontend tries `maps_embed_url_keyed` first; falls back to `maps_embed_url_legacy` via iframe `onError`.

## Orders — `/api/orders`

> Backend implemented but not surfaced in the public UI. Re-enablement planned.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders/payment-intent` | User | Calc total, apply deal, create Stripe intent |
| POST | `/orders/` | User | Place order + Square POS sync |
| GET | `/orders/my` | User | Order history |
| GET | `/orders/` | Admin | All orders |
| GET | `/orders/{id}` | User | Single order |
| PATCH | `/orders/{id}/status` | Admin | Update status (state machine enforced) |
| POST | `/orders/webhook/stripe` | Public | Stripe webhook handler |

## Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | User | Current user profile |
| GET | `/users/` | Admin | List all users |
| POST | `/users/{id}/make-admin` | Admin | Promote user to admin |

## Health + Static

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | `{"status": "ok", "service": "<STORE_NAME> API"}` |
| GET | `/static/images/{filename}` | Local menu item images (FastAPI StaticFiles) |
