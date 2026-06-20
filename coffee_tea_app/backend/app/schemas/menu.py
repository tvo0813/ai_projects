from pydantic import BaseModel
from typing import Optional, Dict, List, Any


class MenuItemCreate(BaseModel):
    item_id: Optional[str] = None
    name: str
    category: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool = True
    config_json: Optional[Dict[str, List[str]]] = None
    tags: Optional[List[str]] = None


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    config_json: Optional[Dict[str, List[str]]] = None
    tags: Optional[List[str]] = None


class MenuItem(BaseModel):
    item_id: str
    name: str
    category: str
    description: Optional[str]
    price: float
    image_url: Optional[str]
    is_available: bool
    config_json: Optional[Dict[str, List[str]]]
    tags: Optional[List[str]]
