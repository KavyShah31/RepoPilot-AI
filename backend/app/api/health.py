
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from backend.app.services.quality_service import (
    get_repository_quality_analysis,
)
from backend.app.services.security_service import (
    get_repository_security_analysis,
)
from backend.app.services.health_service import (
    build_repository_health,
)
from backend.app.services.trend_service import (
    build_repository_trends,
)
from backend.app.services.history_service import save_analysis


router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["Repository Health & Analytics"],
)


class HealthRequest(BaseModel):
    repo_url: HttpUrl = Field(
        description="Public GitHub repository URL"
    )


@router.post("/health")
async def get_repository_health(request: HealthRequest):
    try:
        repo_url = str(request.repo_url)

        quality_result = await get_repository_quality_analysis(
            repo_url=repo_url,
            max_files=15,
        )

        security_result = await get_repository_security_analysis(
            repo_url=repo_url,
            max_files=30,
        )

        health_result = build_repository_health(
            quality_result=quality_result,
            security_result=security_result,
        )

        # Save the combined health report to existing history.
        save_analysis(
            analysis_type="health",
            repo_url=repo_url,
            result=health_result,
        )

        return {
            "repository_url": repo_url,
            "health_analysis": health_result,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Repository health analysis failed: {str(error)}",
        )


@router.post("/health/trends")
async def get_repository_health_trends(request: HealthRequest):
    try:
        repo_url = str(request.repo_url)

        trend_result = build_repository_trends(
            repo_url=repo_url,
            limit=50,
        )

        return {
            "repository_url": repo_url,
            "trend_analysis": trend_result,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Repository trend analysis failed: {str(error)}",
        )
