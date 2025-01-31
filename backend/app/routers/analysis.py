import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.analysis import AnalysisResponse
from app.utils.database import get_db
from app.config import DEEPSEEK_API_KEY
from datetime import datetime
from pymongo.errors import PyMongoError
import json
import traceback
from typing import Optional, Dict, Any
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

async def process_sequence(sequence: str, provider: Optional[str] = None) -> dict:
    """Process the sequence using available providers based on priority."""
    if not sequence:
        raise HTTPException(status_code=400, detail="No sequence provided")
    
    from ..config import MODEL_FALLBACK_PRIORITY, OLLAMA_ENABLED
    from ..services.ollama_service import analyze_with_ollama
    
    # If provider is specified, try only that provider
    if provider:
        logger.info(f"Using specified provider: {provider}")
        try:
            if provider == "ollama" and OLLAMA_ENABLED:
                return await analyze_with_ollama(sequence)
            elif provider == "deepseek":
                return await analyze_with_deepseek(sequence)
            elif provider == "claude":
                from ..config import CLAUDE_API_KEY
                if CLAUDE_API_KEY == 'test_key':
                    raise HTTPException(status_code=400, detail="Claude API key not configured")
                return await analyze_with_claude(sequence)
            else:
                raise HTTPException(status_code=400, detail="Invalid provider specified")
        except Exception as e:
            logger.error(f"Error with specified provider {provider}: {str(e)}")
            if provider == "claude" and "invalid x-api-key" in str(e):
                raise HTTPException(status_code=400, detail="Claude API key not configured or invalid")
            raise
    
    # Try providers in priority order
    last_error = None
    for provider in MODEL_FALLBACK_PRIORITY:
        try:
            logger.info(f"Attempting analysis with provider: {provider}")
            if provider == "ollama" and OLLAMA_ENABLED:
                return await analyze_with_ollama(sequence)
            elif provider == "deepseek":
                return await analyze_with_deepseek(sequence)
            elif provider == "claude":
                return await analyze_with_claude(sequence)
        except Exception as e:
            last_error = e
            logger.warning(f"Provider {provider} failed: {str(e)}")
            continue
            
    # If all providers failed, raise the last error
    logger.error("All providers failed")
    raise last_error or HTTPException(status_code=500, detail="All analysis providers failed")

@router.post("/analyze")
async def analyze_sequence(
    sequence: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    provider: str = Form("claude")
):
    """Analyze a sequence from either direct input or file upload."""
    try:
        input_sequence = None
        if file:
            logger.info(f"Processing uploaded file: {file.filename}")
            content = await file.read()
            input_sequence = content.decode('utf-8').strip()
        elif sequence:
            input_sequence = sequence.strip()
            
        if not input_sequence:
            raise HTTPException(status_code=400, detail="Either sequence or file must be provided with non-empty content")
            
        logger.info(f"Analyzing sequence of length {len(input_sequence)}")
        result = await process_sequence(input_sequence, provider)
        
        # Ensure we have a consistent response format
        if not isinstance(result.get("analysis"), dict):
            # Convert string analysis to structured format
            analysis_text = result.get("analysis", "")
            result["analysis"] = {
                "summary": analysis_text,
                "recommendations": [],
                "risk_factors": []
            }
            
            # Try to extract sections if possible
            sections = analysis_text.split("\n\n")
            for section in sections:
                if section.startswith("Recommendations:") or section.startswith("建议:"):
                    result["analysis"]["recommendations"] = [
                        r.strip("- ").strip() 
                        for r in section.split("\n")[1:] 
                        if r.strip()
                    ]
                elif section.startswith("Risk Factors:") or section.startswith("风险因素:"):
                    result["analysis"]["risk_factors"] = [
                        r.strip("- ").strip() 
                        for r in section.split("\n")[1:] 
                        if r.strip()
                    ]
        
        # Ensure consistent response format
        if not isinstance(result.get("analysis"), dict):
            result["analysis"] = {
                "summary": result.get("analysis", ""),
                "recommendations": [
                    "建议进行定期健康检查，及时发现潜在问题",
                    "保持良好的生活习惯和作息规律",
                    "建议咨询专业医生获取更详细的建议"
                ],
                "risk_factors": [
                    "需要进一步检查以确定具体风险",
                    "可能存在潜在健康隐患"
                ],
                "metrics": {
                    "healthScore": 75,
                    "stressLevel": "medium",
                    "sleepQuality": "fair",
                    "riskLevel": "medium",
                    "confidenceScore": 0.85,
                    "healthIndex": 80
                }
            }
            
        return {
            "success": True,
            "analysis": result["analysis"],
            "model": result.get("model", ""),
            "provider": result.get("provider", provider)
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