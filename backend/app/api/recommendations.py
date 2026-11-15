
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from backend.app.services.quality_service import (
    get_repository_quality_analysis,
)
from backend.app.services.security_service import (
    get_repository_security_analysis,
)
from backend.app.services.recommendation_service import (
    build_recommendations,
)


router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["AI Recommendations"],
)


class RecommendationRequest(BaseModel):
    repo_url: HttpUrl = Field(
        description="Public GitHub repository URL"
    )


@router.post("/recommendations")
async def get_repository_recommendations(
    request: RecommendationRequest,
):
    try:
        repo_url = str(request.repo_url)

        # Run existing code-quality analysis.
        quality_result = await get_repository_quality_analysis(
            repo_url=repo_url,
            max_files=15,
        )

        # Run existing security analysis.
        security_result = await get_repository_security_analysis(
            repo_url=repo_url,
            max_files=30,
        )

        # Generate prioritized recommendations.
        recommendation_result = build_recommendations(
            quality_result=quality_result,
            security_result=security_result,
        )

        return {
            "repository_url": repo_url,
            "quality_analysis": quality_result,
            "security_analysis": security_result,
            "recommendation_analysis": recommendation_result,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation analysis failed: {str(error)}",
        )
