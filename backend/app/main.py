
from fastapi import FastAPI

from backend.app.api.repositories import router as repository_router

from backend.app.api.code_analysis import (
    router as code_analysis_router
)

from backend.app.api.quality_analysis import router as quality_analysis_router

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


# Register repository API routes
app.include_router(repository_router)
app.include_router(code_analysis_router)
app.include_router(quality_analysis_router)