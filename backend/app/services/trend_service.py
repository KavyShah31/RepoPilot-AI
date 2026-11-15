
from backend.app.services.history_service import (
    get_repository_scan_history,
)
from backend.app.services.health_service import (
    calculate_health_score,
)


def get_score(result, key):
    """Read and validate a score from a saved analysis."""
    value = result.get(key)

    if value is None:
        return None

    try:
        score = float(value)
    except (TypeError, ValueError):
        return None

    return round(max(0, min(100, score)), 2)


def get_trend_direction(change):
    """Describe the direction of a score change."""
    if change is None:
        return "Insufficient Data"

    if change > 0:
        return "Improving"

    if change < 0:
        return "Declining"

    return "Stable"


def build_repository_trends(repo_url, limit=50):
    """
    Build historical health, quality, and security trends
    using previously saved repository scans.
    """
    history = get_repository_scan_history(
        repo_url=repo_url,
        limit=limit,
    )

    if not history:
        return {
            "repository_url": repo_url,
            "total_scans": 0,
            "trend_status": "No History Available",
            "latest": None,
            "changes": None,
            "timeline": [],
            "message": "No saved scans found for this repository.",
        }

    latest_quality = None
    latest_security = None
    timeline = []

    for record in history:
        result = record.get("result", {})
        analysis_type = str(
            record.get("analysis_type", "")
        ).lower()

        # Update only the metric supplied by this scan.
        quality_value = get_score(result, "quality_score")
        security_value = get_score(result, "security_score")

        if quality_value is not None:
            latest_quality = quality_value

        if security_value is not None:
            latest_security = security_value

        # Support older or differently named saved scan types.
        if "quality" in analysis_type:
            if quality_value is not None:
                latest_quality = quality_value

        if "security" in analysis_type:
            if security_value is not None:
                latest_security = security_value

        health_score = calculate_health_score(
            latest_quality,
            latest_security,
        )

        timeline.append({
            "scan_id": record["id"],
            "analysis_type": record["analysis_type"],
            "created_at": record["created_at"],
            "quality_score": latest_quality,
            "security_score": latest_security,
            "health_score": health_score,
            "total_findings": result.get("total_findings"),
        })

    first = timeline[0]
    latest = timeline[-1]

    def calculate_change(old_value, new_value):
        if old_value is None or new_value is None:
            return None

        return round(new_value - old_value, 2)

    health_change = calculate_change(
        first["health_score"],
        latest["health_score"],
    )

    quality_change = calculate_change(
        first["quality_score"],
        latest["quality_score"],
    )

    security_change = calculate_change(
        first["security_score"],
        latest["security_score"],
    )

    return {
        "repository_url": repo_url,
        "total_scans": len(history),
        "trend_status": get_trend_direction(health_change),
        "latest": latest,
        "changes": {
            "health_change": health_change,
            "quality_change": quality_change,
            "security_change": security_change,
        },
        "timeline": timeline,
        "message": "Historical trends calculated successfully.",
    }
