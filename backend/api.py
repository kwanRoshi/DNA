from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from app.routers import analysis
from app.config import MODEL_FALLBACK_PRIORITY, OLLAMA_ENABLED, OLLAMA_API_BASE

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api")

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
        return {"status": "degraded", "error": str(e)}
