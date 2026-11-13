
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
app.include_router(ai_review_router)
app.include_router(security_analysis_router)
app.include_router(history_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)