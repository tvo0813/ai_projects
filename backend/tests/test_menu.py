def test_list_menu(client):
    resp = client.get("/api/menu/")
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    assert len(items) > 0


def test_list_menu_filter_by_category(client):
    resp = client.get("/api/menu/?category=espresso")
    assert resp.status_code == 200
    items = resp.json()
    assert all(i["category"] == "espresso" for i in items)


def test_list_categories(client):
    resp = client.get("/api/menu/categories")
    assert resp.status_code == 200
    assert "categories" in resp.json()
    assert isinstance(resp.json()["categories"], list)


def test_get_item(client):
    items = client.get("/api/menu/").json()
    item_id = items[0]["item_id"]
    resp = client.get(f"/api/menu/{item_id}")
    assert resp.status_code == 200
    assert resp.json()["item_id"] == item_id


def test_get_item_not_found(client):
    resp = client.get("/api/menu/nonexistent-id")
    assert resp.status_code == 404


def test_create_item_requires_admin(auth_client):
    resp = auth_client.post("/api/menu/", json={
        "name": "Test Item",
        "category": "test",
        "price": 5.0,
    })
    assert resp.status_code == 403
