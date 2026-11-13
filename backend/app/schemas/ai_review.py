
from typing import Literal

from pydantic import BaseModel, Field


class AIReviewRequest(BaseModel):
    repo_url: str = Field(
        min_length=10,
        max_length=500,
        description="Public GitHub repository URL",
    )

    max_files: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum Python files to review",
    )


class ReviewFinding(BaseModel):
    issue_type: str
    severity: Literal["critical", "high", "medium", "low"]
    line: int = Field(ge=1)
    title: str
    description: str
    recommendation: str
    suggested_fix: str = ""


class FileReview(BaseModel):
    file_path: str
    summary: str
    findings: list[ReviewFinding]


class AIReviewResponse(BaseModel):
    repository: str
    branch: str
    discovered_files: int
    reviewed_files: int
    skipped_files: int
    total_issues: int
    critical_issues: int
    high_issues: int
    medium_issues: int
    low_issues: int
    summary: str
    reviews: list[FileReview]
    warnings: list[str]
