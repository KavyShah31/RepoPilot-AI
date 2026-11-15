
from fastapi.encoders import jsonable_encoder

from backend.app.services.github_service import get_repository_analysis
from backend.app.services.quality_service import (
    get_repository_quality_analysis,
)
from backend.app.services.security_service import (
    get_repository_security_analysis,
)


def calculate_comparison(repo_1: dict, repo_2: dict) -> dict:
    languages_1 = repo_1.get("languages", {})
    languages_2 = repo_2.get("languages", {})

    all_languages = set(languages_1) | set(languages_2)

    language_comparison = {
        language: {
            "repository_1": languages_1.get(language, 0),
            "repository_2": languages_2.get(language, 0),
        }
        for language in sorted(all_languages)
    }

    return {
        "stars_difference": repo_1["stars"] - repo_2["stars"],
        "forks_difference": repo_1["forks"] - repo_2["forks"],
        "open_issues_difference": (
            repo_1["open_issues"] - repo_2["open_issues"]
        ),
        "root_items_difference": (
            repo_1["total_root_items"] - repo_2["total_root_items"]
        ),
        "language_comparison": language_comparison,
        "more_stars": (
            repo_1["full_name"]
            if repo_1["stars"] > repo_2["stars"]
            else repo_2["full_name"]
            if repo_2["stars"] > repo_1["stars"]
            else "Equal"
        ),
        "more_forks": (
            repo_1["full_name"]
            if repo_1["forks"] > repo_2["forks"]
            else repo_2["full_name"]
            if repo_2["forks"] > repo_1["forks"]
            else "Equal"
        ),
    }


async def run_optional_analysis(analysis_function, repo_url, max_files):
    try:
        result = await analysis_function(
            repo_url=repo_url,
            max_files=max_files,
        )
        return {
            "status": "success",
            "result": jsonable_encoder(result),
        }
    except Exception as error:
        return {
            "status": "failed",
            "error": str(error),
        }


async def compare_repositories(repo_url_1: str, repo_url_2: str):
    result_1 = await get_repository_analysis(repo_url_1)
    result_2 = await get_repository_analysis(repo_url_2)

    repo_1 = jsonable_encoder(result_1)
    repo_2 = jsonable_encoder(result_2)

    comparison = calculate_comparison(repo_1, repo_2)

    # Run existing quality and security analysis modules.
    quality_1 = await run_optional_analysis(
        get_repository_quality_analysis,
        repo_url_1,
        15,
    )

    quality_2 = await run_optional_analysis(
        get_repository_quality_analysis,
        repo_url_2,
        15,
    )

    security_1 = await run_optional_analysis(
        get_repository_security_analysis,
        repo_url_1,
        30,
    )

    security_2 = await run_optional_analysis(
        get_repository_security_analysis,
        repo_url_2,
        30,
    )

    comparison["quality_analysis"] = {
        "repository_1": quality_1,
        "repository_2": quality_2,
    }

    comparison["security_analysis"] = {
        "repository_1": security_1,
        "repository_2": security_2,
    }

    return {
        "repository_1": repo_1,
        "repository_2": repo_2,
        "comparison": comparison,
    }
