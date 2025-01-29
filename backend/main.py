from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "DNA Analysis API"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    return {
        "success": True,
        "message": "File analysis endpoint"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
