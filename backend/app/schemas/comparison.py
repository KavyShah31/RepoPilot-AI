
from pydantic import BaseModel, Field, HttpUrl


class RepositoryComparisonRequest(BaseModel):
    repo_url_1: HttpUrl = Field(
        description="First public GitHub repository URL"
    )
    repo_url_2: HttpUrl = Field(
        description="Second public GitHub repository URL"
    )


class RepositoryMetrics(BaseModel):
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


class RepositoryComparisonResponse(BaseModel):
    repository_1: RepositoryMetrics
    repository_2: RepositoryMetrics
    comparison: dict
