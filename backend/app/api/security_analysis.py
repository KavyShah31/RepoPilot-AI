
from fastapi import APIRouter

from backend.app.schemas.security_analysis import (
    SecurityAnalyzeRequest,
    SecurityAnalysisResponse,
)

from backend.app.services.security_service import (
    get_repository_security_analysis,
)

from backend.app.services.history_service import save_analysis


router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["Security Analysis"],
)


@router.post(
    "/security-analysis",
    response_model=SecurityAnalysisResponse,
)
async def analyze_repository_security(request: SecurityAnalyzeRequest):
    result = await get_repository_security_analysis(
        repo_url=request.repo_url,
        max_files=request.max_files,
    )

    save_analysis(
        analysis_type="Security Analysis",
        repo_url=request.repo_url,
        result=result,
    )

    return result
