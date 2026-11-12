
from pydantic import BaseModel, Field


class QualityAnalyzeRequest(BaseModel):
    repo_url: str = Field(
        min_length=10,
        max_length=500,
        description="Public GitHub repository URL",
    )
    max_files: int = Field(default=15, ge=1, le=25)


class QualityFinding(BaseModel):
    file: str
    issue_type: str
    severity: str
    line: int
    message: str
    recommendation: str


class QualityAnalysisResponse(BaseModel):
    repository: str
    branch: str
    discovered_files: int
    analyzed_files: int
    skipped_files: int
    quality_score: int
    quality_grade: str
    total_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    findings: list[QualityFinding]
    warnings: list[str]
