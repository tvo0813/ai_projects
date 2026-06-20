from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..schemas.menu import MenuItem, MenuItemCreate, MenuItemUpdate
from ..utils.auth import get_admin_user
from ..models.user import User

router = APIRouter(prefix="/api/menu", tags=["menu"])

# In-memory store; replace with menu_service.py DynamoDB calls when ENVIRONMENT != development
_menu_db: dict = {}


def _seed_menu():
    items = [
        MenuItem(item_id=str(uuid4()), name="Espresso", category="espresso", description="Rich single shot of espresso.", price=3.50, image_url="/images/espresso.jpg", is_available=True, config_json={"shots": ["1", "2", "3"]}, tags=["hot", "classic"]),
        MenuItem(item_id=str(uuid4()), name="Cappuccino", category="espresso", description="Espresso with steamed milk foam.", price=5.00, image_url="/images/cappuccino.jpg", is_available=True, config_json={"milk": ["Whole", "Oat", "Almond"], "size": ["12oz", "16oz"]}, tags=["hot", "popular"]),
        MenuItem(item_id=str(uuid4()), name="Matcha Latte", category="matcha", description="Ceremonial grade matcha with steamed milk.", price=5.50, image_url="/images/matcha.jpg", is_available=True, config_json={"milk": ["Whole", "Oat", "Coconut"], "size": ["12oz", "16oz"], "sweetness": ["None", "Half", "Full"]}, tags=["hot", "iced", "popular"]),
        MenuItem(item_id=str(uuid4()), name="Cold Brew", category="cold", description="12-hour cold steeped smooth coffee.", price=5.00, image_url="/images/coldbrew.jpg", is_available=True, config_json={"size": ["12oz", "16oz", "24oz"]}, tags=["iced", "popular"]),
        MenuItem(item_id=str(uuid4()), name="Chai Latte", category="tea", description="Spiced masala chai with steamed milk.", price=5.00, image_url="/images/chai.jpg", is_available=True, config_json={"milk": ["Whole", "Oat", "Almond"], "size": ["12oz", "16oz"]}, tags=["hot", "spiced"]),
        MenuItem(item_id=str(uuid4()), name="Croissant", category="pastry", description="Buttery, flaky French croissant.", price=4.00, image_url="/images/croissant.jpg", is_available=True, config_json={}, tags=["food", "popular"]),
        MenuItem(item_id=str(uuid4()), name="Avocado Toast", category="food", description="Smashed avo on sourdough with chili flakes.", price=9.50, image_url="/images/avocado.jpg", is_available=True, config_json={}, tags=["food", "brunch"]),
        MenuItem(item_id=str(uuid4()), name="Iced Americano", category="cold", description="Double espresso over ice with water.", price=4.50, image_url="/images/americano.jpg", is_available=True, config_json={"shots": ["2", "3"], "size": ["12oz", "16oz", "24oz"]}, tags=["iced"]),
    ]
    for item in items:
        _menu_db[item.item_id] = item


_seed_menu()


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
def create_item(data: MenuItemCreate, admin: User = Depends(get_admin_user)):
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
def update_item(item_id: str, data: MenuItemUpdate, admin: User = Depends(get_admin_user)):
    item = _menu_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    updated = item.model_copy(update={k: v for k, v in data.model_dump().items() if v is not None})
    _menu_db[item_id] = updated
    return updated


@router.delete("/{item_id}")
def delete_item(item_id: str, admin: User = Depends(get_admin_user)):
    if item_id not in _menu_db:
        raise HTTPException(status_code=404, detail="Item not found")
    del _menu_db[item_id]
    return {"message": "Item deleted"}
