
SEVERITY_POINTS = {
    "critical": 25,
    "high": 15,
    "medium": 7,
    "low": 3,
}

GRADE_THRESHOLDS = {
    "A": 90,
    "B": 80,
    "C": 70,
    "D": 60,
    "F": 0,
}


def normalize_score(value):
    """Convert a score to a valid number between 0 and 100."""
    if value is None:
        return None

    try:
        score = float(value)
    except (TypeError, ValueError):
        return None

    return round(max(0, min(100, score)), 2)


def calculate_health_score(quality_score, security_score):
    """
    Calculate repository health using equal weights:
    50% code quality and 50% security.
    """
    available_scores = [
        score
        for score in [quality_score, security_score]
        if score is not None
    ]

    if not available_scores:
        return None

    return round(
        sum(available_scores) / len(available_scores),
        2,
    )


def get_health_grade(health_score):
    """Convert the health score into a letter grade."""
    if health_score is None:
        return "N/A"

    for grade, threshold in GRADE_THRESHOLDS.items():
        if health_score >= threshold:
            return grade

    return "F"


def calculate_risk(findings):
    """Calculate repository risk from quality and security findings."""
    risk_points = sum(
        SEVERITY_POINTS.get(
            str(finding.get("severity", "low")).lower(),
            0,
        )
        for finding in findings
    )

    risk_score = min(100, risk_points)

    if risk_score >= 75:
        risk_level = "Critical"
    elif risk_score >= 50:
        risk_level = "High"
    elif risk_score >= 25:
        risk_level = "Medium"
    elif risk_score > 0:
        risk_level = "Low"
    else:
        risk_level = "Healthy"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_points": risk_points,
    }


def calculate_issue_summary(findings):
    """Count findings by severity."""
    summary = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "total": len(findings),
    }

    for finding in findings:
        severity = str(
            finding.get("severity", "low")
        ).lower()

        if severity in summary and severity != "total":
            summary[severity] += 1

    return summary


def build_repository_health(quality_result, security_result):
    """
    Build an overall repository health report from
    existing quality and security analysis results.
    """

    quality_score = normalize_score(
        quality_result.get("quality_score")
    )

    security_score = normalize_score(
        security_result.get("security_score")
    )

    health_score = calculate_health_score(
        quality_score,
        security_score,
    )

    health_grade = get_health_grade(health_score)

    quality_findings = quality_result.get("findings", [])
    security_findings = security_result.get("findings", [])

    all_findings = quality_findings + security_findings

    issue_summary = calculate_issue_summary(all_findings)
    risk = calculate_risk(all_findings)

    if health_score is None:
        health_status = "Insufficient Analysis Data"
    elif health_score >= 90:
        health_status = "Excellent"
    elif health_score >= 80:
        health_status = "Good"
    elif health_score >= 70:
        health_status = "Moderate"
    elif health_score >= 60:
        health_status = "Needs Improvement"
    else:
        health_status = "Poor"

    warnings = (
        quality_result.get("warnings", [])
        + security_result.get("warnings", [])
    )

    return {
        "repository": quality_result.get(
            "repository",
            security_result.get("repository"),
        ),
        "health_score": health_score,
        "health_grade": health_grade,
        "health_status": health_status,
        "quality_score": quality_score,
        "security_score": security_score,
        "risk": risk,
        "issue_summary": issue_summary,
        "total_findings": len(all_findings),
        "quality_findings": len(quality_findings),
        "security_findings": len(security_findings),
        "warnings": warnings,
    }
