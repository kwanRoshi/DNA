from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..services import analyze_with_ollama, analyze_with_deepseek
from ..config import MODEL_FALLBACK_PRIORITY

router = APIRouter()

@router.post("/analyze")
async def analyze_health_data(data: str, provider: str = None) -> Dict[str, Any]:
    if not data:
        raise HTTPException(status_code=400, detail="No data provided")
    
    if provider and provider not in MODEL_FALLBACK_PRIORITY:
        raise HTTPException(status_code=400, detail="Invalid provider specified")
    
    providers = [provider] if provider else MODEL_FALLBACK_PRIORITY
    last_error = None
    
    for current_provider in providers:
        try:
            if current_provider == "ollama":
                result = await analyze_with_ollama(data)
            elif current_provider == "deepseek":
                result = await analyze_with_deepseek(data)
            else:
                continue
                
            result["provider"] = current_provider
            return result
            
        except Exception as e:
            last_error = str(e)
            continue
    
    raise HTTPException(
        status_code=500,
        detail=f"All providers failed. Last error: {last_error}"
    )
