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
    mock_client.post.return_value.json.return_value = {
        "success": True,
        "analysis": {
            "summary": "健康状况总体良好，但存在一些需要关注的问题。",
            "recommendations": [
                "增加运动量，每周至少进行3次中等强度运动",
                "改善作息习惯，保证充足睡眠",
                "适当调整工作节奏，注意劳逸结合"
            ],
            "risk_factors": [
                "睡眠质量不佳可能影响身体恢复",
                "工作压力较大导致精神紧张"
            ],
            "metrics": {
                "healthScore": 75,
                "stressLevel": "medium",
                "sleepQuality": "fair",
                "riskLevel": "medium",
                "confidenceScore": 0.85,
                "healthIndex": 80
            }
        },
        "model": "deepseek-coder:1.5b",
        "provider": "ollama"
    }
    return mock_client

@pytest.fixture
def mock_ollama_response():
    return {
        "success": True,
        "analysis": {
            "summary": "健康状况总体良好，但存在一些需要关注的问题。",
            "recommendations": [
                "增加运动量，每周至少进行3次中等强度运动",
                "改善作息习惯，保证充足睡眠",
                "适当调整工作节奏，注意劳逸结合"
            ],
            "risk_factors": [
                "睡眠质量不佳可能影响身体恢复",
                "工作压力较大导致精神紧张"
            ],
            "metrics": {
                "healthScore": 75,
                "stressLevel": "medium",
                "sleepQuality": "fair",
                "riskLevel": "medium",
                "confidenceScore": 0.85,
                "healthIndex": 80
            }
        },
        "model": "deepseek-coder:1.5b",
        "provider": "ollama"
    }

@pytest.fixture
def mock_deepseek_api_response():
    return {
        "success": True,
        "analysis": {
            "summary": "健康状况总体良好，但存在一些需要关注的问题。",
            "recommendations": [
                "增加运动量，每周至少进行3次中等强度运动",
                "改善作息习惯，保证充足睡眠",
                "适当调整工作节奏，注意劳逸结合"
            ],
            "risk_factors": [
                "睡眠质量不佳可能影响身体恢复",
                "工作压力较大导致精神紧张"
            ],
            "metrics": {
                "healthScore": 75,
                "stressLevel": "medium",
                "sleepQuality": "fair",
                "riskLevel": "medium",
                "confidenceScore": 0.85,
                "healthIndex": 80
            }
        },
        "model": "deepseek-chat",
        "provider": "deepseek"
    }

