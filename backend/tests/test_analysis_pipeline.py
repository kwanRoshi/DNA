import pytest
from fastapi.testclient import TestClient
from app.main import app
import os
import json
from typing import List, Dict

client = TestClient(app)

@pytest.fixture
def test_data_files() -> List[str]:
    base_path = os.path.join(os.path.dirname(__file__), "data")
    return [
        os.path.join(base_path, f"health_data_{i}.txt")
        for i in range(1, 4)
    ]

def validate_health_metrics(metrics: Dict) -> None:
    assert isinstance(metrics["healthScore"], (int, float))
    assert 0 <= metrics["healthScore"] <= 100
    assert metrics["stressLevel"] in ["low", "medium", "high"]
    assert metrics["sleepQuality"] in ["poor", "fair", "good"]
    assert metrics["riskLevel"] in ["low", "medium", "high"]
    assert isinstance(metrics["confidenceScore"], (int, float))
    assert 0 <= metrics["confidenceScore"] <= 1
    assert isinstance(metrics["healthIndex"], (int, float))
    assert 0 <= metrics["healthIndex"] <= 100

from unittest.mock import patch, AsyncMock

@pytest.mark.timeout(60)
def test_health_analysis_pipeline(test_data_files):
    """Test the complete health analysis pipeline with real data."""
    mock_response = {
        "response": "分析结果：血压正常，血糖在标准范围内，BMI指数正常。建议：保持健康饮食，规律作息，适量运动。"
    }
    
    with patch('httpx.AsyncClient.post', new_callable=AsyncMock) as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = mock_response
        
        for file_path in test_data_files:
            with open(file_path, 'rb') as f:
                response = client.post(
                    "/analyze",
                    json={"data": f.read().decode('utf-8')},
                    params={"provider": "ollama"}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "analysis" in data
            
            # Verify analysis structure
            analysis = data["analysis"]
            assert "summary" in analysis
            assert "recommendations" in analysis
            assert "risk_factors" in analysis
            assert "metrics" in analysis
            
            # Verify Chinese content
            assert any(ord(c) > 127 for c in analysis["summary"])
            assert len(analysis["recommendations"]) >= 3
            assert len(analysis["risk_factors"]) >= 2
            
            # Verify metrics
            validate_health_metrics(analysis["metrics"])
            
            # Verify provider information
            assert "provider" in data
            assert data["provider"] in ["ollama", "deepseek", "claude"]
            assert "model" in data
            
            # Verify analysis structure
            analysis = data["analysis"]
            assert "summary" in analysis
            assert "recommendations" in analysis
            assert "risk_factors" in analysis
            assert "metrics" in analysis
            
            # Verify Chinese content
            assert any(ord(c) > 127 for c in analysis["summary"])
            for rec in analysis["recommendations"]:
                assert any(ord(c) > 127 for c in rec)
            for risk in analysis["risk_factors"]:
                assert any(ord(c) > 127 for c in risk)
            
            # Verify metrics
            metrics = analysis["metrics"]
            assert isinstance(metrics["healthScore"], (int, float))
            assert isinstance(metrics["confidenceScore"], (int, float))
            assert isinstance(metrics["healthIndex"], (int, float))
            assert metrics["stressLevel"] in ["low", "medium", "high"]
            assert metrics["sleepQuality"] in ["poor", "fair", "good"]
            assert metrics["riskLevel"] in ["low", "medium", "high"]
            
            # Verify provider information
            assert "provider" in data
            assert data["provider"] in ["ollama", "deepseek", "claude"]
            assert "model" in data

@pytest.mark.timeout(60)
def test_fallback_mechanism():
    """Test the model fallback mechanism with forced failures."""
    mock_response = {
        "response": "分析结果：血压正常，血糖在标准范围内，BMI指数正常。建议：保持健康饮食，规律作息，适量运动。"
    }
    
    with open(os.path.join(os.path.dirname(__file__), "data", "health_data_1.txt"), 'rb') as f:
        test_data = f.read().decode('utf-8')
        
        # Test with Ollama (success)
        with patch('httpx.AsyncClient.post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = mock_response
            
            response = client.post(
                "/analyze",
                json={"data": test_data},
                params={"provider": "ollama"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["provider"] == "ollama"
            validate_health_metrics(data["analysis"]["metrics"])
            
            # Verify Chinese content
            analysis = data["analysis"]
            assert any(ord(c) > 127 for c in analysis["summary"])
            for rec in analysis["recommendations"]:
                assert any(ord(c) > 127 for c in rec)
            for risk in analysis["risk_factors"]:
                assert any(ord(c) > 127 for c in risk)
        
        # Test DeepSeek fallback
        with patch('httpx.AsyncClient.post', new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = [
                AsyncMock(status_code=500),  # Ollama fails
                AsyncMock(status_code=200, json=lambda: mock_response)  # DeepSeek succeeds
            ]
            
            response = client.post(
                "/analyze",
                json={"data": test_data}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["provider"] == "deepseek"
            validate_health_metrics(data["analysis"]["metrics"])
