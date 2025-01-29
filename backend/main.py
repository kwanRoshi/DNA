from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "DNA Analysis API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/analyze")
async def analyze_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        return {
            "success": True,
            "analysis": {
                "summary": "Test analysis result",
                "recommendations": ["Sample recommendation"],
                "riskFactors": ["Sample risk factor"],
                "metrics": {
                    "healthScore": 85,
                    "stressLevel": "medium",
                    "sleepQuality": "good"
                }
            }
        }
    except Exception as e:
        return {"error": str(e)}

def start():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    start()
