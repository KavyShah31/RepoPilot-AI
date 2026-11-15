
from backend.app.services import trend_service


def test_get_score():
    assert trend_service.get_score(
        {"quality_score": 85},
        "quality_score",
    ) == 85

    assert trend_service.get_score(
        {"quality_score": 150},
        "quality_score",
    ) == 100

    assert trend_service.get_score(
        {"quality_score": "invalid"},
        "quality_score",
    ) is None


def test_get_trend_direction():
    assert trend_service.get_trend_direction(10) == "Improving"
    assert trend_service.get_trend_direction(-10) == "Declining"
    assert trend_service.get_trend_direction(0) == "Stable"
    assert (
        trend_service.get_trend_direction(None)
        == "Insufficient Data"
    )


def test_build_repository_trends_without_history(monkeypatch):
    monkeypatch.setattr(
        trend_service,
        "get_repository_scan_history",
        lambda repo_url, limit: [],
    )

    result = trend_service.build_repository_trends(
        "https://github.com/test/repo"
    )

    assert result["total_scans"] == 0
    assert result["trend_status"] == "No History Available"
    assert result["latest"] is None
    assert result["timeline"] == []


def test_build_repository_trends(monkeypatch):
    history = [
        {
            "id": 1,
            "analysis_type": "quality",
            "created_at": "2026-11-13T10:00:00",
            "result": {
                "quality_score": 80,
                "total_findings": 4,
            },
        },
        {
            "id": 2,
            "analysis_type": "security",
            "created_at": "2026-11-14T10:00:00",
            "result": {
                "security_score": 60,
                "total_findings": 3,
            },
        },
        {
            "id": 3,
            "analysis_type": "quality",
            "created_at": "2026-11-15T10:00:00",
            "result": {
                "quality_score": 90,
                "total_findings": 2,
            },
        },
    ]

    monkeypatch.setattr(
        trend_service,
        "get_repository_scan_history",
        lambda repo_url, limit: history,
    )

    result = trend_service.build_repository_trends(
        "https://github.com/test/repo"
    )

    assert result["total_scans"] == 3
    assert result["trend_status"] == "Declining"

    assert result["latest"]["quality_score"] == 90
    assert result["latest"]["security_score"] == 60
    assert result["latest"]["health_score"] == 75

    assert result["changes"]["health_change"] == -5
    assert result["changes"]["quality_change"] == 10
    assert result["changes"]["security_change"] is None

    assert len(result["timeline"]) == 3
    assert result["message"] == (
        "Historical trends calculated successfully."
    )
