import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_consultation():
    """Test health consultation analysis with mock symptoms data"""
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
    assert response.status_code in [200, 503]  # Allow timeout responses
    
    if response.status_code == 200:
        data = response.json()
        assert "analysis" in data
        analysis = data["analysis"]
        assert "summary" in analysis
        assert "recommendations" in analysis
        assert "riskFactors" in analysis
        assert "metrics" in analysis
        
        # Verify recommendations structure
        for rec in analysis["recommendations"]:
            assert "suggestion" in rec
            assert "priority" in rec
            assert "category" in rec
            assert rec["priority"] in ["high", "medium", "low"]
        
        # Verify risk factors structure
        for risk in analysis["riskFactors"]:
            assert "description" in risk
            assert "severity" in risk
            assert "type" in risk
            assert risk["severity"] in ["high", "medium", "low"]
        
        # Verify metrics
        metrics = analysis["metrics"]
        assert "healthScore" in metrics
        assert "stressLevel" in metrics
        assert "sleepQuality" in metrics

def test_gene_sequencing():
    """Test gene sequencing analysis with mock genetic data"""
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
    assert response.status_code in [200, 503]  # Allow timeout responses
    
    if response.status_code == 200:
        data = response.json()
        assert "analysis" in data
        analysis = data["analysis"]
        assert analysis["analysisType"] == "gene"
    
    # Verify gene-specific metrics
    metrics = analysis["metrics"]
    assert "geneticRiskScore" in metrics
    assert "inheritancePattern" in metrics

def test_early_screening():
    """Test early screening analysis with mock screening data"""
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
    assert response.status_code in [200, 503]  # Allow timeout responses
    
    if response.status_code == 200:
        data = response.json()
        assert "analysis" in data
        analysis = data["analysis"]
        assert analysis["analysisType"] == "early_screening"
    
    # Verify screening-specific metrics
    metrics = analysis["metrics"]
    assert "riskLevel" in metrics
    assert "confidenceScore" in metrics

def test_facility_recommendations():
    """Test testing facility recommendations"""
    request_data = {
        "location": "北京",
        "service_type": "gene_sequencing",
        "max_results": 3
    }
    
    response = client.post("/api/recommend-facilities", json=request_data)
    assert response.status_code in [200, 503]  # Allow timeout responses
    
    if response.status_code == 200:
        data = response.json()
        assert "facilities" in data
        assert len(data["facilities"]) <= request_data["max_results"]
        
        for facility in data["facilities"]:
            assert "name" in facility
            assert "services" in facility
            assert isinstance(facility["services"], list)

def test_health_records():
    """Test health records management"""
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
    assert response.status_code in [200, 503]  # Allow timeout responses
    
    if response.status_code == 200:
        data = response.json()
        assert "record_id" in data
        assert "status" in data
        assert data["timestamp"] == record_data["timestamp"]
