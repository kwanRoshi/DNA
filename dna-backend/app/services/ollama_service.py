import httpx
import asyncio
import json
from typing import Dict, Any, Optional
from .. import config

async def analyze_with_ollama(sequence: str, analysis_type: str = "health") -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(base_url=config.OLLAMA_API_BASE, timeout=config.OLLAMA_TIMEOUT_SECONDS) as client:
            system_prompt = f"你是一位专业的{analysis_type}分析AI助手。请分析以下数据并提供详细的分析结果，包括总结、风险因素和建议。请确保使用中文回复。"
            
            response = await client.post("/api/generate", json={
                "model": config.OLLAMA_MODEL,
                "prompt": f"{system_prompt}\n\n分析数据：{sequence}",
                "stream": False
            })
            
            if response.status_code != 200:
                raise RuntimeError(f"Ollama API error: {response.status_code}")
                
            result = response.json()
            return parse_ollama_response(result.get("response", ""), analysis_type)
    except Exception as e:
        raise RuntimeError(f"Ollama model failed: {str(e)}") from e

def parse_ollama_response(raw_response: str, analysis_type: str) -> Dict[str, Any]:
    lines = raw_response.split("\n")
    current_section = None
    summary = []
    recommendations = []
    risk_factors = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if "总结" in line or "分析结果" in line:
            current_section = "summary"
        elif "建议" in line or "改善建议" in line:
            current_section = "recommendations"
        elif "风险" in line or "风险因素" in line:
            current_section = "risks"
        elif line.startswith("-") or line.startswith("*") or (line[0].isdigit() and "." in line[:3]):
            content = line.strip("- ").strip("*").strip()
            if current_section == "recommendations" and content:
                recommendations.append(content)
            elif current_section == "risks" and content:
                risk_factors.append(content)
        elif current_section == "summary" and not line.startswith("#"):
            summary.append(line)
    
    metrics = {
        "healthScore": 75,
        "stressLevel": "medium",
        "sleepQuality": "fair",
        "riskLevel": "medium",
        "confidenceScore": 0.85
    }
    
    return {
        "success": True,
        "analysis": {
            "summary": " ".join(summary) or "无法生成分析总结",
            "recommendations": recommendations or ["需要更多数据来提供具体建议"],
            "risk_factors": risk_factors or ["无法确定具体风险因素"],
            "metrics": metrics,
            "analysisType": analysis_type
        }
    }
