# API Endpoints — Full Reference

All endpoints are prefixed with `/api`. JWT required unless marked public.

## Auth (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account; returns `Token + UserOut` |
| POST | `/auth/login` | Public | Login; returns `Token + UserOut` |

## Menu (`/api/menu`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/menu/` | Public | List all menu items; optional `?category=` filter |
| GET | `/menu/categories` | Public | List distinct categories |
| GET | `/menu/{item_id}` | Public | Get single menu item |
| POST | `/menu/` | Admin | Create menu item |
| PUT | `/menu/{item_id}` | Admin | Update menu item |
| DELETE | `/menu/{item_id}` | Admin | Delete menu item |

## Orders (`/api/orders`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders/payment-intent` | User | Calc subtotal, apply deal, create Stripe payment intent; returns `{client_secret, payment_intent_id}` |
| POST | `/orders/` | User | Place order; creates DB record + Square POS sync; returns `OrderOut` |
| GET | `/orders/my` | User | Current user's order history |
| GET | `/orders/` | Admin | List all orders |
| GET | `/orders/{order_id}` | User | Get single order (own orders only; admin sees all) |
| PATCH | `/orders/{order_id}/status` | Admin | Update order status; validates state machine |
| POST | `/orders/webhook/stripe` | Public (Stripe sig) | Stripe webhook; handles `payment.intent.succeeded` |

### Payment Intent Request Body
```json
{
  "items": [{"item_id": "...", "quantity": 2, "unit_price": 5.50}],
  "deal_code": "BREW-XXXXX"
}
```

### Create Order Request Body
```json
{
  "items": [{"item_id": "...", "item_name": "...", "quantity": 1, "unit_price": 5.50, "customizations": {}}],
  "customer_name": "...",
  "customer_email": "...",
  "special_instructions": "...",
  "deal_code": "BREW-XXXXX",
  "stripe_payment_id": "pi_..."
}
```

## Deals (`/api/deals`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/deals/spin` | User | Spin the wheel; returns `SpinResult` |
| GET | `/deals/validate/{code}` | User | Validate deal code; returns discount info |
| GET | `/deals/` | Admin | List all deals |
| POST | `/deals/` | Admin | Create new deal |
| PATCH | `/deals/{deal_id}/toggle` | Admin | Toggle deal active/inactive |

### SpinResult Response
```json
{
  "won": true,
  "deal_code": "BREW-A1B2C",
  "message": "You won 20% off!",
  "discount_type": "percentage",
  "discount_value": 20.0
}
```

## Users (`/api/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | User | Get current user profile |
| GET | `/users/` | Admin | List all users |
| POST | `/users/{user_id}/make-admin` | Admin | Promote user to admin |

## Health Check

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{"status": "healthy"}` |
