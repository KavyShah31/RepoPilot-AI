
import asyncio
import base64

import httpx

from urllib.parse import quote, urlparse
from fastapi import HTTPException

from backend.app.services.security_analysis import (
    scan_source_file,
    calculate_security_score,
    get_security_grade,
)


GITHUB_API = "https://api.github.com"

MAX_FILE_SIZE = 100 * 1024
CONCURRENT_REQUESTS = 4

SUPPORTED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".yaml",
    ".yml",
    ".env",
    ".ini",
    ".cfg",
    ".conf",
}

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
        raise HTTPException(429, "GitHub API rate limit reached. Try again later.")

    if response.status_code >= 400:
        raise HTTPException(
            502,
            f"GitHub API returned status {response.status_code}.",
        )

    return response.json()


def decode_github_blob(blob: dict) -> str | None:
    if blob.get("encoding") != "base64":
        return None

    try:
        content = base64.b64decode(blob["content"])
        return content.decode("utf-8")
    except (KeyError, ValueError, UnicodeDecodeError):
        return None


def is_supported_file(path: str) -> bool:
    parts = path.split("/")

    if any(part in IGNORED_DIRS for part in parts):
        return False

    filename = parts[-1].lower()

    if filename == ".env" or filename.startswith(".env."):
        return True

    if "." not in filename:
        return False

    extension = "." + filename.rsplit(".", 1)[-1]
    return extension in SUPPORTED_EXTENSIONS


async def get_repository_security_analysis(
    repo_url: str,
    max_files: int = 30,
) -> dict:
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

        source_files = [
            item
            for item in tree
            if item.get("type") == "blob"
            and item.get("size", 0) <= MAX_FILE_SIZE
            and is_supported_file(item.get("path", ""))
        ]

        discovered_files = len(source_files)
        selected_files = source_files[:max_files]

        semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

        async def fetch_file(item):
            async with semaphore:
                blob = await github_get(
                    client,
                    f"{repository_path}/git/blobs/{item['sha']}",
                )

            source = decode_github_blob(blob)

            if source is None:
                return None

            return {
                "path": item["path"],
                "source": source,
            }

        results = await asyncio.gather(
            *(fetch_file(item) for item in selected_files),
            return_exceptions=True,
        )

        warnings = []
        all_findings = []
        scanned_files = 0

        for item, result in zip(selected_files, results):
            if isinstance(result, Exception):
                warnings.append(
                    f"Could not fetch {item['path']}: {str(result)}"
                )
                continue

            if result is None:
                warnings.append(
                    f"Could not decode {item['path']}."
                )
                continue

            findings = scan_source_file(
                result["source"],
                result["path"],
            )

            all_findings.extend(findings)
            scanned_files += 1

        if tree_data.get("truncated"):
            warnings.append(
                "GitHub returned a truncated repository tree. "
                "Some files may not have been discovered."
            )

        severity_counts = {
            severity: sum(
                finding["severity"] == severity
                for finding in all_findings
            )
            for severity in ("critical", "high", "medium", "low")
        }

        score = calculate_security_score(all_findings)

        skipped_files = discovered_files - scanned_files

        return {
            "repository": repository["full_name"],
            "branch": branch,
            "discovered_files": discovered_files,
            "scanned_files": scanned_files,
            "skipped_files": skipped_files,
            "security_score": score,
            "security_grade": get_security_grade(score),
            "total_findings": len(all_findings),
            "critical_findings": severity_counts["critical"],
            "high_findings": severity_counts["high"],
            "medium_findings": severity_counts["medium"],
            "low_findings": severity_counts["low"],
            "findings": all_findings,
            "warnings": warnings,
        }
