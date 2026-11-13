
from typing import Literal

from pydantic import BaseModel, Field


class SecurityAnalyzeRequest(BaseModel):
    repo_url: str = Field(
        min_length=10,
        max_length=500,
        description="Public GitHub repository URL",
    )
    max_files: int = Field(
        default=30,
        ge=1,
        le=50,
        description="Maximum source files to scan",
    )


class SecurityFinding(BaseModel):
    file: str
    issue_type: str
    severity: Literal["critical", "high", "medium", "low"]
    line: int = Field(ge=1)
    message: str
    recommendation: str


class SecurityAnalysisResponse(BaseModel):
    repository: str
    branch: str
    discovered_files: int
    scanned_files: int
    skipped_files: int
    security_score: int
    security_grade: str
    total_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    findings: list[SecurityFinding]
    warnings: list[str]
