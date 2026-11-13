
import base64

import pytest
from fastapi import HTTPException

from backend.app.services.ai_review_service import (
    parse_github_url,
    decode_github_blob,
    validate_ai_review,
)


def test_parse_valid_github_url():
    owner, repo = parse_github_url(
        "https://github.com/psf/requests"
    )

    assert owner == "psf"
    assert repo == "requests"


def test_parse_github_url_with_git_suffix():
    owner, repo = parse_github_url(
        "https://github.com/psf/requests.git"
    )

    assert owner == "psf"
    assert repo == "requests"


def test_reject_non_github_url():
    with pytest.raises(HTTPException):
        parse_github_url(
            "https://example.com/owner/repo"
        )


def test_reject_invalid_github_url():
    with pytest.raises(HTTPException):
        parse_github_url(
            "https://github.com/"
        )


def test_decode_github_blob():
    source = 'print("Hello RepoPilot")'

    encoded = base64.b64encode(
        source.encode("utf-8")
    ).decode("utf-8")

    blob = {
        "encoding": "base64",
        "content": encoded,
    }

    assert decode_github_blob(blob) == source


def test_reject_invalid_blob_encoding():
    blob = {
        "encoding": "utf-8",
        "content": "print('Hello')",
    }

    assert decode_github_blob(blob) is None


def test_validate_ai_review():
    data = {
        "summary": "Potential issue detected.",
        "findings": [
            {
                "issue_type": "bug",
                "severity": "high",
                "line": 2,
                "title": "Unsafe operation",
                "description": "This operation may fail.",
                "recommendation": "Validate the input.",
                "suggested_fix": "Add input validation.",
            }
        ],
    }

    result = validate_ai_review(
        data,
        "sample.py",
        5,
    )

    assert result.file_path == "sample.py"
    assert len(result.findings) == 1
    assert result.findings[0].severity == "high"


def test_reject_invalid_severity():
    data = {
        "summary": "Test",
        "findings": [
            {
                "issue_type": "bug",
                "severity": "extreme",
                "line": 1,
                "title": "Problem",
                "description": "Description",
                "recommendation": "Fix it",
                "suggested_fix": "",
            }
        ],
    }

    with pytest.raises(ValueError):
        validate_ai_review(
            data,
            "sample.py",
            5,
        )


def test_ignore_findings_outside_file_line_range():
    data = {
        "summary": "Test",
        "findings": [
            {
                "issue_type": "bug",
                "severity": "medium",
                "line": 100,
                "title": "Invalid line",
                "description": "Outside file.",
                "recommendation": "Check the line.",
                "suggested_fix": "",
            }
        ],
    }

    result = validate_ai_review(
        data,
        "sample.py",
        5,
    )

    assert len(result.findings) == 0
