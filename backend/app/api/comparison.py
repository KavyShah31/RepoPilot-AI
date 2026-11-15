
from fastapi import APIRouter, HTTPException

from backend.app.schemas.comparison import (
    RepositoryComparisonRequest,
    RepositoryComparisonResponse,
)

from backend.app.services.comparison_service import (
    compare_repositories,
)

router = APIRouter(
    prefix="/api/v1/repositories",
    tags=["Repository Comparison"],
)


@router.post(
    "/compare",
    response_model=RepositoryComparisonResponse,
)
async def compare_repository_data(
    request: RepositoryComparisonRequest,
):
    try:
        if request.repo_url_1 == request.repo_url_2:
            raise HTTPException(
                status_code=400,
                detail="Please provide two different repositories.",
            )

        result = await compare_repositories(
            str(request.repo_url_1),
            str(request.repo_url_2),
        )

        return result

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Repository comparison failed: {str(error)}",
        )
