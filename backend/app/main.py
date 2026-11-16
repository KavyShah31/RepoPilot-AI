import os

import httpx
from backend.app.services.github_auth import get_github_headers

from fastapi import FastAPI

from backend.app.api.repositories import router as repository_router

from backend.app.api.code_analysis import (
    router as code_analysis_router
)

from backend.app.api.quality_analysis import router as quality_analysis_router

from backend.app.api.ai_review import router as ai_review_router

from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.security_analysis import router as security_analysis_router

from backend.app.api.history import router as history_router

from backend.app.api.comparison import router as comparison_router

from backend.app.api.recommendations import router as recommendations_router

from backend.app.api.health import router as health_router

app = FastAPI(
    title="RepoPilot AI API",
    description="AI-Powered Codebase Intelligence Platform",
    version="0.2.0"
)


@app.get("/", tags=["System"])
async def home():
    return {
        "project": "RepoPilot AI",
        "message": "Welcome to RepoPilot AI!",
        "status": "running",
        "version": "0.2.0"
    }


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "message": "RepoPilot AI backend is working!"
    }

@app.get("/diagnostics/github-auth", tags=["System"])
async def github_auth_diagnostic():
    headers = get_github_headers()

    results = {}

    endpoints = {
        "repository": "/repos/psf/requests",
        "languages": "/repos/psf/requests/languages",
        "contents": "/repos/psf/requests/contents"
    }

    try:
        async with httpx.AsyncClient(
            timeout=15,
            follow_redirects=True
        ) as client:

            for name, endpoint in endpoints.items():
                response = await client.get(
                    f"https://api.github.com{endpoint}",
                    headers=headers
                )

                try:
                    body = response.json()
                except ValueError:
                    body = {}

                results[name] = {
                    "status": response.status_code,
                    "remaining": response.headers.get(
                        "X-RateLimit-Remaining"
                    ),
                    "retry_after": response.headers.get(
                        "Retry-After"
                    ),
                    "message": body.get("message")
                    if isinstance(body, dict) else None
                }

        return {
            "token_configured": "Authorization" in headers,
            "results": results
        }

    except httpx.RequestError:
        return {
            "error": "GitHub API connection failed"
        }

    
# Register repository API routes
app.include_router(repository_router)
app.include_router(code_analysis_router)
app.include_router(quality_analysis_router)
app.include_router(ai_review_router)
app.include_router(security_analysis_router)
app.include_router(history_router)
app.include_router(comparison_router)
app.include_router(recommendations_router)
app.include_router(health_router)

# Local development origins
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Additional frontend origins from environment variables
configured_origins = os.getenv("FRONTEND_URLS", "")

for origin in configured_origins.split(","):
    origin = origin.strip().rstrip("/")

    if origin and origin not in allowed_origins:
        allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)