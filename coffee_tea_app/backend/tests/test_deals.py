def test_spin_requires_auth(client):
    resp = client.post("/api/deals/spin")
    assert resp.status_code == 401


def test_spin_authenticated(auth_client):
    resp = auth_client.post("/api/deals/spin")
    # No deals seeded → returns a loss result, not a 500
    assert resp.status_code == 200
    data = resp.json()
    assert "won" in data


def test_validate_invalid_code(client):
    resp = client.get("/api/deals/validate/INVALID-CODE")
    assert resp.status_code in (200, 404)


def test_create_deal_requires_admin(auth_client):
    resp = auth_client.post("/api/deals/", json={
        "code": "TEST20",
        "deal_type": "spin_to_win",
        "title": "20% Off",
        "discount_type": "percentage",
        "discount_value": 20.0,
        "win_probability": 0.5,
    })
    assert resp.status_code == 403
