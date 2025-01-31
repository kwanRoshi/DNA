from typing import Dict, Any, Optional
from .ollama.ollama_service import ollama_service
from .deepseek_service import analyze_with_deepseek
from .claude_service import analyze_with_claude
from ..config import DEEPSEEK_API_KEY, CLAUDE_API_KEY
import logging

logger = logging.getLogger(__name__)

async def analyze_sequence(sequence: str) -> Dict[str, Any]:
    error_messages = []

    # Try Ollama first
    try:
        logger.info("Attempting analysis with local Ollama model")
        result = await ollama_service.analyze_sequence(sequence)
        if result and isinstance(result, dict) and "analysis" in result:
            logger.info("Successfully analyzed sequence with Ollama")
            return result
        logger.warning("Local Ollama analysis returned insufficient result")
        error_messages.append("Ollama分析结果不完整")
    except Exception as e:
        logger.error(f"Local Ollama analysis failed: {str(e)}")
        error_messages.append(f"Ollama服务错误: {str(e)}")

    # Try DeepSeek as fallback
    try:
        logger.info("Attempting analysis with DeepSeek API")
        result = await analyze_with_deepseek(sequence)
        if result and isinstance(result, dict) and "analysis" in result:
            logger.info("Successfully analyzed sequence with DeepSeek")
            return result
        logger.warning("DeepSeek analysis returned insufficient result")
        error_messages.append("DeepSeek分析结果不完整")
    except Exception as e:
        logger.error(f"DeepSeek analysis failed: {str(e)}")
        error_messages.append(f"DeepSeek服务错误: {str(e)}")

    # Try Claude as final fallback
    try:
        logger.info("Attempting analysis with Claude API")
        result = await analyze_with_claude(sequence)
        if result and isinstance(result, dict) and "analysis" in result:
            logger.info("Successfully analyzed sequence with Claude")
            return result
        logger.warning("Claude analysis returned insufficient result")
        error_messages.append("Claude分析结果不完整")
    except Exception as e:
        logger.error(f"Claude analysis failed: {str(e)}")
        error_messages.append(f"Claude服务错误: {str(e)}")

    raise Exception("DNA分析失败：" + "; ".join(error_messages))

