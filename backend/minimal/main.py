from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import analysis
from .config import MODEL_FALLBACK_PRIORITY, OLLAMA_ENABLED

app = FastAPI(
    title="DNA Analysis API",
    description="Health analysis system with local-first model architecture",
    version="1.0.0"
)

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
    return {"status": "healthy"}
