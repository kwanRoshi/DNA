from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "DNA Analysis API"}

@app.get("/health")
async def health_check():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/version")
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "ollama": "connected",
                    "version": response.json().get("version")
                }
    except Exception:
        pass
    return {"status": "healthy", "ollama": "not available"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
