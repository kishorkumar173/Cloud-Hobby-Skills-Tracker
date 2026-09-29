def test_register_user_success(client):
    res = client.post("/api/register", json={
        "name": "David Miller",
        "username": "david_m",
        "email": "david@example.com",
        "password": "Password123!",
        "interests": "Chess, Piano"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["username"] == "david_m"

def test_register_duplicate_username(client):
    res = client.post("/api/register", json={
        "name": "Duplicate David",
        "username": "david_m",
        "email": "david_diff@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 400
    assert "already taken" in res.json()["detail"]

def test_login_success(client):
    res = client.post("/api/login", json={
        "username_or_email": "david_m",
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]

def test_login_invalid_password(client):
    res = client.post("/api/login", json={
        "username_or_email": "david_m",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "Invalid username" in res.json()["detail"]

def test_get_me_profile(client, auth_headers):
    res = client.get("/api/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["username"] == "test_learner"
