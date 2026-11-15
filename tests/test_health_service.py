
import pytest

from backend.app.services.health_service import (
    normalize_score,
    calculate_health_score,
    get_health_grade,
    calculate_risk,
    calculate_issue_summary,
    build_repository_health,
)


def test_normalize_score():
    assert normalize_score(85) == 85.0
    assert normalize_score(120) == 100
    assert normalize_score(-10) == 0
    assert normalize_score(None) is None
    assert normalize_score("invalid") is None


def test_calculate_health_score():
    assert calculate_health_score(80, 60) == 70
    assert calculate_health_score(90, None) == 90
    assert calculate_health_score(None, 70) == 70
    assert calculate_health_score(None, None) is None


@pytest.mark.parametrize(
    "score, expected",
    [
        (95, "A"),
        (85, "B"),
        (75, "C"),
        (65, "D"),
        (40, "F"),
        (None, "N/A"),
    ],
)
def test_get_health_grade(score, expected):
    assert get_health_grade(score) == expected


def test_calculate_risk():
    findings = [
        {"severity": "critical"},
        {"severity": "high"},
        {"severity": "medium"},
        {"severity": "low"},
    ]

    result = calculate_risk(findings)

    assert result["risk_points"] == 50
    assert result["risk_score"] == 50
    assert result["risk_level"] == "High"


def test_calculate_issue_summary():
    findings = [
        {"severity": "critical"},
        {"severity": "high"},
        {"severity": "high"},
        {"severity": "medium"},
        {"severity": "low"},
    ]

    result = calculate_issue_summary(findings)

    assert result == {
        "critical": 1,
        "high": 2,
        "medium": 1,
        "low": 1,
        "total": 5,
    }


def test_build_repository_health():
    quality_result = {
        "repository": "test-repo",
        "quality_score": 90,
        "findings": [
            {"severity": "critical"}
        ],
        "warnings": ["Quality warning"],
    }

    security_result = {
        "security_score": 70,
        "findings": [
            {"severity": "medium"}
        ],
        "warnings": ["Security warning"],
    }

    result = build_repository_health(
        quality_result,
        security_result,
    )

    assert result["repository"] == "test-repo"
    assert result["health_score"] == 80
    assert result["health_grade"] == "B"
    assert result["health_status"] == "Good"
    assert result["quality_score"] == 90
    assert result["security_score"] == 70

    assert result["total_findings"] == 2
    assert result["quality_findings"] == 1
    assert result["security_findings"] == 1

    assert result["risk"]["risk_score"] == 32
    assert result["risk"]["risk_level"] == "Medium"

    assert result["warnings"] == [
        "Quality warning",
        "Security warning",
    ]
