
from pydantic import BaseModel, Field


class RepositoryAnalyzeRequest(BaseModel):
    repo_url: str = Field(
        min_length=10,
        max_length=500,
        description="Public GitHub repository URL"
    )


class RepositoryFile(BaseModel):
    name: str
    path: str
    type: str
    size: int | None = None
    html_url: str | None = None


class RepositoryAnalysisResponse(BaseModel):
    full_name: str
    description: str | None = None
    html_url: str
    default_branch: str
    stars: int
    forks: int
    open_issues: int
    primary_language: str | None = None
    languages: dict[str, int]
    total_root_items: int
    files: list[RepositoryFile]
