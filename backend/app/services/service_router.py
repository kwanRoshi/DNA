from typing import Dict, Any, Optional
from .ollama.ollama_service import ollama_service
import logging

logger = logging.getLogger(__name__)

async def analyze_sequence(sequence: str) -> Dict[str, Any]:
    result: Optional[Dict[str, Any]] = None
    
    # Try Ollama first (local processing)
    try:
        result = await ollama_service.analyze_sequence(sequence)
        if result:
            return result
    except Exception as e:
        logger.error(f"Local analysis failed: {str(e)}")
    
    # Fallback to other services handled by deployment configuration
    if not result:
        raise Exception("Analysis service failed")

