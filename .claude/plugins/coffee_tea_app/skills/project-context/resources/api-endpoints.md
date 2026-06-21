# API Endpoints — Full Reference

All endpoints prefixed with `/api`. No auth required on any active endpoint.

## Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | `{"status": "ok", "service": "<STORE_NAME> API"}` |

## Menu — `/api/menu`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/menu/` | Public | List all items; optional `?category=` filter |
| GET | `/menu/categories` | Public | List distinct categories |
| GET | `/menu/{item_id}` | Public | Get single item |

## Deals — `/api/deals`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/deals/public` | Public | Active deals from `deals.csv` |

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

## Chat — `/api/chat`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/chat/` | Public | Menu chatbot powered by Ollama |

### Request
```json
{ "messages": [{"role": "user", "content": "What iced drinks do you have?"}] }
```

### Response
```json
{ "message": "Here are some great iced options: Brown Sugar Milk Tea — $6.50, ..." }
```

## Static

| Method | Path | Description |
|---|---|---|
| GET | `/static/images/{filename}` | Local menu item images (FastAPI StaticFiles) |

---

## Disabled Endpoints (not registered)

The following are implemented in the codebase but not active. Re-enable by adding them to `main.py` and provisioning RDS.

- `POST /api/auth/register` — create account
- `POST /api/auth/login` — login, returns JWT
- `GET/POST /api/orders/*` — order placement + Stripe payment
- `GET /api/users/me` — current user profile
- `POST /api/deals/spin` — spin the deals wheel
- `POST/PUT/DELETE /api/menu/` — admin menu CRUD
