
import asyncio
import base64

from urllib.parse import quote

from backend.app.services.code_parser import (
    analyze_python_source
)

import re
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException


GITHUB_API = "https://api.github.com"
GITHUB_API_VERSION = "2026-03-10"


def parse_github_repo_url(repo_url: str) -> tuple[str, str]:
    """Validate a GitHub URL and extract its owner and repository."""

    parsed = urlparse(repo_url.strip())

    if (
        parsed.scheme != "https"
        or parsed.hostname not in {"github.com", "www.github.com"}
        or parsed.username
        or parsed.password
        or parsed.port is not None
        or parsed.query
        or parsed.fragment
    ):
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid HTTPS GitHub repository URL."
        )

    parts = parsed.path.strip("/").split("/")

    if len(parts) != 2:
        raise HTTPException(
            status_code=400,
            detail="URL must contain an owner and repository name."
        )

    owner, repo = parts
    repo = repo.removesuffix(".git")

    valid_name = re.compile(r"^[A-Za-z0-9_.-]+$")

    if (
        owner in {".", ".."}
        or repo in {".", ".."}
        or not valid_name.fullmatch(owner)
        or not valid_name.fullmatch(repo)
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub owner or repository name."
        )

    return owner, repo


async def get_github_data(
    client: httpx.AsyncClient,
    endpoint: str,
    params: dict | None = None
):
    response = await client.get(
        f"{GITHUB_API}{endpoint}",
        params=params
    )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Repository not found or not publicly accessible."
        )

    if response.status_code in {403, 429}:
        if response.headers.get("X-RateLimit-Remaining") == "0":
            raise HTTPException(
                status_code=429,
                detail="GitHub API rate limit reached. Try again later."
            )

        raise HTTPException(
            status_code=502,
            detail="GitHub API denied the request."
        )

    if response.is_error:
        raise HTTPException(
            status_code=502,
            detail="GitHub API request failed."
        )

    try:
        return response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="GitHub returned an invalid response."
        )


async def get_repository_analysis(repo_url: str) -> dict:
    """Analyze public repository metadata and root directory."""

    owner, repo = parse_github_repo_url(repo_url)

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "RepoPilot-AI"
    }

    async with httpx.AsyncClient(
        headers=headers,
        timeout=15.0,
        follow_redirects=True
    ) as client:

        metadata, languages, contents = await __import__(
            "asyncio"
        ).gather(
            get_github_data(client, f"/repos/{owner}/{repo}"),
            get_github_data(client, f"/repos/{owner}/{repo}/languages"),
            get_github_data(client, f"/repos/{owner}/{repo}/contents")
        )

    if not isinstance(metadata, dict):
        raise HTTPException(
            status_code=502,
            detail="Unexpected repository metadata."
        )

    if not isinstance(languages, dict):
        languages = {}

    if not isinstance(contents, list):
        contents = []

    files = [
        {
            "name": item["name"],
            "path": item["path"],
            "type": item["type"],
            "size": item.get("size"),
            "html_url": item.get("html_url")
        }
        for item in contents[:100]
        if isinstance(item, dict)
        and {"name", "path", "type"}.issubset(item)
    ]

    return {
        "full_name": metadata["full_name"],
        "description": metadata.get("description"),
        "html_url": metadata["html_url"],
        "default_branch": metadata["default_branch"],
        "stars": metadata["stargazers_count"],
        "forks": metadata["forks_count"],
        "open_issues": metadata["open_issues_count"],
        "primary_language": metadata.get("language"),
        "languages": languages,
        "total_root_items": len(contents),
        "files": files
    }

MAX_CODE_FILES = 25
MAX_FILE_BYTES = 100 * 1024

IGNORED_DIRECTORIES = {
    ".git",
    ".venv",
    "venv",
    "env",
    "node_modules",
    "__pycache__",
    "site-packages",
    "dist",
    "build",
    ".tox"
}


