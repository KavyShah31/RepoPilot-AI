
from fastapi import APIRouter

from backend.app.schemas.repository import (
    RepositoryAnalyzeRequest,
    RepositoryAnalysisResponse,
)

from backend.app.services.github_service import (
    get_repository_analysis,
)

from backend.app.services.history_service import save_analysis


router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["Repositories"],
)


@router.post(
    "/analyze",
    response_model=RepositoryAnalysisResponse,
)
async def analyze_repository(request: RepositoryAnalyzeRequest):
    result = await get_repository_analysis(request.repo_url)

    save_analysis(
        analysis_type="Repository Analysis",
        repo_url=request.repo_url,
        result=result,
    )

    return result
