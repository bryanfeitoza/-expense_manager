def test_create_transaction(auth_client):
    response = auth_client.post(
        "/api/transactions/",
        json={
            "type": "despesa",
            "amount": 150.50,
            "description": "Supermercado",
            "is_recurring": False,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["transaction"]["amount"] == 150.50
    assert data["transaction"]["type"] == "despesa"


def test_list_transactions(auth_client):
    auth_client.post(
        "/api/transactions/",
        json={"type": "despesa", "amount": 50.0, "description": "Teste"},
    )

    response = auth_client.get("/api/transactions/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["transactions"]) == 1


def test_list_transactions_empty(auth_client):
    response = auth_client.get("/api/transactions/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["transactions"] == []


def test_get_transaction(auth_client):
    create_resp = auth_client.post(
        "/api/transactions/",
        json={"type": "receita", "amount": 5000.0, "description": "Salário"},
    )
    txn_id = create_resp.json()["transaction"]["id"]

    response = auth_client.get(f"/api/transactions/{txn_id}")
    assert response.status_code == 200
    assert response.json()["transaction"]["amount"] == 5000.0


def test_get_transaction_not_found(auth_client):
    response = auth_client.get("/api/transactions/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_update_transaction(auth_client):
    create_resp = auth_client.post(
        "/api/transactions/",
        json={"type": "despesa", "amount": 100.0, "description": "Original"},
    )
    txn_id = create_resp.json()["transaction"]["id"]

    response = auth_client.put(
        f"/api/transactions/{txn_id}",
        json={"amount": 200.0, "description": "Updated"},
    )
    assert response.status_code == 200
    assert response.json()["transaction"]["amount"] == 200.0
    assert response.json()["transaction"]["description"] == "Updated"


def test_delete_transaction(auth_client):
    create_resp = auth_client.post(
        "/api/transactions/",
        json={"type": "despesa", "amount": 75.0, "description": "Para deletar"},
    )
    txn_id = create_resp.json()["transaction"]["id"]

    response = auth_client.delete(f"/api/transactions/{txn_id}")
    assert response.status_code == 200

    get_response = auth_client.get(f"/api/transactions/{txn_id}")
    assert get_response.status_code == 404


def test_filter_transactions_by_type(auth_client):
    auth_client.post("/api/transactions/", json={"type": "receita", "amount": 1000.0})
    auth_client.post("/api/transactions/", json={"type": "despesa", "amount": 200.0})

    response = auth_client.get("/api/transactions/?type=receita")
    data = response.json()
    assert data["total"] == 1
    assert data["transactions"][0]["type"] == "receita"
