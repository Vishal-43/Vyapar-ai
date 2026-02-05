
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json().get("status") == "healthy"

# TODO: Add tests for all API endpoints
# def test_example_endpoint():
#     response = client.get("/api/v1/example")
#     assert response.status_code == 200
#     ...
