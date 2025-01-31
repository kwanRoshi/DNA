import pytest
import pytest_asyncio
from unittest.mock import patch, AsyncMock, MagicMock
import os
import json
from httpx import AsyncClient, TimeoutException, RequestError
from fastapi import HTTPException
from app.main import app

# Set mock environment variables for testing
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException

# Configure test timeouts
ASYNC_TIMEOUT = 30  # seconds

@pytest_asyncio.fixture
async def mock_httpx_client():
    mock_client = AsyncMock()
    mock_client.post = AsyncMock()
    mock_client.post.return_value = AsyncMock()
    mock_client.post.return_value.status_code = 200
    mock_client.post.return_value.json = AsyncMock()
    mock_client.post.return_value.json.return_value = {"choices": [{"message": {"content": "Test response"}}]}
    return mock_client

@pytest.fixture
def mock_deepseek_api_response():
    return {
        "choices": [{
            "message": {
                "content": """总结: 健康状况总体良好，但存在一些需要关注的问题。

风险因素:
- 睡眠质量不佳可能影响身体恢复
- 工作压力较大导致精神紧张
- 运动量不足影响身体机能

建议:
- 增加运动量，每周至少进行3次中等强度运动
- 改善作息习惯，保证充足睡眠
- 适当调整工作节奏，注意劳逸结合"""
            }
        }]
    }

@pytest.fixture
def mock_claude_api_response():
    return {
        "content": [{
            "text": """基因分析结果总结：
1. 基因特征显示代谢功能正常
2. 无明显遗传性疾病风险
3. 建议定期进行健康检查

详细建议：
- 保持均衡饮食
- 规律运动
- 定期体检"""
        }]
    }

# Using conftest.py for fixtures

@pytest.fixture
def mock_deepseek_response():
    return {
        "analysis": {
            "summary": "根据症状描述，患者可能存在以下健康问题：\n1. 慢性疲劳\n2. 睡眠质量差\n3. 轻度头痛\n4. 可能与工作压力相关的身心症状",
            "recommendations": [
                {"suggestion": "规律作息，保证充足睡眠", "priority": "high", "category": "lifestyle"},
                {"suggestion": "增加适度运动", "priority": "medium", "category": "exercise"},
                {"suggestion": "调整饮食结构", "priority": "medium", "category": "diet"}
            ],
            "risk_factors": [
                {"description": "工作压力过大", "severity": "medium", "type": "psychological"},
                {"description": "运动量不足", "severity": "medium", "type": "lifestyle"}
            ],
            "metrics": {
                "healthScore": 75,
                "stressLevel": "medium",
                "sleepQuality": "poor"
            }
        }
    }

@pytest.fixture
def mock_gene_response():
    return {
        "analysis": {
            "analysisType": "gene",
            "summary": "基因检测结果显示：\n1. BRCA1基因未发现已知致病变异\n2. MTHFR基因存在C677T多态性",
            "recommendations": [
                {"suggestion": "定期进行乳腺检查", "priority": "medium", "category": "screening"},
                {"suggestion": "补充叶酸", "priority": "high", "category": "nutrition"}
            ],
            "risk_factors": [
                {"description": "叶酸代谢效率可能降低", "severity": "medium", "type": "genetic"}
            ],
            "metrics": {
                "geneticRiskScore": "low",
                "inheritancePattern": "complex"
            }
        }
    }

