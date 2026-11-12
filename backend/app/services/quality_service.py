
import asyncio
import base64
import httpx

from urllib.parse import quote, urlparse
from fastapi import HTTPException

from backend.app.services.quality_analyzer import (
    analyze_python_quality,
    calculate_quality_score,
    get_quality_grade,
)


GITHUB_API = "https://api.github.com"

IGNORED_DIRS = {
    ".git",
    ".venv",
    "venv",
    "env",
    "node_modules",
    "__pycache__",
    "site-packages",
    "dist",
    "build",
    ".tox",
}

MAX_FILE_SIZE = 100 * 1024
CONCURRENT_REQUESTS = 4


def parse_github_url(repo_url: str) -> tuple[str, str]:
    parsed = urlparse(repo_url.strip())

    if parsed.scheme not in {"https", "http"}:
        raise HTTPException(400, "Only HTTP(S) GitHub URLs are supported.")

    if parsed.netloc.lower() not in {"github.com", "www.github.com"}:
        raise HTTPException(400, "Please provide a valid GitHub repository URL.")

    parts = [part for part in parsed.path.strip("/").split("/") if part]

    if len(parts) < 2:
        raise HTTPException(400, "GitHub URL must contain owner and repository.")

    owner = parts[0]
    repo = parts[1].removesuffix(".git")

    if not owner or not repo:
        raise HTTPException(400, "Invalid GitHub repository URL.")

    return owner, repo


async def github_get(
    client: httpx.AsyncClient,
    endpoint: str,
):
    try:
        response = await client.get(f"{GITHUB_API}{endpoint}")
    except httpx.TimeoutException:
        raise HTTPException(504, "GitHub API request timed out.")
    except httpx.RequestError:
        raise HTTPException(502, "Could not connect to GitHub API.")

    if response.status_code == 404:
        raise HTTPException(404, "GitHub repository or resource not found.")

    if response.status_code == 403:
        raise HTTPException(
            429,
            "GitHub API rate limit reached. Try again later.",
        )

    if response.status_code >= 400:
        raise HTTPException(
            502,
            f"GitHub API returned status {response.status_code}.",
        )

    return response.json()


async def get_repository_quality_analysis(
    repo_url: str,
    max_files: int = 15,
):
    owner, repo = parse_github_url(repo_url)

    owner_path = quote(owner, safe="")
    repo_path = quote(repo, safe="")

    repository_path = f"/repos/{owner_path}/{repo_path}"

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "RepoPilot-AI",
    }

    async with httpx.AsyncClient(
        headers=headers,
        timeout=httpx.Timeout(30.0),
        follow_redirects=True,
    ) as client:

        repository = await github_get(client, repository_path)
        branch = repository["default_branch"]

        tree_data = await github_get(
            client,
            (
                f"{repository_path}/git/trees/"
                f"{quote(branch, safe='')}?recursive=1"
            ),
        )

        tree = tree_data.get("tree", [])

        python_files = [
            item
            for item in tree
            if item.get("type") == "blob"
            and item.get("path", "").endswith(".py")
            and item.get("size", 0) <= MAX_FILE_SIZE
            and not any(
                directory in IGNORED_DIRS
                for directory in item.get("path", "").split("/")
            )
        ]

        discovered_files = len(python_files)
        selected_files = python_files[:max_files]

        semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

        async def analyze_file(item):
            async with semaphore:
                blob = await github_get(
                    client,
                    f"{repository_path}/git/blobs/{item['sha']}",
                )

            if blob.get("encoding") != "base64":
                return None

            try:
                source = base64.b64decode(
                    blob["content"]
                ).decode("utf-8")
            except (KeyError, ValueError, UnicodeDecodeError):
                return None

            return analyze_python_quality(
                source,
                item["path"],
            )

        results = await asyncio.gather(
            *(analyze_file(item) for item in selected_files),
            return_exceptions=True,
        )

        file_results = []
        warnings = []

        for item, result in zip(selected_files, results):
            if isinstance(result, Exception):
                warnings.append(
                    f"Could not analyze {item['path']}: {str(result)}"
                )
            elif result is not None:
                file_results.append(result)

        all_findings = [
            finding
            for file_result in file_results
            for finding in file_result["findings"]
        ]

        score = calculate_quality_score(all_findings)

        skipped_files = discovered_files - len(selected_files)
        skipped_files += len(selected_files) - len(file_results)

        if tree_data.get("truncated"):
            warnings.append(
                "GitHub returned a truncated repository tree. "
                "Some files may not have been discovered."
            )

        return {
            "repository": repository["full_name"],
            "branch": branch,
            "discovered_files": discovered_files,
            "analyzed_files": len(file_results),
            "skipped_files": skipped_files,
            "quality_score": score,
            "quality_grade": get_quality_grade(score),
            "total_findings": len(all_findings),
            "critical_findings": sum(
                f["severity"] == "critical" for f in all_findings
            ),
            "high_findings": sum(
                f["severity"] == "high" for f in all_findings
            ),
            "medium_findings": sum(
                f["severity"] == "medium" for f in all_findings
            ),
            "low_findings": sum(
                f["severity"] == "low" for f in all_findings
            ),
            "findings": all_findings,
            "warnings": warnings,
        }
