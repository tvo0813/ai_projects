from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..schemas.menu import MenuItem, MenuItemCreate, MenuItemUpdate
from ..utils.auth import get_admin_user
from ..config import settings
from ..services.menu_loader import load_menu_from_csv

router = APIRouter(prefix="/api/menu", tags=["menu"])

# Loaded at startup: tries S3 first (if MENU_S3_BUCKET is set), falls back to local CSV.
_menu_db: dict = load_menu_from_csv(
    settings.STORE_SLUG,
    s3_bucket=settings.MENU_S3_BUCKET,
    aws_region=settings.AWS_REGION,
)


@router.get("/", response_model=List[MenuItem])
def list_menu(category: Optional[str] = None):
    items = list(_menu_db.values())
    if category:
        items = [i for i in items if i.category == category]
    return items


@router.get("/categories")
def list_categories():
    return {"categories": sorted({item.category for item in _menu_db.values()})}


@router.get("/{item_id}", response_model=MenuItem)
def get_item(item_id: str):
    item = _menu_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=MenuItem)
def create_item(data: MenuItemCreate, _: None = Depends(get_admin_user)):
    item_id = data.item_id or str(uuid4())
    item = MenuItem(
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
    _menu_db[item_id] = item
    return item


@router.put("/{item_id}", response_model=MenuItem)
def update_item(item_id: str, data: MenuItemUpdate, _: None = Depends(get_admin_user)):
    item = _menu_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    updated = item.model_copy(update={k: v for k, v in data.model_dump().items() if v is not None})
    _menu_db[item_id] = updated
    return updated


@router.delete("/{item_id}")
def delete_item(item_id: str, _: None = Depends(get_admin_user)):
    if item_id not in _menu_db:
        raise HTTPException(status_code=404, detail="Item not found")
    del _menu_db[item_id]
    return {"message": "Item deleted"}
