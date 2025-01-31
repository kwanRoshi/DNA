from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from typing import Optional
from app.routers import analysis
from app.config import MODEL_FALLBACK_PRIORITY, OLLAMA_ENABLED, OLLAMA_API_BASE

app = FastAPI(
    title="DNA Analysis API",
    description="Health analysis system with local-first model architecture",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app.include_router(analysis.router)

@app.get("/")
async def root():
    return {
        "message": "DNA Analysis API",
        "model_priority": MODEL_FALLBACK_PRIORITY,
        "local_model": OLLAMA_ENABLED
    }

@app.get("/health")
async def health_check():
    try:
        if OLLAMA_ENABLED:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{OLLAMA_API_BASE}/api/version")
                if response.status_code == 200:
                    return {
                        "status": "healthy",
                        "ollama": "connected",
                        "version": response.json()["version"]
                    }
        return {"status": "healthy", "ollama": "disabled"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "degraded", "error": str(e)}
