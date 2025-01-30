import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import AsyncMock

client = TestClient(app)

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
            "riskFactors": [
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
            "riskFactors": [
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

@patch('app.services.deepseek_service.analyze_health')
def test_health_consultation(mock_analyze, mock_deepseek_response):
    """Test health consultation analysis with mock symptoms data"""
    mock_analyze.return_value = mock_deepseek_response
    
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
    
    response = client.post("/api/analyze", json=mock_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "analysis" in data
    analysis = data["analysis"]
    
    # Verify response structure matches mock data
    assert analysis == mock_deepseek_response["analysis"]
    
    # Verify specific fields
    assert "summary" in analysis
    assert "recommendations" in analysis
    assert len(analysis["recommendations"]) == 3
    assert analysis["recommendations"][0]["priority"] == "high"
    
    assert "riskFactors" in analysis
    assert len(analysis["riskFactors"]) == 2
    assert analysis["riskFactors"][0]["severity"] == "medium"
    
    metrics = analysis["metrics"]
    assert metrics["healthScore"] == 75
    assert metrics["stressLevel"] == "medium"
    assert metrics["sleepQuality"] == "poor"

@patch('app.services.deepseek_service.analyze_gene')
def test_gene_sequencing(mock_analyze, mock_gene_response):
    """Test gene sequencing analysis with mock genetic data"""
    mock_analyze.return_value = mock_gene_response
    
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
    
    response = client.post("/api/analyze", json=mock_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "analysis" in data
    analysis = data["analysis"]
    
    # Verify response structure matches mock data
    assert analysis == mock_gene_response["analysis"]
    assert analysis["analysisType"] == "gene"
    
    # Verify specific fields
    assert len(analysis["recommendations"]) == 2
    assert analysis["recommendations"][0]["category"] == "screening"
    assert analysis["recommendations"][1]["priority"] == "high"
    
    assert len(analysis["riskFactors"]) == 1
    assert analysis["riskFactors"][0]["type"] == "genetic"
    
    metrics = analysis["metrics"]
    assert metrics["geneticRiskScore"] == "low"
    assert metrics["inheritancePattern"] == "complex"

@patch('app.services.deepseek_service.analyze_screening')
def test_early_screening(mock_analyze):
    """Test early screening analysis with mock screening data"""
    mock_response = {
        "analysis": {
            "analysisType": "early_screening",
            "summary": "早期筛查结果显示：\n1. 血压轻度偏高\n2. 血糖正常范围\n3. 胆固醇轻度偏高",
            "recommendations": [
                {"suggestion": "定期监测血压", "priority": "high", "category": "monitoring"},
                {"suggestion": "调整饮食结构，减少高脂食物摄入", "priority": "medium", "category": "diet"}
            ],
            "riskFactors": [
                {"description": "高血压风险", "severity": "medium", "type": "cardiovascular"},
                {"description": "血脂异常风险", "severity": "low", "type": "metabolic"}
            ],
            "metrics": {
                "riskLevel": "medium",
                "confidenceScore": 0.85,
                "healthIndex": 78
            }
        }
    }
    mock_analyze.return_value = mock_response
    
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
    
    response = client.post("/api/analyze", json=mock_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "analysis" in data
    analysis = data["analysis"]
    
    # Verify response structure matches mock data
    assert analysis == mock_response["analysis"]
    assert analysis["analysisType"] == "early_screening"
    
    # Verify specific fields
    assert len(analysis["recommendations"]) == 2
    assert analysis["recommendations"][0]["priority"] == "high"
    
    assert len(analysis["riskFactors"]) == 2
    assert analysis["riskFactors"][0]["type"] == "cardiovascular"
    
    metrics = analysis["metrics"]
    assert metrics["riskLevel"] == "medium"
    assert metrics["confidenceScore"] == 0.85
    assert metrics["healthIndex"] == 78

@patch('app.services.facility_service.recommend_facilities')
def test_facility_recommendations(mock_recommend, mock_facility_response):
    """Test testing facility recommendations"""
    mock_recommend.return_value = mock_facility_response
    
    request_data = {
        "location": "北京",
        "service_type": "gene_sequencing",
        "max_results": 3
    }
    
    response = client.post("/api/recommend-facilities", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "facilities" in data
    facilities = data["facilities"]
    assert len(facilities) == 2
    
    # Verify specific facility data
    facility = facilities[0]
    assert facility["name"] == "北京协和医院"
    assert "gene_sequencing" in facility["services"]
    assert facility["rating"] == 4.8
    
    facility = facilities[1]
    assert facility["name"] == "中国医学科学院肿瘤医院"
    assert "gene_sequencing" in facility["services"]
    assert facility["rating"] == 4.7

@patch('app.services.record_service.create_health_record')
def test_health_records(mock_create_record):
    """Test health records management"""
    mock_response = {
        "record_id": "hr_123456",
        "status": "created",
        "timestamp": "2024-03-15T10:00:00Z",
        "type": "consultation",
        "data": {
            "symptoms": ["疲劳", "头痛"],
            "duration": "1周",
            "severity": "中度"
        }
    }
    mock_create_record.return_value = mock_response
    
    record_data = {
        "user_id": "test_user",
        "record_type": "consultation",
        "data": {
            "symptoms": ["疲劳", "头痛"],
            "duration": "1周",
            "severity": "中度"
        },
        "timestamp": "2024-03-15T10:00:00Z"
    }
    
    response = client.post("/api/health-records", json=record_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data == mock_response
    assert data["record_id"] == "hr_123456"
    assert data["status"] == "created"
    assert data["type"] == "consultation"
    assert data["timestamp"] == record_data["timestamp"]
    assert data["data"]["symptoms"] == record_data["data"]["symptoms"]
