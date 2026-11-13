
from fastapi import APIRouter

from backend.app.schemas.ai_review import (
    AIReviewRequest,
    AIReviewResponse,
)

from backend.app.services.ai_review_service import (
    get_repository_ai_review,
)

from backend.app.services.history_service import save_analysis


router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["AI Code Review"],
)


@router.post(
    "/ai-review",
    response_model=AIReviewResponse,
)
async def review_repository_with_ai(request: AIReviewRequest):
    result = await get_repository_ai_review(
        repo_url=request.repo_url,
        max_files=request.max_files,
    )

    save_analysis(
        analysis_type="AI Code Review",
        repo_url=request.repo_url,
        result=result,
    )

    return result
