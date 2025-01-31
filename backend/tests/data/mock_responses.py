from typing import Dict, Union

MOCK_HEALTH_RESPONSE = {
    "success": True,
    "analysis": {
        "summary": "血压正常，血糖在标准范围内，BMI指数正常。",
        "recommendations": [
            "保持健康饮食，规律作息",
            "适量运动，增强体质",
            "定期体检，预防疾病"
        ],
        "risk_factors": [
            "工作压力可能较大",
            "作息时间不规律"
        ],
        "metrics": {
            "healthScore": 85,
            "stressLevel": "medium",
            "sleepQuality": "good",
            "riskLevel": "low",
            "confidenceScore": 0.92,
            "healthIndex": 88
        }
    }
}

def format_mock_response(data: Union[Dict, str]) -> Dict:
    if isinstance(data, str):
        return MOCK_HEALTH_RESPONSE
    return data
