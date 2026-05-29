def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New User",
            "email": "new@example.com",
            "password": "123456",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["email"] == "new@example.com"


def test_register_duplicate_email(client, test_user):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Another",
            "email": "test@example.com",
            "password": "123456",
        },
    )
    assert response.status_code == 409


def test_login(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "123456",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["email"] == "test@example.com"


def test_login_wrong_password(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrong",
        },
    )
    assert response.status_code == 401


def test_me(client, auth_headers, test_user):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"


def test_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 403


def test_refresh(client, test_user):
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "123456"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]


def test_logout(client, auth_headers, test_user):
    response = client.post("/api/auth/logout", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Logout realizado com sucesso"
