def test_list_menu(client):
    resp = client.get("/api/menu/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_menu_filter_by_category(client):
    resp = client.get("/api/menu/?category=signature")
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)


def test_list_categories(client):
    resp = client.get("/api/menu/categories")
    assert resp.status_code == 200
    assert "categories" in resp.json()
    assert isinstance(resp.json()["categories"], list)


def test_get_item(client):
    items = client.get("/api/menu/").json()
    if not items:
        return
    item_id = items[0]["item_id"]
    resp = client.get(f"/api/menu/{item_id}")
    assert resp.status_code == 200
    assert resp.json()["item_id"] == item_id


def test_get_item_not_found(client):
    resp = client.get("/api/menu/nonexistent-id")
    assert resp.status_code == 404
