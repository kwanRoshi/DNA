import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "DNA Analysis API"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        file_type = file.content_type
        
        if file_type.startswith('image/'):
            analysis_type = 'image'
        else:
            analysis_type = 'text'
            content = content.decode()
        
        headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}"}
        response = requests.post(
            "https://api.deepseek.com/v1/analyze",
            json={"content": content, "type": analysis_type},
            headers=headers
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Analysis failed")
            
        return {
            "success": True,
            "analysis": response.json()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
