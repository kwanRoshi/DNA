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

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    logger.error("DeepSeek API key not found in environment variables")
    raise ValueError("DeepSeek API key not configured. Please set DEEPSEEK_API_KEY environment variable.")

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")

async def analyze_sequence(sequence: str, provider: str = "deepseek") -> dict:
    try:
        logger.info(f"Starting analysis with provider: {provider}")
        logger.info(f"Sequence length: {len(sequence)}")
        
        if not sequence:
            logger.error("Empty sequence provided")
            raise HTTPException(
                status_code=400,
                detail="Sequence cannot be empty"
            )
        
        if provider == "claude":
            logger.info("Using Claude provider")
            return await analyze_with_claude(sequence)
        elif provider == "deepseek":
            logger.info("Using DeepSeek provider")
            return await analyze_with_deepseek(sequence)
        else:
            logger.error(f"Unsupported provider: {provider}")
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported provider: {provider}"
            )
    except HTTPException as e:
        logger.error(f"HTTP Exception in analyze_sequence: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_sequence: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to analyze sequence: {str(e)}"
        }

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
        logger.error("DeepSeek API key not found")
        raise HTTPException(
            status_code=500,
            detail="DeepSeek API key is not configured"
        )

    logger.info("Initializing DeepSeek API request")
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    logger.info("API key configured successfully")
    
    data = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": "You are a healthcare AI expert. Analyze the provided health data to: 1) Identify key health metrics and patterns, 2) Assess potential health risks and concerns, 3) Provide actionable recommendations for health improvement. Format your response to include clear sections for Summary, Risk Factors, and Recommendations."
            },
            {
                "role": "user",
                "content": f"Please analyze this health data and provide structured insights: {sequence[:1000]}"
            }
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
        "stream": False
    }

    try:
        logger.info(f"Sending request to DeepSeek API with sequence length: {len(sequence)}")
        async with httpx.AsyncClient(timeout=30.0) as client:
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
                
                if response.status_code == 401:
                    logger.error("Invalid API key or authentication error")
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid API key. Please check your DeepSeek API configuration."
                    )
                elif response.status_code == 429:
                    logger.error("Rate limit exceeded")
                    raise HTTPException(
                        status_code=429,
                        detail="DeepSeek API rate limit exceeded. Please try again later."
                    )
                elif response.status_code != 200:
                    try:
                        error_json = json.loads(response_text)
                        logger.error(f"Error details: {error_json}")
                        logger.error(f"Request payload: {json.dumps(data, indent=2)}")
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
                
                if not result.get("choices") or not result["choices"][0].get("message"):
                    logger.error("Invalid response structure from DeepSeek API")
                    raise HTTPException(
                        status_code=502,
                        detail="Invalid response from AI service"
                    )
                
                analysis_text = result["choices"][0]["message"]["content"]
                
                # Parse the structured response into sections
                sections = analysis_text.split("\n\n")
                summary = ""
                recommendations = []
                risk_factors = []
                
                for section in sections:
                    if "Summary:" in section:
                        summary = section.replace("Summary:", "").strip()
                    elif "Risk Factors:" in section:
                        risks = section.replace("Risk Factors:", "").strip().split("\n")
                        risk_factors = [r.strip("- ") for r in risks if r.strip()]
                    elif "Recommendations:" in section:
                        recs = section.replace("Recommendations:", "").strip().split("\n")
                        recommendations = [r.strip("- ") for r in recs if r.strip()]
                
                return {
                    "success": True,
                    "analysis": {
                        "summary": summary or analysis_text,
                        "recommendations": recommendations or ["Please provide more detailed health data for specific recommendations"],
                        "riskFactors": risk_factors or ["Unable to determine risk factors from provided data"],
                        "metrics": {
                            "healthScore": None,
                            "stressLevel": None,
                            "sleepQuality": None
                        }
                    }
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
                    detail=f"Network error: {str(e)}"
                )
            except HTTPException as e:
                raise e
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to analyze sequence: {str(e)}"
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze sequence: {str(e)}"
        )
