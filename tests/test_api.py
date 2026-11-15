
import pytest

from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client):
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["project"] == "RepoPilot AI"
    assert data["status"] == "running"
    assert data["version"] == "0.2.0"


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert "message" in data


def test_openapi_endpoint(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200

    data = response.json()

    assert data["info"]["title"] == "RepoPilot AI API"
    assert data["info"]["version"] == "0.2.0"
    assert "paths" in data


@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/v1/repositories/analyze",
        "/api/v1/repositories/code-analysis",
        "/api/v1/repositories/quality-analysis",
        "/api/v1/repositories/ai-review",
        "/api/v1/repositories/security-analysis",
        "/api/v1/repositories/compare",
        "/api/v1/repositories/recommendations",
        "/api/v1/repositories/health",
        "/api/v1/repositories/health/trends",
        "/api/v1/history/",
        "/api/v1/history/{scan_id}",
    ],
)
def test_api_route_registration(client, endpoint):
    response = client.get("/openapi.json")

    paths = response.json()["paths"]

    assert endpoint in paths


def test_cors_configuration(client):
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200

    assert (
        response.headers.get("access-control-allow-origin")
        == "http://localhost:5173"
    )
