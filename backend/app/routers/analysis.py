import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.analysis import AnalysisResponse
from app.utils.database import get_db
from app.config import DEEPSEEK_API_KEY
from datetime import datetime
from pymongo.errors import PyMongoError
import json
import traceback
from typing import Optional
import logging
from ..services.claude_service import analyze_with_claude
from ..services.deepseek_service import analyze_with_deepseek

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/analysis",
    tags=["analysis"]
)

async def analyze_with_deepseek(sequence: str) -> dict:
    """Analyze sequence using DeepSeek API"""
    url = "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""As a bioinformatics expert, analyze this sequence and provide health insights:
    {sequence}
    
    Provide analysis in these sections:
    1. Sequence Analysis
    2. Health Implications
    3. Clinical Significance
    4. Recommendations"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 2000
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"DeepSeek API error: {response.text}")

            result = response.json()
            return {
                "analysis": result["choices"][0]["message"]["content"],
                "model": "deepseek-chat",
                "provider": "deepseek"
            }

    except Exception as e:
        print(f"Error in DeepSeek analysis: {str(e)}")
        raise Exception(f"Failed to analyze sequence with DeepSeek: {str(e)}")

async def process_sequence(sequence: str, provider: str) -> dict:
    """Process the sequence using the specified provider."""
    if not sequence:
        raise HTTPException(status_code=400, detail="No sequence provided")
    
    logger.info(f"Processing sequence with provider: {provider}")
    try:
        if provider == "deepseek":
            return await analyze_with_deepseek(sequence)
        elif provider == "claude":
            return await analyze_with_claude(sequence)
        else:
            raise HTTPException(status_code=400, detail="Invalid provider specified")
    except Exception as e:
        logger.error(f"Error processing sequence: {str(e)}")
        raise

@router.post("/analyze")
async def analyze_sequence(
    sequence: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    provider: str = Form("claude")
):
    """Analyze a sequence from either direct input or file upload."""
    try:
        if file:
            logger.info(f"Processing uploaded file: {file.filename}")
            content = await file.read()
            sequence = content.decode('utf-8').strip()
        elif not sequence:
            raise HTTPException(status_code=400, detail="Either sequence or file must be provided")
        
        sequence = sequence.strip()
        if not sequence:
            raise HTTPException(status_code=400, detail="Empty sequence provided")
            
        logger.info(f"Analyzing sequence of length {len(sequence)}")
        result = await process_sequence(sequence, provider)
        
        return {
            "status": "success",
            "analysis": result["analysis"],
            "model": result["model"],
            "provider": result["provider"]
        }
        
    except UnicodeDecodeError:
        logger.error("Failed to decode file content")
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please upload a UTF-8 encoded text file")
    except Exception as e:
        logger.error(f"Error in analyze_sequence: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_analysis_history():
    try:
        db = get_db()
        cursor = db.analyses.find().sort("created_at", -1)
        analyses = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
            analyses.append(doc)
        return analyses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 