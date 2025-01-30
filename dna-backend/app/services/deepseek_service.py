import httpx
import logging
from fastapi import HTTPException
import os
from dotenv import load_dotenv
import json

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-4ff47d34c52948edab6c9d0e7745b75b")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "sk-ant-api03-7vZA89NXXrxxxxxxxxxxx")

async def analyze_sequence(sequence: str, provider: str = "claude") -> dict:
    if not sequence:
        raise HTTPException(
            status_code=400,
            detail="Sequence cannot be empty"
        )
    
    if provider == "claude":
        return await analyze_with_claude(sequence)
    elif provider == "deepseek":
        return await analyze_with_deepseek(sequence)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider: {provider}"
        )

async def analyze_with_claude(sequence: str) -> dict:
    if not CLAUDE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Claude API key is not configured"
        )
    
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "claude-3-opus-20240229",
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
        "max_tokens": 2000
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                json=data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "analysis": {
                        "summary": result["content"][0]["text"],
                        "provider": "claude",
                        "model": "claude-3-opus-20240229"
                    }
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Claude API error: {response.text}"
                )
    except Exception as e:
        logger.error(f"Claude API error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze with Claude: {str(e)}"
        )

async def analyze_with_deepseek(sequence: str) -> dict:
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
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": "Analyze this health data briefly."
            },
            {
                "role": "user",
                "content": f"Analyze this health data: {sequence[:500]}"  # Limit input size
            }
        ],
        "temperature": 0.3,
        "max_tokens": 500,  # Reduce response size
        "stream": False  # Ensure we get a complete response
    }

    try:
        logger.info(f"Sending request to DeepSeek API with sequence length: {len(sequence)}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info(f"Using API key: {DEEPSEEK_API_KEY[:8]}...")
            logger.info("Making request to DeepSeek API...")
            try:
                response = await client.post(
                    "https://api.deepseek.com/v1/chat/completions",
                    json=data,
                    headers=headers,
                    follow_redirects=True
                )
                logger.info(f"Response status: {response.status_code}")
                response_text = await response.aread()
                logger.info(f"Raw response: {response_text}")
                
                if response.status_code != 200:
                    try:
                        error_json = json.loads(response_text)
                        logger.error(f"Error details: {error_json}")
                        logger.error(f"Request payload: {json.dumps(data, indent=2)}")
                        logger.error(f"Response headers: {dict(response.headers)}")
                        error_message = error_json.get('error', {}).get('message', str(error_json))
                    except json.JSONDecodeError:
                        error_message = str(response_text)
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"DeepSeek API error: {error_message}"
                    )
                
                result = response.json()
                logger.info("Successfully received response from DeepSeek API")
                logger.info(f"Response content: {result}")
                
                analysis_text = result["choices"][0]["message"]["content"]
                return {
                    "success": True,
                    "analysis": {
                        "summary": analysis_text,
                        "recommendations": ["Based on DeepSeek analysis"],
                        "riskFactors": ["Based on DeepSeek analysis"],
                        "metrics": {
                            "healthScore": 85,
                            "stressLevel": "medium",
                            "sleepQuality": "good"
                        }
                    }
                }
            except httpx.TimeoutException:
                logger.error("Request timed out")
                raise HTTPException(
                    status_code=504,
                    detail="Request to DeepSeek API timed out"
                )
            except httpx.RequestError as e:
                logger.error(f"Request error: {str(e)}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Network error: {str(e)}"
                )
            
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