@pytest.fixture
def mock_facility_response():
    return {
        "facilities": [
            {
                "name": "北京协和医院",
                "services": ["gene_sequencing", "health_screening"],
                "location": "北京市东城区帅府园一号",
                "rating": 4.8
            },
            {
                "name": "中国医学科学院肿瘤医院",
                "services": ["gene_sequencing", "cancer_screening"],
                "location": "北京市朝阳区潘家园南里17号",
                "rating": 4.7
            }
        ]
    }

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_health_consultation(mock_deepseek_api, async_client, mock_deepseek_response):
    """Test health consultation functionality with mock data"""
    mock_deepseek_api.return_value = mock_deepseek_response
    
    mock_data = {
        "sequence": """
        主要症状：
        1. 经常感到疲劳，尤其是下午时段
        2. 夜间睡眠质量差，经常醒来
        3. 轻度头痛，持续一周
        4. 食欲略有下降
        
        其他信息：
        - 工作压力较大
        - 运动较少
        - 饮食不规律
        """,
        "provider": "deepseek",
        "analysis_type": "health",
        "include_recommendations": True,
        "include_risk_factors": True,
        "include_metrics": True
    }
    
    response = await async_client.post("/api/analyze", json=mock_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "analysis" in data
    analysis = data["analysis"]
    
    # Verify response fields
    assert "summary" in analysis
    assert "recommendations" in analysis
    assert "risk_factors" in analysis
    assert "metrics" in analysis
    assert len(analysis["recommendations"]) == 3
    assert analysis["recommendations"][0]["priority"] == "high"
    
    assert "risk_factors" in analysis
    assert len(analysis["risk_factors"]) == 2
    assert analysis["risk_factors"][0]["severity"] == "medium"
    
    metrics = analysis["metrics"]
    assert metrics["healthScore"] == 75
    assert metrics["stressLevel"] == "medium"
    assert metrics["sleepQuality"] == "poor"

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_gene_sequencing(mock_deepseek_api, async_client):
    """Test gene sequencing functionality with mock data"""
    mock_deepseek_api.return_value = {
        "analysis": {
            "summary": """基因检测结果分析：
1. BRCA1基因：未发现已知致病变异，乳腺癌风险低
2. MTHFR基因：存在C677T多态性，建议补充叶酸
3. ApoE基因：E3/E3基因型，心血管风险一般
4. ACE基因：D/D基因型，需要关注血压管理""",
            "recommendations": [
                {"suggestion": "定期进行乳腺癌筛查", "priority": "medium", "category": "screening"},
                {"suggestion": "补充叶酸", "priority": "high", "category": "nutrition"},
                {"suggestion": "定期监测血压", "priority": "high", "category": "monitoring"}
            ],
            "risk_factors": [
                {"description": "叶酸代谢效率可能降低", "severity": "medium", "type": "genetic"},
                {"description": "血压相关基因风险", "severity": "medium", "type": "cardiovascular"}
            ],
            "metrics": {
                "geneticRiskScore": 0.25,
                "variantSignificance": "moderate",
                "inheritancePattern": "complex",
                "preventiveMeasuresScore": 0.75
            }
        }
    }
    
    mock_data = {
        "sequence": """
        基因检测结果：
        1. BRCA1基因：未发现已知致病变异
        2. MTHFR基因：存在C677T多态性
        3. ApoE基因：E3/E3基因型
        4. ACE基因：D/D基因型
        
        分析说明：
        - 遗传性乳腺癌风险：低
        - 叶酸代谢：效率略低
        - 心血管相关：需要关注
        """,
        "provider": "deepseek",
        "analysis_type": "gene",
        "include_recommendations": True,
        "include_risk_factors": True,
        "include_metrics": True
    }
    
    response = await async_client.post("/api/analyze", json=mock_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "analysis" in data
    analysis = data["analysis"]
    
    # Verify response structure
    assert "summary" in analysis
    assert "recommendations" in analysis
    assert "risk_factors" in analysis
    assert "metrics" in analysis
    
    # Verify recommendations
    assert len(analysis["recommendations"]) == 3
    assert analysis["recommendations"][0]["category"] == "screening"
    assert analysis["recommendations"][1]["priority"] == "high"
    assert analysis["recommendations"][1]["category"] == "nutrition"
    
    # Verify risk factors
    assert len(analysis["risk_factors"]) == 2
    assert analysis["risk_factors"][0]["type"] == "genetic"
    assert analysis["risk_factors"][1]["type"] == "cardiovascular"
    
    # Verify metrics
    metrics = analysis["metrics"]
    assert isinstance(metrics["geneticRiskScore"], (int, float))
    assert metrics["variantSignificance"] == "moderate"
    assert metrics["inheritancePattern"] == "complex"
    assert isinstance(metrics["preventiveMeasuresScore"], (int, float))

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_early_screening(mock_deepseek_api, async_client, mock_deepseek_response):
    """Test early screening analysis with mock screening data"""
    mock_deepseek_api.return_value = {
        "analysis": {
            "summary": "早期筛查结果分析：\n1. 血压轻度偏高\n2. 血糖处于临界值\n3. 胆固醇略高",
            "recommendations": [
                {"suggestion": "控制饮食，减少盐分摄入", "priority": "high", "category": "diet"},
                {"suggestion": "增加有氧运动频率", "priority": "medium", "category": "exercise"}
            ],
            "risk_factors": [
                {"description": "心血管疾病风险", "severity": "medium", "type": "cardiovascular"},
                {"description": "代谢综合征风险", "severity": "low", "type": "metabolic"}
            ],
            "metrics": {
                "riskLevel": "medium",
                "confidenceScore": 0.85,
                "healthIndex": 78
            }
        }
    }
    
    mock_data = {
        "sequence": """
        筛查数据：
        1. 血压：135/85 mmHg
        2. 空腹血糖：5.8 mmol/L
        3. 总胆固醇：5.2 mmol/L
        4. 体重指数：26.5
        
        生活习惯：
        - 每周运动2-3次
        - 偶尔饮酒
        - 不吸烟
        """,
        "provider": "deepseek",
        "analysis_type": "early_screening",
        "include_recommendations": True,
        "include_risk_factors": True,
        "include_metrics": True
    }
    
    response = await async_client.post("/api/analyze", json=mock_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "analysis" in data
    analysis = data["analysis"]
    
    # Verify response fields
    assert "summary" in analysis
    assert "recommendations" in analysis
    assert "risk_factors" in analysis
    assert "metrics" in analysis
    
    # Verify specific fields
    assert len(analysis["recommendations"]) == 2
    assert analysis["recommendations"][0]["priority"] == "high"
    
    assert len(analysis["risk_factors"]) == 2
    assert analysis["risk_factors"][0]["type"] == "cardiovascular"
    
    metrics = analysis["metrics"]
    assert metrics["riskLevel"] == "medium"
    assert metrics["confidenceScore"] == 0.85
    assert metrics["healthIndex"] == 78

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_facility_recommendations(mock_deepseek_api, async_client, mock_facility_response):
    """Test testing facility recommendations with mock data"""
    request_data = {
        "location": "北京",
        "service_type": "gene_sequencing",
        "max_results": 3
    }
    
    mock_deepseek_api.return_value = mock_facility_response
    response = await async_client.post("/api/recommend-facilities", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "facilities" in data
    facilities = data["facilities"]
    assert len(facilities) == 2
    
    facility = facilities[0]
    assert facility["name"] == "北京协和医院"
    assert "gene_sequencing" in facility["services"]
    assert facility["rating"] == 4.8
    assert "specialties" in facility
    assert "certifications" in facility
    assert "三级甲等医院" in facility["certifications"]

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_health_records(mock_deepseek_api, async_client):
    """Test health records management with comprehensive data verification"""
    mock_response = {
        "success": True,
        "analysis": {
            "summary": "可能存在工作压力导致的身心症状",
            "recommendations": [
                {"suggestion": "调整作息时间", "priority": "high", "category": "lifestyle"},
                {"suggestion": "适当运动放松", "priority": "medium", "category": "exercise"}
            ],
            "risk_factors": [
                {"description": "工作压力过大", "severity": "medium", "type": "psychological"},
                {"description": "睡眠质量差", "severity": "high", "type": "lifestyle"}
            ],
            "metrics": {
                "healthScore": 75,
                "stressLevel": "medium",
                "sleepQuality": "poor"
            }
        }
    }
    
    mock_deepseek_api.return_value = mock_response
    
    record_data = {
        "user_id": "test_user",
        "record_type": "consultation",
        "data": {
            "symptoms": ["疲劳", "头痛", "食欲不振"],
            "duration": "1周",
            "severity": "中度"
        },
        "timestamp": "2024-03-15T10:00:00Z"
    }
    
    response = await async_client.post("/api/health-records", json=record_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "record" in data
    record = data["record"]
    
    # Verify response structure
    assert "success" in data
    assert data["success"] is True
    assert "analysis" in data
    
    # Verify analysis results
    analysis = data["analysis"]
    assert "summary" in analysis
    assert "工作压力" in analysis["summary"]
    
    # Verify recommendations
    assert "recommendations" in analysis
    recommendations = analysis["recommendations"]
    assert len(recommendations) == 2
    assert recommendations[0]["suggestion"] == "调整作息时间"
    assert recommendations[0]["priority"] == "high"
    assert recommendations[0]["category"] == "lifestyle"
    
    # Verify risk factors
    assert "risk_factors" in analysis
    risk_factors = analysis["risk_factors"]
    assert len(risk_factors) == 2
    assert risk_factors[0]["description"] == "工作压力过大"
    assert risk_factors[0]["severity"] == "medium"
    assert risk_factors[0]["type"] == "psychological"
    
    # Verify metrics
    assert "metrics" in analysis
    metrics = analysis["metrics"]
    assert metrics["healthScore"] == 75
    assert metrics["stressLevel"] == "medium"
    assert metrics["sleepQuality"] == "poor"

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_personal_ai_assistant(mock_deepseek_api, async_client):
    """Test personal AI assistant functionality"""
    # Test AI assistant profile setup
    profile_data = {
        "user_id": "test_user",
        "name": "健康助手小智",
        "preferences": {
            "language": "zh",
            "notification_frequency": "daily",
            "focus_areas": ["运动建议", "饮食指导", "睡眠管理"]
        },
        "interaction_history": []
    }
    
    response = await async_client.post("/api/ai-assistant/profile", json=profile_data)
    assert response.status_code == 200
    profile = response.json()
    assert profile["name"] == "健康助手小智"
    assert len(profile["preferences"]["focus_areas"]) == 3
    
    # Test early screening consultation
    screening_data = {
        "user_id": "test_user",
        "consultation_type": "early_screening",
        "data": {
            "血压": "135/85 mmHg",
            "空腹血糖": "5.8 mmol/L",
            "总胆固醇": "5.2 mmol/L",
            "体重指数": "26.5"
        },
        "timestamp": "2024-03-15T14:30:00Z"
    }
    
    mock_deepseek_api.return_value = {
        "success": True,
        "analysis": {
            "summary": "根据您的健康数据分析：",
            "recommendations": [
                {"suggestion": "规律作息，保证7-8小时睡眠", "priority": "high", "category": "lifestyle"},
                {"suggestion": "适量运动，提高身体素质", "priority": "medium", "category": "exercise"}
            ],
            "risk_factors": [
                {"description": "血压轻度偏高", "severity": "medium", "type": "cardiovascular"},
                {"description": "体重指数偏高", "severity": "low", "type": "metabolic"}
            ],
            "metrics": {
                "healthScore": 78,
                "riskLevel": "medium",
                "confidenceScore": 0.85
            }
        }
    }

    response = await async_client.post("/api/ai-assistant/consult", json=screening_data)
    assert response.status_code == 200
    result = response.json()
    assert "consultation_id" in result
    assert "response" in result
    assert "recommendations" in result["response"]
    assert "risk_factors" in result["response"]
    
    # Test facility recommendations
    facility_request = {
        "user_id": "test_user",
        "location": "北京",
        "service_type": "gene_sequencing",
        "max_results": 3
    }
    
    response = await async_client.post("/api/ai-assistant/recommend-facilities", json=facility_request)
    assert response.status_code == 200
    facilities = response.json()
    assert len(facilities["facilities"]) > 0
    assert all("name" in f and "location" in f and "services" in f for f in facilities["facilities"])
    
    # Verify consultation history retrieval
    response = await async_client.get("/api/ai-assistant/history/test_user")
    assert response.status_code == 200
    history = response.json()
    assert len(history["consultations"]) > 0
    assert history["consultations"][0]["consultation_type"] == "health"

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_error_scenarios(mock_deepseek_api, async_client):
    """Test various error scenarios"""
    test_cases = [
        {
            "name": "Empty Sequence",
            "input_data": {"sequence": "", "provider": "deepseek", "analysis_type": "health"},
            "expected_status": 400,
            "expected_error": "No sequence provided"
        },
        {
            "name": "Invalid Analysis Type",
            "input_data": {"sequence": "测试数据", "provider": "deepseek", "analysis_type": "invalid"},
            "expected_status": 400,
            "expected_error": "Invalid analysis type"
        },
        {
            "name": "Missing Required Fields",
            "input_data": {"provider": "deepseek"},
            "expected_status": 400,
            "expected_error": "No sequence provided"
        }
    ]
    
    mock_deepseek_api.side_effect = Exception("Mock API error")
    
    for case in test_cases:
        response = await async_client.post("/api/analyze", json=case["input_data"])
        assert response.status_code == case["expected_status"], f"Failed {case['name']}"
        data = response.json()
        assert "error" in data, f"No error message in {case['name']}"
        assert case["expected_error"].lower() in data["error"].lower(), f"Wrong error in {case['name']}"
