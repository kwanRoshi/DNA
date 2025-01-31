import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from datetime import datetime
from typing import Optional
import logging
from ..services.claude_service import analyze_with_claude
from ..services.deepseek_service import analyze_with_deepseek
from ..services.ollama_service import analyze_with_ollama
from ..config import MODEL_FALLBACK_PRIORITY, OLLAMA_ENABLED

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/analysis",
    tags=["analysis"]
)

async def process_sequence(sequence: str, provider: str = None) -> dict:
    """Process the sequence using available providers based on priority."""
    if not sequence:
        raise HTTPException(status_code=400, detail="No sequence provided")
    
    # If provider is specified and valid, try only that provider
    if provider:
        logger.info(f"Using specified provider: {provider}")
        try:
            if provider == "ollama" and OLLAMA_ENABLED:
                return await analyze_with_ollama(sequence)
            elif provider == "deepseek":
                return await analyze_with_deepseek(sequence)
            elif provider == "claude":
                return await analyze_with_claude(sequence)
            else:
                raise HTTPException(status_code=400, detail="Invalid provider specified")
        except Exception as e:
            logger.error(f"Error with specified provider {provider}: {str(e)}")
            raise

    # Try providers in priority order
    last_error = None
    for provider in MODEL_FALLBACK_PRIORITY:
        provider = provider.strip().lower()
        try:
            logger.info(f"Attempting analysis with provider: {provider}")
            if provider == "ollama":
                if not OLLAMA_ENABLED:
                    logger.warning("Ollama is disabled, skipping")
                    continue
                try:
                    return await analyze_with_ollama(sequence)
                except Exception as e:
                    logger.warning(f"Ollama analysis failed: {str(e)}")
                    continue
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
    provider: Optional[str] = Form(None)
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
        
        return {
            "status": "success",
            "analysis": result["analysis"],
            "model": result.get("model", ""),
            "provider": result.get("provider", "")
        }
        
    except UnicodeDecodeError:
        logger.error("Failed to decode file content")
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please upload a UTF-8 encoded text file")
    except Exception as e:
        logger.error(f"Error in analyze_sequence: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
