
import pytest

from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.github_service import (
    parse_github_repo_url
)


def test_parse_github_url():
    owner, repo = parse_github_repo_url(
        "https://github.com/tiangolo/fastapi"
    )

    assert owner == "tiangolo"
    assert repo == "fastapi"


def test_parse_github_url_with_git():
    owner, repo = parse_github_repo_url(
        "https://github.com/tiangolo/fastapi.git"
    )

    assert owner == "tiangolo"
    assert repo == "fastapi"


def test_reject_invalid_domain():
    with pytest.raises(HTTPException) as error:
        parse_github_repo_url(
            "https://example.com/owner/repo"
        )

    assert error.value.status_code == 400


def test_reject_invalid_path():
    with pytest.raises(HTTPException) as error:
        parse_github_repo_url(
            "https://github.com/owner/repo/issues"
        )

    assert error.value.status_code == 400


def test_repository_api(monkeypatch):

    async def fake_analysis(repo_url):
        return {
            "full_name": "tiangolo/fastapi",
            "description": "FastAPI framework",
            "html_url": "https://github.com/tiangolo/fastapi",
            "default_branch": "master",
            "stars": 100,
            "forks": 20,
            "open_issues": 10,
            "primary_language": "Python",
            "languages": {"Python": 10000},
            "total_root_items": 2,
            "files": [
                {
                    "name": "README.md",
                    "path": "README.md",
                    "type": "file",
                    "size": 1000,
                    "html_url": "https://github.com/tiangolo/fastapi"
                }
            ]
        }

    monkeypatch.setattr(
        "backend.app.api.repositories.get_repository_analysis",
        fake_analysis
    )

    client = TestClient(app)

    response = client.post(
        "/api/v1/repositories/analyze",
        json={
            "repo_url": "https://github.com/tiangolo/fastapi"
        }
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "tiangolo/fastapi"
    assert response.json()["primary_language"] == "Python"
