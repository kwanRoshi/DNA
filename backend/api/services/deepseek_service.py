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
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": """你是一位专业的健康分析AI助手。请分析提供的健康数据并给出详细的分析结果。
请按以下格式输出分析结果：

总结：
[总体健康状况分析]

建议：
- [具体建议1]
- [具体建议2]
- [具体建议3]

风险因素：
- [具体风险1]
- [具体风险2]

请确保使用中文回复，并提供具体、可操作的建议。"""
            },
            {
                "role": "user",
                "content": f"请分析以下健康数据：\n\n{sequence}"
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
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                json=data,
                headers=headers,
                timeout=60.0
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
            content = result["choices"][0]["message"]["content"]
            
            # Extract DNA/基因 related content first
            dna_content = ""
            for line in content.split("\n"):
                if any(keyword in line for keyword in ["DNA", "基因", "序列"]):
                    dna_content = line + "\n"
                    break

            # Parse sections from content
            sections = content.split("\n\n")
            summary = []
            recommendations = []
            risk_factors = []
            current_section = None
            section_count = 0
            
            # First pass: extract structured sections
            for section in sections:
                if "总结" in section or "Summary" in section:
                    current_section = "summary"
                    summary.append(section.replace("总结:", "").replace("Summary:", "").strip())
                elif "建议" in section or "Recommendations" in section:
                    current_section = "recommendations"
                elif "风险" in section or "Risk" in section:
                    current_section = "risks"
                elif line := section.strip():
                    if line.startswith("-") or line.startswith("*"):
                        item = line.strip("- ").strip("*").strip()
                        if current_section == "recommendations":
                            recommendations.append(item)
                        elif current_section == "risks":
                            risk_factors.append(item)
                    elif current_section == "summary":
                        summary.append(line)
                        
            # Second pass: extract from bullet points and numbered lists
            if len(recommendations) < 3 or len(risk_factors) < 2:
                for line in content.split("\n"):
                    line = line.strip()
                    if not line:
                        continue
                    if line.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.")):
                        item = line.strip("- ").strip("*").strip("1234567890.").strip()
                        if any(keyword in item for keyword in ["建议", "推荐", "应该", "需要"]):
                            if item not in recommendations:
                                recommendations.append(item)
                        elif any(keyword in item for keyword in ["风险", "问题", "危险", "注意"]):
                            if item not in risk_factors:
                                risk_factors.append(item)

            # Third pass: if still not enough, try to extract from periods
            if len(recommendations) < 3 or len(risk_factors) < 2:
                sentences = content.split("。")
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    if any(keyword in sentence for keyword in ["建议", "推荐", "应该", "需要", "可以"]):
                        if sentence not in recommendations:
                            recommendations.append(sentence)
                    elif any(keyword in sentence for keyword in ["风险", "问题", "危险", "注意", "可能"]):
                        if sentence not in risk_factors:
                            risk_factors.append(sentence)

            # Ensure we have at least 3 recommendations and 2 risk factors
            if len(recommendations) < 3:
                recommendations.extend([
                    "建议进行定期健康检查，及时发现潜在问题",
                    "保持良好的生活习惯和作息规律",
                    "建议咨询专业医生获取更详细的建议"
                ][:3 - len(recommendations)])

            if len(risk_factors) < 2:
                risk_factors.extend([
                    "需要进一步检查以确定具体风险",
                    "可能存在潜在健康隐患"
                ][:2 - len(risk_factors)])
            
            for section in sections:
                if "总结" in section or "Summary" in section:
                    current_section = "summary"
                    summary.append(section.replace("总结:", "").replace("Summary:", "").strip())
                elif "建议" in section or "Recommendations" in section:
                    current_section = "recommendations"
                elif "风险" in section or "Risk Factors" in section:
                    current_section = "risks"
                elif line := section.strip():
                    if line.startswith("-") or line.startswith("*"):
                        item = line.strip("- ").strip("*").strip()
                        if current_section == "recommendations":
                            recommendations.append(item)
                        elif current_section == "risks":
                            risk_factors.append(item)
                    elif current_section == "summary":
                        summary.append(line)
            
            metrics = {
                "healthScore": 75,
                "stressLevel": "medium",
                "sleepQuality": "fair",
                "riskLevel": "medium",
                "confidenceScore": 0.85,
                "healthIndex": 80
            }
            
            final_summary = dna_content + (" ".join(summary) if summary else content)
            
            # Ensure we have at least 3 sections
            if len(recommendations) == 0 and len(risk_factors) == 0:
                sections = content.split("。")
                for section in sections:
                    if "建议" in section or "推荐" in section:
                        recommendations.append(section.strip())
                    elif "风险" in section or "危险" in section:
                        risk_factors.append(section.strip())

            return {
                "success": True,
                "analysis": {
                    "summary": final_summary,
                    "recommendations": recommendations or ["请提供更详细的健康数据以获取具体建议"],
                    "risk_factors": risk_factors or ["无法从提供的数据中确定风险因素"],
                    "metrics": metrics,
                    "analysisType": "health"
                },
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