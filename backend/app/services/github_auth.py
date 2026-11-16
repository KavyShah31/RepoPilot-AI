import os


def get_github_headers():
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "RepoPilot-AI",
    }

    token = os.getenv("GITHUB_TOKEN", "").strip()

    if token:
        headers["Authorization"] = f"Bearer {token}"

    return headers
