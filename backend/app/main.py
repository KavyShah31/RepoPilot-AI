from fastapi import FastAPI

app = FastAPI(
    title="RepoPilot AI API",
    description="AI-Powered Codebase Intelligence Platform",
    version="0.1.0"
)


@app.get("/", tags=["System"])
async def home():
    return {
        "project": "RepoPilot AI",
        "message": "Welcome to RepoPilot AI!",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "message": "RepoPilot AI backend is working!"
    }