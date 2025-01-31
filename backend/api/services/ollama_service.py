import httpx
import asyncio
import json
import re
from typing import Dict, Any, Optional
from .. import config
from fastapi import HTTPException

async def analyze_with_ollama(sequence: str, analysis_type: str = "health") -> Dict[str, Any]:
    if not sequence or not sequence.strip():
        raise HTTPException(status_code=400, detail="Empty sequence provided")
        
    try:
        async with httpx.AsyncClient(base_url=config.OLLAMA_API_BASE, timeout=config.OLLAMA_TIMEOUT_SECONDS) as client:
            # First verify model is available
            response = await client.get("/api/tags")
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to get available models")
                
            models = response.json().get("models", [])
            model_name = next((m["name"] for m in models if "deepseek" in m["name"].lower()), None)
            if not model_name:
                raise HTTPException(status_code=500, detail="DeepSeek model not found in Ollama")
                
            system_prompt = f"""你是一位专业的{analysis_type}分析AI助手。请仔细分析以下健康数据，并提供详细的分析结果。
请严格按照以下格式输出分析结果：

总结：
请详细描述患者的整体健康状况，包括主要健康问题和潜在风险。分析血压、血糖、胆固醇等指标的异常情况，以及生活习惯对健康的影响。

建议：
- 针对血压、血糖等指标的具体改善建议
- 生活方式的调整建议（饮食、运动、作息等）
- 需要进一步检查或就医的建议

风险因素：
- 列出当前存在的主要健康风险（如心血管疾病风险、代谢综合征风险等）
- 分析生活习惯带来的潜在健康威胁

请确保使用中文回复，提供具体、可操作的建议。对异常指标进行重点分析，并给出针对性的改善方案。"""
            
            # Use the found model name
            response = await client.post("/api/generate", json={
                "model": model_name,
                "prompt": f"{system_prompt}\n\n分析数据：{sequence}",
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "top_p": 0.95
                }
            })
            
            if response.status_code != 200:
                error_detail = response.json() if response.content else "No error details available"
                raise HTTPException(status_code=500, detail=f"Ollama API error: {response.status_code} - {error_detail}")
                
            result = response.json()
            if not result.get("response"):
                raise HTTPException(status_code=500, detail="Empty response from Ollama model")
                
            response_text = result.get("response", "")
            if not response_text or not any(indicator in sequence for indicator in ["血压", "血糖", "BMI", "胆固醇"]):
                raise HTTPException(status_code=500, detail="Error processing health data: No valid health indicators found")
                
            return parse_ollama_response(response_text, analysis_type, model_name, sequence)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama model failed: {str(e)}")

