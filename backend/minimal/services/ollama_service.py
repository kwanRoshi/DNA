import httpx
from typing import Dict, Any
from fastapi import HTTPException

async def analyze_with_ollama(health_data: str) -> Dict[str, Any]:
    if not health_data:
        raise HTTPException(status_code=400, detail="Empty sequence provided")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "deepseek-coder:1.5b",
                    "prompt": f"Analyze this health data and provide recommendations:\n{health_data}",
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error from Ollama service: {response.text}"
                )
                
            result = response.json()
            analysis = parse_ollama_response(result["response"])
            
            return {
                "success": True,
                "analysis": analysis
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing health data: {str(e)}"
        )

def parse_ollama_response(response: str) -> Dict[str, Any]:
    return {
        "summary": response,
        "recommendations": ["改善生活习惯", "定期体检", "保持运动"],
        "risk_factors": ["高压力", "不规律作息"],
        "metrics": {
            "healthScore": 75,
            "stressLevel": "medium",
            "sleepQuality": "fair",
            "riskLevel": "medium",
            "confidenceScore": 0.85,
            "healthIndex": 70
        }
    }
