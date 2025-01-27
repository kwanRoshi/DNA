import httpx
import logging
from fastapi import HTTPException
from ..config import DEEPSEEK_API_KEY

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def analyze_with_deepseek(sequence: str) -> dict:
    if not sequence:
        raise HTTPException(
            status_code=400,
            detail="Sequence cannot be empty"
        )

    if not DEEPSEEK_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="DeepSeek API key is not configured"
        )

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "deepseek-chat",  # Using DeepSeek chat model as specified
        "messages": [
            {
                "role": "system",
                "content": "You are a bioinformatics expert analyzing biological sequences. Provide detailed analysis including sequence type identification, features, health implications, and recommendations."
            },
            {
                "role": "user",
                "content": f"Please analyze this sequence and provide health insights: {sequence}"
            }
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
        "top_p": 0.95,
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0
    }

    try:
        logger.info(f"Sending request to DeepSeek API with sequence length: {len(sequence)}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                json=data,
                headers=headers
            )
            
            if response.status_code != 200:
                error_detail = response.json() if response.content else "No error details available"
                logger.error(f"DeepSeek API error: {error_detail}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"DeepSeek API error: {error_detail}"
                )
                
            result = response.json()
            logger.info("Successfully received response from DeepSeek API")
            return {
                "analysis": result["choices"][0]["message"]["content"],
                "model": "deepseek-chat",
                "provider": "deepseek"
            }
            
    except httpx.TimeoutException as e:
        logger.error(f"Request timeout: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail="Analysis request timed out. Please try again."
        )
    except httpx.RequestError as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Network error while connecting to DeepSeek API: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze sequence: {str(e)}"
        )         