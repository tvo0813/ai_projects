def test_register(client):
    resp = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "password123",
        "full_name": "New User",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "pass123", "full_name": "Dup"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400


def test_login(client):
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "pass123",
        "full_name": "Login User",
    })
    resp = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "pass123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "wrongpass@example.com",
        "password": "correct",
        "full_name": "User",
    })
    resp = client.post("/api/auth/login", json={
        "email": "wrongpass@example.com",
        "password": "wrong",
    })
    assert resp.status_code == 401


def test_get_me(auth_client):
    resp = auth_client.get("/api/users/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"
