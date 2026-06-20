import httpx
from typing import Optional
from ..config import settings

SQUARE_API_BASE = "https://connect.squareup.com/v2"


async def push_order_to_pos(order_data: dict) -> Optional[str]:
    if not settings.SQUARE_ACCESS_TOKEN:
        return None
    headers = {
        "Authorization": f"Bearer {settings.SQUARE_ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
    }
    line_items = [
        {
            "name": item["item_name"],
            "quantity": str(item["quantity"]),
            "base_price_money": {
                "amount": int(item["unit_price"] * 100),
                "currency": "USD",
            },
        }
        for item in order_data.get("items", [])
    ]
    payload = {
        "idempotency_key": f"{settings.STORE_NAME.lower().replace(' ', '-')}-{order_data['order_id']}",
        "order": {
            "location_id": settings.SQUARE_LOCATION_ID,
            "line_items": line_items,
            "reference_id": str(order_data["order_id"]),
        },
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{SQUARE_API_BASE}/orders", headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()["order"]["id"]
    return None