@pytest.fixture
def mock_claude_api_response():
    return {
        "success": True,
        "analysis": {
            "summary": "基因分析结果显示健康状况良好。",
            "recommendations": [
                "保持均衡饮食",
                "规律运动",
                "定期体检"
            ],
            "risk_factors": [
                "需要进一步检查以确定具体风险",
                "可能存在潜在健康隐患"
            ],
            "metrics": {
                "healthScore": 75,
                "stressLevel": "medium",
                "sleepQuality": "fair",
                "riskLevel": "medium",
                "confidenceScore": 0.85,
                "healthIndex": 80
            }
        },
        "model": "claude-3-opus-20240229",
        "provider": "claude"
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
async def test_health_consultation(mock_ollama_response, mock_deepseek_api_response, mock_claude_api_response, async_client):
    """Test health consultation functionality with mock data"""
    test_sequence = """
    主要症状：
    1. 经常感到疲劳，尤其是下午时段
    2. 夜间睡眠质量差，经常醒来
    3. 轻度头痛，持续一周
    4. 食欲略有下降
    
    其他信息：
    - 工作压力较大
    - 运动较少
    - 饮食不规律
    """
    
    # Test with default provider priority (should use Ollama first)
    mock_data = {
        "sequence": test_sequence,
        "analysis_type": "health",
        "include_recommendations": True,
        "include_risk_factors": True,
        "include_metrics": True
    }
    
    response = await async_client.post("/api/analyze", json=mock_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "success" in data
    assert data["success"] is True
    assert "analysis" in data
    analysis = data["analysis"]
    
    # Verify consistent response format
    assert "summary" in analysis
    assert "recommendations" in analysis
    assert "risk_factors" in analysis
    assert "metrics" in analysis
    
    # Verify recommendations
    assert isinstance(analysis["recommendations"], list)
    assert len(analysis["recommendations"]) >= 3
    assert all(isinstance(r, str) for r in analysis["recommendations"])
    
    # Verify risk factors
    assert isinstance(analysis["risk_factors"], list)
    assert len(analysis["risk_factors"]) >= 2
    assert all(isinstance(r, str) for r in analysis["risk_factors"])
    
    # Verify metrics
    metrics = analysis["metrics"]
    assert isinstance(metrics["healthScore"], (int, float))
    assert isinstance(metrics["stressLevel"], str)
    assert isinstance(metrics["sleepQuality"], str)
    assert isinstance(metrics["riskLevel"], str)
    assert isinstance(metrics["confidenceScore"], (int, float))
    assert isinstance(metrics["healthIndex"], (int, float))

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_gene_sequencing(mock_ollama_response, mock_deepseek_api_response, mock_claude_api_response, async_client):
    """Test gene sequencing functionality with mock data"""
    test_sequence = """
    基因检测结果：
    1. BRCA1基因：未发现已知致病变异
    2. MTHFR基因：存在C677T多态性
    3. ApoE基因：E3/E3基因型
    4. ACE基因：D/D基因型
    
    分析说明：
    - 遗传性乳腺癌风险：低
    - 叶酸代谢：效率略低
    - 心血管相关：需要关注
    """
    
    # Test with each provider
    providers = ["ollama", "deepseek", "claude"]
    for provider in providers:
        mock_data = {
            "sequence": test_sequence,
            "analysis_type": "gene",
            "provider": provider
        }
        
        response = await async_client.post("/api/analyze", json=mock_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["provider"] == provider
        assert "analysis" in data
        analysis = data["analysis"]
        
        # Verify consistent response format
        assert isinstance(analysis["summary"], str)
        assert isinstance(analysis["recommendations"], list)
        assert isinstance(analysis["risk_factors"], list)
        assert isinstance(analysis["metrics"], dict)
        
        # Verify content requirements
        assert len(analysis["recommendations"]) >= 3
        assert len(analysis["risk_factors"]) >= 2
        assert all(isinstance(r, str) for r in analysis["recommendations"])
        assert all(isinstance(r, str) for r in analysis["risk_factors"])
        
        # Verify metrics structure
        metrics = analysis["metrics"]
        assert isinstance(metrics["healthScore"], (int, float))
        assert isinstance(metrics["stressLevel"], str)
        assert isinstance(metrics["riskLevel"], str)
        assert isinstance(metrics["confidenceScore"], (int, float))
        assert isinstance(metrics["healthIndex"], (int, float))
        
    # Test fallback behavior
    mock_ollama_response.side_effect = Exception("Ollama error")
    response = await async_client.post("/api/analyze", json={"sequence": test_sequence, "analysis_type": "gene"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] in ["deepseek", "claude"]

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_early_screening(mock_ollama_response, mock_deepseek_api_response, mock_claude_api_response, async_client):
    """Test early screening analysis with mock screening data"""
    test_sequence = """
    筛查数据：
    1. 血压：135/85 mmHg
    2. 空腹血糖：5.8 mmol/L
    3. 总胆固醇：5.2 mmol/L
    4. 体重指数：26.5
    
    生活习惯：
    - 每周运动2-3次
    - 偶尔饮酒
    - 不吸烟
    """
    
    # Test with each provider
    providers = ["ollama", "deepseek", "claude"]
    for provider in providers:
        mock_data = {
            "sequence": test_sequence,
            "analysis_type": "early_screening",
            "provider": provider
        }
        
        response = await async_client.post("/api/analyze", json=mock_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["provider"] == provider
        assert "analysis" in data
        analysis = data["analysis"]
        
        # Verify consistent response format
        assert isinstance(analysis["summary"], str)
        assert isinstance(analysis["recommendations"], list)
        assert isinstance(analysis["risk_factors"], list)
        assert isinstance(analysis["metrics"], dict)
        
        # Verify content requirements
        assert len(analysis["recommendations"]) >= 3
        assert len(analysis["risk_factors"]) >= 2
        assert all(isinstance(r, str) for r in analysis["recommendations"])
        assert all(isinstance(r, str) for r in analysis["risk_factors"])
        
        # Verify metrics structure
        metrics = analysis["metrics"]
        assert isinstance(metrics["healthScore"], (int, float))
        assert isinstance(metrics["stressLevel"], str)
        assert isinstance(metrics["riskLevel"], str)
        assert isinstance(metrics["confidenceScore"], (int, float))
        assert isinstance(metrics["healthIndex"], (int, float))
        
    # Test fallback behavior
    mock_ollama_response.side_effect = Exception("Ollama error")
    response = await async_client.post("/api/analyze", json={"sequence": test_sequence, "analysis_type": "early_screening"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] in ["deepseek", "claude"]

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
async def test_health_records(mock_ollama_response, mock_deepseek_api_response, mock_claude_api_response, async_client):
    """Test health records management with comprehensive data verification"""
    test_data = {
        "user_id": "test_user",
        "record_type": "consultation",
        "data": {
            "symptoms": ["疲劳", "头痛", "食欲不振"],
            "duration": "1周",
            "severity": "中度"
        },
        "timestamp": "2024-03-15T10:00:00Z"
    }
    
    # Test with each provider
    providers = ["ollama", "deepseek", "claude"]
    for provider in providers:
        test_data["provider"] = provider
        response = await async_client.post("/api/health-records", json=test_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["provider"] == provider
        assert "analysis" in data
        analysis = data["analysis"]
        
        # Verify consistent response format
        assert isinstance(analysis["summary"], str)
        assert isinstance(analysis["recommendations"], list)
        assert isinstance(analysis["risk_factors"], list)
        assert isinstance(analysis["metrics"], dict)
        
        # Verify content requirements
        assert len(analysis["recommendations"]) >= 3
        assert len(analysis["risk_factors"]) >= 2
        assert all(isinstance(r, str) for r in analysis["recommendations"])
        assert all(isinstance(r, str) for r in analysis["risk_factors"])
        
        # Verify metrics structure
        metrics = analysis["metrics"]
        assert isinstance(metrics["healthScore"], (int, float))
        assert isinstance(metrics["stressLevel"], str)
        assert isinstance(metrics["riskLevel"], str)
        assert isinstance(metrics["confidenceScore"], (int, float))
        assert isinstance(metrics["healthIndex"], (int, float))
        
    # Test fallback behavior
    mock_ollama_response.side_effect = Exception("Ollama error")
    response = await async_client.post("/api/health-records", json={"user_id": "test_user", "record_type": "consultation"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] in ["deepseek", "claude"]

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_personal_ai_assistant(mock_ollama_response, mock_deepseek_api_response, mock_claude_api_response, async_client):
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
    
    # Test consultation with each provider
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
    
    providers = ["ollama", "deepseek", "claude"]
    for provider in providers:
        screening_data["provider"] = provider
        response = await async_client.post("/api/ai-assistant/consult", json=screening_data)
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["provider"] == provider
        assert "analysis" in result
        analysis = result["analysis"]
        
        # Verify consistent response format
        assert isinstance(analysis["summary"], str)
        assert isinstance(analysis["recommendations"], list)
        assert isinstance(analysis["risk_factors"], list)
        assert isinstance(analysis["metrics"], dict)
        
        # Verify content requirements
        assert len(analysis["recommendations"]) >= 3
        assert len(analysis["risk_factors"]) >= 2
        assert all(isinstance(r, str) for r in analysis["recommendations"])
        assert all(isinstance(r, str) for r in analysis["risk_factors"])
        
        # Verify metrics structure
        metrics = analysis["metrics"]
        assert isinstance(metrics["healthScore"], (int, float))
        assert isinstance(metrics["stressLevel"], str)
        assert isinstance(metrics["riskLevel"], str)
        assert isinstance(metrics["confidenceScore"], (int, float))
        assert isinstance(metrics["healthIndex"], (int, float))
    
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
    
    # Test fallback behavior
    mock_ollama_response.side_effect = Exception("Ollama error")
    response = await async_client.post("/api/ai-assistant/consult", json={"user_id": "test_user", "consultation_type": "health"})
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    assert result["provider"] in ["deepseek", "claude"]
    
    # Verify consultation history retrieval
    response = await async_client.get("/api/ai-assistant/history/test_user")
    assert response.status_code == 200
    history = response.json()
    assert len(history["consultations"]) > 0
    assert history["consultations"][0]["consultation_type"] == "health"

@pytest.mark.asyncio
@pytest.mark.timeout(ASYNC_TIMEOUT)
async def test_error_scenarios(mock_ollama_response, mock_deepseek_api_response, mock_claude_api_response, async_client):
    """Test various error scenarios and fallback behavior"""
    test_cases = [
        {
            "name": "Empty Sequence",
            "input_data": {"sequence": ""},
            "expected_status": 400,
            "expected_error": "No sequence provided"
        },
        {
            "name": "Invalid Provider",
            "input_data": {"sequence": "测试数据", "provider": "invalid"},
            "expected_status": 400,
            "expected_error": "Invalid provider specified"
        },
        {
            "name": "Missing Required Fields",
            "input_data": {},
            "expected_status": 400,
            "expected_error": "No sequence provided"
        },
        {
            "name": "Provider Fallback Test",
            "input_data": {
                "sequence": "测试数据",
                "provider": "ollama"
            },
            "expected_status": 200,
            "expected_success": True
        }
    ]
    
    # Test each error scenario
    for case in test_cases:
        response = await async_client.post("/api/analyze", json=case["input_data"])
        assert response.status_code == case["expected_status"], f"Failed {case['name']}"
        data = response.json()
        
        if case["expected_status"] == 200:
            assert data["success"] is True, f"Success flag missing in {case['name']}"
            assert "analysis" in data, f"Analysis missing in {case['name']}"
            analysis = data["analysis"]
            assert isinstance(analysis["summary"], str)
            assert isinstance(analysis["recommendations"], list)
            assert isinstance(analysis["risk_factors"], list)
            assert isinstance(analysis["metrics"], dict)
        else:
            assert "error" in data, f"No error message in {case['name']}"
            assert case["expected_error"].lower() in data["error"].lower(), f"Wrong error in {case['name']}"
    
    # Test provider fallback chain
    mock_ollama_response.side_effect = Exception("Ollama error")
    response = await async_client.post("/api/analyze", json={"sequence": "测试数据"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] in ["deepseek", "claude"]  # Should fall back to next available provider
    
    # Test all providers failing
    mock_ollama_response.side_effect = Exception("Ollama error")
    mock_deepseek_api_response.side_effect = Exception("DeepSeek error")
    mock_claude_api_response.side_effect = Exception("Claude error")
    response = await async_client.post("/api/analyze", json={"sequence": "测试数据"})
    assert response.status_code == 500
    data = response.json()
    assert "error" in data
    assert "all analysis providers failed" in data["error"].lower()
