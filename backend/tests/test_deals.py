def test_list_public_deals(client):
    resp = client.get("/api/deals/public")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_spin_not_found(client):
    resp = client.post("/api/deals/spin")
    assert resp.status_code == 404


def test_validate_invalid_code(client):
    resp = client.get("/api/deals/validate/INVALID-CODE")
    assert resp.status_code in (200, 404)
