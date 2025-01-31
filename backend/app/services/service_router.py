from typing import Dict, Any, Optional
from .ollama.ollama_service import ollama_service
from .deepseek_service import analyze_with_deepseek
from .claude_service import analyze_with_claude
import logging

logger = logging.getLogger(__name__)

async def analyze_sequence(sequence: str) -> Dict[str, Any]:
    # Try Ollama first (local processing)
    # Try local Ollama first
    try:
        logger.info("Attempting analysis with local Ollama model")
        result = await ollama_service.analyze_sequence(sequence)
        if result and len(result.get("analysis", "").strip()) > 50:
            logger.info("Successfully analyzed sequence with Ollama")
            return result
        logger.warning("Local Ollama analysis returned insufficient result")
    except Exception as e:
        logger.error(f"Local Ollama analysis failed: {str(e)}")

    # Try DeepSeek as first fallback
    try:
        logger.info("Attempting analysis with DeepSeek API")
        result = await analyze_with_deepseek(sequence)
        if result and len(result.get("analysis", "").strip()) > 50:
            logger.info("Successfully analyzed sequence with DeepSeek")
            return result
        logger.warning("DeepSeek analysis returned insufficient result")
    except Exception as e:
        logger.error(f"DeepSeek analysis failed: {str(e)}")

    # Try Claude as second fallback
    try:
        logger.info("Attempting analysis with Claude API")
        result = await analyze_with_claude(sequence)
        if result and len(result.get("analysis", "").strip()) > 50:
            logger.info("Successfully analyzed sequence with Claude")
            return result
        logger.warning("Claude analysis returned insufficient result")
    except Exception as e:
        logger.error(f"Claude analysis failed: {str(e)}")

    raise Exception("所有分析服务都未能提供有效结果")

