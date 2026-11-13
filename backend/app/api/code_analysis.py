
from fastapi import APIRouter

from backend.app.schemas.code_analysis import (
    CodeAnalysisRequest,
    CodeAnalysisResponse,
)

from backend.app.services.github_service import (
    get_repository_code_analysis,
)

from backend.app.services.history_service import save_analysis


router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["Code Intelligence"],
)


@router.post(
    "/code-analysis",
    response_model=CodeAnalysisResponse,
)
async def analyze_repository_code(request: CodeAnalysisRequest):
    result = await get_repository_code_analysis(
        repo_url=request.repo_url,
        max_files=request.max_files,
    )

    save_analysis(
        analysis_type="Code Intelligence",
        repo_url=request.repo_url,
        result=result,
    )

    return result
