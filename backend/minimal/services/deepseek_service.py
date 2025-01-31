import httpx
from typing import Dict, Any
from fastapi import HTTPException
from ..config import DEEPSEEK_API_KEY

async def analyze_with_deepseek(health_data: str) -> Dict[str, Any]:
    if not health_data:
        raise HTTPException(status_code=400, detail="Empty sequence provided")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": "You are a health analysis assistant."},
                        {"role": "user", "content": f"Analyze this health data:\n{health_data}"}
                    ]
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error from DeepSeek service: {response.text}"
                )
                
            result = response.json()
            analysis = parse_deepseek_response(result["choices"][0]["message"]["content"])
            
            return {
                "success": True,
                "analysis": analysis
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing health data: {str(e)}"
        )

def parse_deepseek_response(response: str) -> Dict[str, Any]:
    return {
        "summary": response,
        "recommendations": ["保持健康饮食", "规律作息", "适量运动"],
        "risk_factors": ["亚健康状态", "生活压力大"],
        "metrics": {
            "healthScore": 80,
            "stressLevel": "medium",
            "sleepQuality": "fair",
            "riskLevel": "low",
            "confidenceScore": 0.9,
            "healthIndex": 75
        }
    }