async def get_repository_code_analysis(
    repo_url: str,
    max_files: int = 15
) -> dict:
    """Fetch and analyze Python files from a public GitHub repository."""

    owner, repo = parse_github_repo_url(repo_url)

    if not 1 <= max_files <= MAX_CODE_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"max_files must be between 1 and {MAX_CODE_FILES}."
        )

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "RepoPilot-AI"
    }

    async with httpx.AsyncClient(
        headers=headers,
        timeout=20.0,
        follow_redirects=True
    ) as client:

        # 1. Retrieve repository information.
        metadata = await get_github_data(
            client,
            f"/repos/{owner}/{repo}"
        )

        if not isinstance(metadata, dict):
            raise HTTPException(
                status_code=502,
                detail="Invalid GitHub repository metadata."
            )

        branch = metadata.get("default_branch")

        if not isinstance(branch, str) or not branch:
            raise HTTPException(
                status_code=502,
                detail="Could not determine the default branch."
            )

        # 2. Retrieve the complete repository tree.
        encoded_branch = quote(branch, safe="")

        tree_data = await get_github_data(
            client,
            f"/repos/{owner}/{repo}/git/trees/{encoded_branch}",
            params={"recursive": "1"}
        )

        if not isinstance(tree_data, dict):
            raise HTTPException(
                status_code=502,
                detail="Invalid GitHub tree response."
            )

        tree_entries = tree_data.get("tree", [])

        if not isinstance(tree_entries, list):
            raise HTTPException(
                status_code=502,
                detail="Invalid repository tree structure."
            )

        # 3. Select relevant Python files.
        python_entries = [
            entry
            for entry in tree_entries
            if isinstance(entry, dict)
            and entry.get("type") == "blob"
            and entry.get("mode") != "120000"
            and isinstance(entry.get("path"), str)
            and entry["path"].endswith(".py")
            and not (
                set(entry["path"].split("/"))
                & IGNORED_DIRECTORIES
            )
        ]

        eligible_entries = []
        too_large_count = 0

        for entry in python_entries:

            file_size = entry.get("size")

            if (
                not isinstance(file_size, int)
                or file_size < 0
                or file_size > MAX_FILE_BYTES
            ):
                too_large_count += 1
                continue

            if not isinstance(entry.get("sha"), str):
                continue

            eligible_entries.append(entry)

        selected_entries = eligible_entries[:max_files]

        skipped_files = (
            too_large_count
            + len(eligible_entries)
            - len(selected_entries)
        )

        # 4. Fetch source code with limited concurrency.
        semaphore = asyncio.Semaphore(4)

        async def analyze_file(entry):

            async with semaphore:

                blob = await get_github_data(
                    client,
                    f"/repos/{owner}/{repo}/git/blobs/{entry['sha']}"
                )

            if not isinstance(blob, dict):
                raise HTTPException(
                    status_code=502,
                    detail="Invalid GitHub blob response."
                )

            content = blob.get("content")

            if (
                blob.get("encoding") != "base64"
                or not isinstance(content, str)
            ):
                raise HTTPException(
                    status_code=502,
                    detail="GitHub returned an unsupported file encoding."
                )

            try:
                source_bytes = base64.b64decode(content)
                source_code = source_bytes.decode(
                    "utf-8-sig",
                    errors="replace"
                )

            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=502,
                    detail=f"Could not decode {entry['path']}."
                )

            return analyze_python_source(
                source_code,
                entry["path"]
            )

        results = await asyncio.gather(
            *[
                analyze_file(entry)
                for entry in selected_entries
            ]
        )

    # 5. Calculate repository-level statistics.
    total_functions = sum(
        item["function_count"] for item in results
    )

    total_classes = sum(
        item["class_count"] for item in results
    )

    total_imports = sum(
        item["import_count"] for item in results
    )

    warnings = []

    if tree_data.get("truncated"):
        warnings.append(
            "GitHub returned a truncated repository tree. "
            "Results may be incomplete."
        )

    if skipped_files:
        warnings.append(
            f"{skipped_files} Python files were skipped "
            "because of file limits or size restrictions."
        )

    if not results:
        warnings.append(
            "No eligible Python files were found."
        )

    return {
        "repository": metadata["full_name"],
        "default_branch": branch,
        "discovered_python_files": len(python_entries),
        "analyzed_files": len(results),
        "skipped_files": skipped_files,
        "total_functions": total_functions,
        "total_classes": total_classes,
        "total_imports": total_imports,
        "files": results,
        "warning": " ".join(warnings) if warnings else None
    }
