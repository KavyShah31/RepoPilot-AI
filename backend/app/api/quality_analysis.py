
from fastapi import APIRouter

from backend.app.schemas.quality_analysis import (
    QualityAnalyzeRequest,
    QualityAnalysisResponse,
)

from backend.app.services.quality_service import (
    get_repository_quality_analysis,
)


router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["Quality Analysis"],
)


@router.post(
    "/quality-analysis",
    response_model=QualityAnalysisResponse,
)
async def analyze_repository_quality(
    request: QualityAnalyzeRequest,
):
    return await get_repository_quality_analysis(
        repo_url=request.repo_url,
        max_files=request.max_files,
    )
