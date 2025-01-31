from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from .services.service_router import analyze_sequence
import json

app = FastAPI(title="DNA Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic import BaseModel

class SequenceRequest(BaseModel):
    sequence: str
    provider: str = "deepseek"

@app.post("/analyze")
async def analyze_dna(request: SequenceRequest):
    try:
        print(f"Analyzing sequence: {request.sequence[:20]}... with provider: {request.provider}")
        result = await analyze_sequence(request.sequence)
        print(f"Analysis result: {result}")
        return result
    except Exception as e:
        print(f"Error analyzing sequence: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "deepseek-r1:1.5b"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
