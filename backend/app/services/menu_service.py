import uuid
import boto3
from typing import List, Optional
from ..config import settings
from ..schemas.menu import MenuItem, MenuItemCreate, MenuItemUpdate


def _get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_MENU)


def get_all_menu_items(category: Optional[str] = None) -> List[MenuItem]:
    table = _get_table()
    if category:
        response = table.query(
            IndexName="category-index",
            KeyConditionExpression="category = :cat",
            ExpressionAttributeValues={":cat": category},
        )
    else:
        response = table.scan()
    items = response.get("Items", [])
    return [MenuItem(**item) for item in items]


def get_menu_item(item_id: str) -> Optional[MenuItem]:
    table = _get_table()
    response = table.get_item(Key={"item_id": item_id})
    item = response.get("Item")
    return MenuItem(**item) if item else None


def create_menu_item(data: MenuItemCreate) -> MenuItem:
    table = _get_table()
    item_id = data.item_id or str(uuid.uuid4())
    item = {
        "item_id": item_id,
        "name": data.name,
        "category": data.category,
        "description": data.description or "",
        "price": str(data.price),
        "image_url": data.image_url or "",
        "is_available": data.is_available,
        "config_json": data.config_json or {},
        "tags": data.tags or [],
    }
    table.put_item(Item=item)
    return MenuItem(
        item_id=item_id,
        name=data.name,
        category=data.category,
        description=data.description,
        price=data.price,
        image_url=data.image_url,
        is_available=data.is_available,
        config_json=data.config_json,
        tags=data.tags,
    )


def update_menu_item(item_id: str, data: MenuItemUpdate) -> Optional[MenuItem]:
    existing = get_menu_item(item_id)
    if not existing:
        return None
    table = _get_table()
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        return existing
    expression_parts = []
    expression_values = {}
    for key, value in updates.items():
        expression_parts.append(f"{key} = :{key}")
        expression_values[f":{key}"] = str(value) if isinstance(value, float) else value
    table.update_item(
        Key={"item_id": item_id},
        UpdateExpression="SET " + ", ".join(expression_parts),
        ExpressionAttributeValues=expression_values,
    )
    return get_menu_item(item_id)


def delete_menu_item(item_id: str) -> bool:
    existing = get_menu_item(item_id)
    if not existing:
        return False
    table = _get_table()
    table.delete_item(Key={"item_id": item_id})
    return True
