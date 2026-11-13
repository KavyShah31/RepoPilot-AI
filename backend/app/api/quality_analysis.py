
from fastapi import APIRouter

from backend.app.schemas.quality_analysis import (
    QualityAnalyzeRequest,
    QualityAnalysisResponse,
)

from backend.app.services.quality_service import (
    get_repository_quality_analysis,
)

from backend.app.services.history_service import save_analysis


router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["Quality Analysis"],
)


@router.post(
    "/quality-analysis",
    response_model=QualityAnalysisResponse,
)
async def analyze_repository_quality(request: QualityAnalyzeRequest):
    result = await get_repository_quality_analysis(
        repo_url=request.repo_url,
        max_files=request.max_files,
    )

    save_analysis(
        analysis_type="Code Quality",
        repo_url=request.repo_url,
        result=result,
    )

    return result
