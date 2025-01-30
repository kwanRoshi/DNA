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

async def analyze_sequence(
    sequence: str,
    provider: str = "deepseek",
    analysis_type: str = "health",
    include_recommendations: bool = True,
    include_risk_factors: bool = True,
    include_metrics: bool = True
) -> dict:
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

async def analyze_with_deepseek(
    sequence: str,
    analysis_type: str = "health",
    include_recommendations: bool = True,
    include_risk_factors: bool = True,
    include_metrics: bool = True
) -> dict:
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
    
    system_prompts = {
        "health": "你是一位专业的健康顾问AI助手。请分析健康数据并提供详细的健康建议，包括：1) 健康状况总结，2) 潜在风险因素，3) 改善建议。请确保回复包含明确的总结、风险因素和建议部分。",
        "gene": "你是一位基因测序专家AI助手。请分析基因数据并提供专业见解，包括：1) 基因特征分析，2) 遗传风险评估，3) 健康建议。请确保回复包含基因分析总结、风险评估和建议部分。",
        "early_screening": "你是一位疾病筛查专家AI助手。请分析数据并进行早期疾病风险评估，包括：1) 筛查结果总结，2) 风险等级评估，3) 预防建议。请确保回复包含筛查总结、风险评估和预防建议部分。"
    }

    analysis_prompts = {
        "health": f"请分析以下健康数据，提供健康状况评估和改善建议：\n{sequence[:1000]}",
        "gene": f"请分析以下基因序列数据，识别关键特征和潜在健康影响：\n{sequence[:1000]}",
        "early_screening": f"请对以下数据进行分析，进行早期疾病风险筛查：\n{sequence[:1000]}"
    }

    data = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": system_prompts.get(analysis_type, system_prompts["health"])
            },
            {
                "role": "user",
                "content": analysis_prompts.get(analysis_type, analysis_prompts["health"])
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
                
                from .utils import (
                    determine_priority, determine_category, determine_severity,
                    determine_risk_type, extract_health_score, extract_stress_level,
                    extract_sleep_quality, extract_genetic_risk, extract_inheritance_pattern,
                    extract_risk_level, extract_confidence_score
                )

                analysis_text = result["choices"][0]["message"]["content"]
                sections = analysis_text.split("\n\n")
                summary = ""
                recommendations = []
                risk_factors = []
                
                for section in sections:
                    if "总结:" in section or "Summary:" in section:
                        summary = section.replace("总结:", "").replace("Summary:", "").strip()
                    elif "风险因素:" in section or "Risk Factors:" in section:
                        risks = section.replace("风险因素:", "").replace("Risk Factors:", "").strip().split("\n")
                        for risk in risks:
                            if risk.strip():
                                risk_text = risk.strip("- ")
                                risk_factors.append({
                                    "description": risk_text,
                                    "severity": determine_severity(risk_text),
                                    "type": determine_risk_type(risk_text)
                                })
                    elif "建议:" in section or "Recommendations:" in section:
                        recs = section.replace("建议:", "").replace("Recommendations:", "").strip().split("\n")
                        for rec in recs:
                            if rec.strip():
                                rec_text = rec.strip("- ")
                                recommendations.append({
                                    "suggestion": rec_text,
                                    "priority": determine_priority(rec_text),
                                    "category": determine_category(rec_text)
                                })

                metrics = {
                    "healthScore": extract_health_score(analysis_text),
                    "stressLevel": extract_stress_level(analysis_text),
                    "sleepQuality": extract_sleep_quality(analysis_text)
                }

                if analysis_type == "gene":
                    metrics.update({
                        "geneticRiskScore": extract_genetic_risk(analysis_text),
                        "inheritancePattern": extract_inheritance_pattern(analysis_text)
                    })
                elif analysis_type == "early_screening":
                    metrics.update({
                        "riskLevel": extract_risk_level(analysis_text),
                        "confidenceScore": extract_confidence_score(analysis_text)
                    })
                
                return {
                    "success": True,
                    "analysis": {
                        "summary": summary or analysis_text,
                        "recommendations": recommendations or [{"suggestion": "请提供更详细的健康数据以获取具体建议", "priority": "medium", "category": "医疗"}],
                        "riskFactors": risk_factors or [{"description": "无法从提供的数据中确定风险因素", "severity": "low", "type": "未分类"}],
                        "metrics": metrics,
                        "analysisType": analysis_type
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