def parse_ollama_response(raw_response: str, analysis_type: str, model_name: str, input_data: str = "") -> Dict[str, Any]:
    try:
        sections = raw_response.split("\n\n")
        summary = []
        recommendations = []
        risk_factors = []
        current_section = None
        
        # First pass: extract medical values for context
        bp_high = False
        glucose_high = False
        chol_high = False
        bmi_high = False
        sleep_poor = False
        stress_high = False
        
        if "血压：" in input_data:
            bp_match = re.search(r'血压：(\d+)/(\d+)', input_data)
            if bp_match and float(bp_match.group(1)) >= 140:
                bp_high = True
            
        if "血糖：" in input_data:
            glucose_match = re.search(r'血糖：(\d+\.?\d*)', input_data)
            if glucose_match and float(glucose_match.group(1)) >= 7.0:
                glucose_high = True
                
        if "胆固醇：" in input_data:
            chol_match = re.search(r'胆固醇：(\d+\.?\d*)', input_data)
            if chol_match and float(chol_match.group(1)) >= 5.2:
                chol_high = True
                
        if "BMI" in input_data:
            bmi_match = re.search(r'BMI[：:]\s*(\d+\.?\d*)', input_data)
            if bmi_match and float(bmi_match.group(1)) >= 25.0:
                bmi_high = True
                
        if any(term in input_data for term in ["睡眠质量差", "失眠", "睡眠不足"]):
            sleep_poor = True
            
        if any(term in input_data for term in ["压力大", "焦虑", "紧张", "疲劳"]):
            stress_high = True

        # First pass: structured section extraction
        for section in sections:
            section = section.strip()
            if not section:
                continue
                
            if "总结" in section:
                current_section = "summary"
                content = section.replace("总结：", "").replace("总结:", "").strip()
                if content:
                    summary.append(content)
            elif "建议" in section:
                current_section = "recommendations"
                lines = section.split("\n")
                for line in lines:
                    if line.strip().startswith("-"):
                        content = line.strip("- ").strip()
                        if content:
                            recommendations.append(content)
            elif "风险因素" in section:
                current_section = "risks"
                lines = section.split("\n")
                for line in lines:
                    if line.strip().startswith("-"):
                        content = line.strip("- ").strip()
                        if content:
                            risk_factors.append(content)
            elif current_section == "summary":
                summary.append(section)
                
        # Generate specific recommendations if none were found
        if not recommendations:
            if bp_high:
                recommendations.append("建议控制血压：减少盐分摄入，规律运动，必要时遵医嘱服用降压药")
            if glucose_high:
                recommendations.append("建议控制血糖：调整饮食结构，增加运动，定期监测血糖水平")
            if chol_high:
                recommendations.append("建议控制胆固醇：减少高脂食物摄入，增加膳食纤维，保持运动习惯")
            if bmi_high:
                recommendations.append("建议控制体重：合理饮食，规律运动，逐步达到健康体重")
            if sleep_poor:
                recommendations.append("改善睡眠质量：保持规律作息，睡前避免剧烈运动和使用电子设备")
            if stress_high:
                recommendations.append("缓解压力：适当运动，学习放松技巧，必要时寻求心理咨询")
            
        # Generate specific risk factors if none were found
        if not risk_factors:
            if bp_high or glucose_high or chol_high:
                risk_factors.append("存在心血管疾病风险：高血压、血糖异常和高胆固醇会增加心血管疾病风险")
            if glucose_high:
                risk_factors.append("存在糖尿病风险：需要进一步检查和干预")
            if bmi_high:
                risk_factors.append("肥胖相关健康风险：可能增加多种慢性病的发病风险")
            if sleep_poor or stress_high:
                risk_factors.append("亚健康风险：长期的睡眠问题和压力可能导致身心健康问题")

        # Second pass: extract from unstructured text if needed
        if len(recommendations) < 3 or len(risk_factors) < 2:
            for line in raw_response.split("\n"):
                line = line.strip()
                if not line:
                    continue
                if line.startswith(("-", "*", "1.", "2.", "3.")):
                    content = line.strip("- ").strip("*").strip("1234567890.").strip()
                    if any(kw in content for kw in ["建议", "推荐", "应该", "需要"]) and len(recommendations) < 3:
                        recommendations.append(content)
                    elif any(kw in content for kw in ["风险", "问题", "危险"]) and len(risk_factors) < 2:
                        risk_factors.append(content)
                
        # Ensure minimum recommendations and risk factors
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
    
        # Calculate dynamic metrics based on analysis content
        health_indicators = {
            "high_risk": ["高血压", "高血糖", "肥胖", "吸烟", "过度疲劳", "血压偏高", "血糖偏高", "胆固醇偏高", "超重", "心血管", "糖尿病"],
            "sleep_issues": ["睡眠不足", "失眠", "睡眠质量差", "睡眠时间不足", "深夜"],
            "stress_indicators": ["压力", "焦虑", "紧张", "疲劳", "工作压力", "加班", "不规律"]
        }
        
        # Analyze full text and raw input for health indicators
        full_text = " ".join([input_data] + summary + recommendations + risk_factors)
        
        # Define medical thresholds
        thresholds = {
            "blood_pressure_high": 140,  # systolic
            "blood_glucose_high": 7.0,   # mmol/L
            "cholesterol_high": 5.2,     # mmol/L
            "bmi_overweight": 25.0,
            "bmi_obese": 30.0
        }
        
        # Extract numerical values from data
        bp_match = re.search(r'血压：(\d+)/(\d+)', full_text)
        glucose_match = re.search(r'血糖：(\d+\.?\d*)', full_text)
        chol_match = re.search(r'胆固醇：(\d+\.?\d*)', full_text)
        bmi_match = re.search(r'BMI[：:]\s*(\d+\.?\d*)', full_text)
        
        # Calculate risk score based on multiple factors
        risk_score = 0
    
        # Add risks from numerical values
        if bp_match and float(bp_match.group(1)) >= thresholds["blood_pressure_high"]:
            risk_score += 2
        if glucose_match and float(glucose_match.group(1)) >= thresholds["blood_glucose_high"]:
            risk_score += 2
        if chol_match and float(chol_match.group(1)) >= thresholds["cholesterol_high"]:
            risk_score += 1.5
        if bmi_match:
            bmi = float(bmi_match.group(1))
            if bmi >= thresholds["bmi_obese"]:
                risk_score += 2
            elif bmi >= thresholds["bmi_overweight"]:
                risk_score += 1
        
        # Add risks from text indicators
        risk_score += sum(1 for r in risk_factors if any(i in r for i in health_indicators["high_risk"]))
        risk_score += sum(0.5 for i in health_indicators["high_risk"] if i in full_text)
        
        # Calculate sleep and stress scores
        sleep_issues = sum(1 for i in health_indicators["sleep_issues"] if i in full_text)
        stress_level = sum(1 for i in health_indicators["stress_indicators"] if i in full_text)
        
        # Calculate base health score
        health_score = 100
        health_score -= min(50, risk_score * 7)    # High risk factors have major impact
        health_score -= min(20, sleep_issues * 6)  # Sleep issues impact
        health_score -= min(20, stress_level * 5)  # Stress impact
        health_score = max(30, health_score)       # Ensure minimum score
        
        # Calculate confidence based on response completeness
        confidence_score = 0.95 if len(summary) > 0 and len(recommendations) >= 3 and len(risk_factors) >= 2 else 0.85
        confidence_score -= 0.1 if len(summary) == 0 else 0
        confidence_score -= 0.1 if len(recommendations) < 2 else 0
        confidence_score = max(0.6, confidence_score)
        
        metrics = {
            "healthScore": round(health_score),
            "stressLevel": "high" if stress_level >= 3 else "medium" if stress_level >= 1 else "low",
            "sleepQuality": "poor" if sleep_issues >= 2 else "fair" if sleep_issues >= 1 else "good",
            "riskLevel": "high" if risk_score >= 4 else "medium" if risk_score >= 2 else "low",
            "confidenceScore": round(confidence_score, 2),
            "healthIndex": round(max(30, health_score - (100 - confidence_score * 100) / 5))
        }

        return {
            "success": True,
            "analysis": {
                "summary": " ".join(summary) or "无法生成分析总结",
                "recommendations": recommendations,
                "risk_factors": risk_factors,
                "metrics": metrics,
                "analysisType": analysis_type
            },
            "model": model_name,
            "provider": "ollama"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing health data: {str(e)}"
        )
