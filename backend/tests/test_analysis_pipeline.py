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

@pytest.mark.timeout(60)
def test_health_analysis_pipeline(test_data_files):
    """Test the complete health analysis pipeline with real data."""
    for file_path in test_data_files:
        with open(file_path, 'rb') as f:
            response = client.post(
                "/api/analysis/analyze",
                files={"file": (os.path.basename(file_path), f, "text/plain")},
                data={"provider": "ollama"}  # Start with local model
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
    with open(os.path.join(os.path.dirname(__file__), "data", "health_data_1.txt"), 'rb') as f:
        # Test with Ollama and DeepSeek
        for provider in ["ollama", "deepseek"]:
            f.seek(0)
            response = client.post(
                "/api/analysis/analyze",
                files={"file": ("health_data_1.txt", f, "text/plain")},
                data={"provider": provider}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["provider"] == provider
            validate_health_metrics(data["analysis"]["metrics"])
            
            # Verify Chinese content
            analysis = data["analysis"]
            assert any(ord(c) > 127 for c in analysis["summary"])
            for rec in analysis["recommendations"]:
                assert any(ord(c) > 127 for c in rec)
            for risk in analysis["risk_factors"]:
                assert any(ord(c) > 127 for c in risk)
        
        # Test Claude with invalid API key - should return 400
        f.seek(0)
        response = client.post(
            "/api/analysis/analyze",
            files={"file": ("health_data_1.txt", f, "text/plain")},
            data={"provider": "claude"}
        )
        assert response.status_code == 400
        assert "Claude API key not configured" in response.json()["detail"]
