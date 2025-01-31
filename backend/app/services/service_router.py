from typing import Dict, Any, Optional
from .ollama.ollama_service import ollama_service
import logging

logger = logging.getLogger(__name__)

async def analyze_sequence(sequence: str) -> Dict[str, Any]:
    try:
        result = await ollama_service.analyze_sequence(sequence)
        if result:
            return result
        raise Exception("Local analysis failed with no result")
    except Exception as e:
        logger.error(f"Local analysis failed: {str(e)}")
        raise Exception("Analysis service failed")

