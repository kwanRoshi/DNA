import pytest
from fastapi.testclient import TestClient
from app.main import app
import os
import json
from typing import List, Dict
import httpx
from unittest.mock import patch, AsyncMock, MagicMock

@pytest.fixture
def app_client():
    from app.main import app
    app.dependency_overrides = {}  # Reset any overrides
    return TestClient(app)

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

import pytest_asyncio
from unittest.mock import patch, AsyncMock
from .data.mock_responses import MOCK_HEALTH_RESPONSE, format_mock_response

@pytest.fixture
def mock_response():
    return MOCK_HEALTH_RESPONSE

@pytest.mark.timeout(180)
def test_health_analysis_pipeline(test_data_files, app_client):
    """Test the complete health analysis pipeline with real data."""

    with patch('app.services.ollama_service.httpx.AsyncClient') as mock_ollama_client, \
         patch('app.services.deepseek_service.httpx.AsyncClient') as mock_deepseek_client, \
         patch('app.services.claude_service.httpx.AsyncClient') as mock_claude_client:
        
        # Mock Ollama client
        mock_ollama = AsyncMock()
        mock_ollama.__aenter__.return_value = mock_ollama
        mock_ollama.get.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={"models": [{"name": "deepseek-r1:1.5b"}]})
        )
        mock_ollama.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={
                "response": format_mock_response(mock_response)
            })
        )
        mock_ollama_client.return_value = mock_ollama

        # Mock DeepSeek client
        mock_deepseek = AsyncMock()
        mock_deepseek.__aenter__.return_value = mock_deepseek
        mock_deepseek.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={
                "choices": [{
                    "message": {
                        "content": format_mock_response(mock_response)
                    }
                }]
            })
        )
        mock_deepseek_client.return_value = mock_deepseek

        # Mock Claude client
        mock_claude = AsyncMock()
        mock_claude.__aenter__.return_value = mock_claude
        mock_claude.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={
                "content": [{
                    "text": format_mock_response(mock_response)
                }]
            })
        )
        mock_claude_client.return_value = mock_claude
        
        for file_path in test_data_files:
            with open(file_path, 'rb') as f:
                data = f.read().decode('utf-8')
                response = app_client.post(
                    "/api/analyze",
                    json={"data": data}
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
                
                # Verify Chinese content
                for rec in analysis["recommendations"]:
                    assert any(ord(c) > 127 for c in rec)
                for risk in analysis["risk_factors"]:
                    assert any(ord(c) > 127 for c in risk)

@pytest.mark.timeout(180)
def test_fallback_mechanism(app_client, mock_response):
    """Test the model fallback mechanism with forced failures."""

    with open(os.path.join(os.path.dirname(__file__), "data", "health_data_1.txt"), 'rb') as f:
        test_data = f.read().decode('utf-8')
        
        # Test with Ollama (success)
        with patch('app.services.ollama_service.httpx.AsyncClient') as mock_ollama_client, \
             patch('app.services.deepseek_service.httpx.AsyncClient') as mock_deepseek_client, \
             patch('app.services.claude_service.httpx.AsyncClient') as mock_claude_client:
            
            # Mock Ollama client
            mock_ollama = AsyncMock()
            mock_ollama.__aenter__.return_value = mock_ollama
            mock_ollama.get.return_value = AsyncMock(
                status_code=200,
                json=AsyncMock(return_value={"models": [{"name": "deepseek-r1:1.5b"}]})
            )
            mock_ollama.post.return_value = AsyncMock(
                status_code=200,
                json=AsyncMock(return_value={"response": mock_response})
            )
            mock_ollama_client.return_value = mock_ollama

            # Mock DeepSeek client
            mock_deepseek = AsyncMock()
            mock_deepseek.__aenter__.return_value = mock_deepseek
            mock_deepseek.post.return_value = AsyncMock(
                status_code=200,
                json=AsyncMock(return_value={"choices": [{"message": {"content": mock_response}}]})
            )
            mock_deepseek_client.return_value = mock_deepseek

            # Mock Claude client
            mock_claude = AsyncMock()
            mock_claude.__aenter__.return_value = mock_claude
            mock_claude.post.return_value = AsyncMock(
                status_code=200,
                json=AsyncMock(return_value={"content": [{"text": mock_response}]})
            )
            mock_claude_client.return_value = mock_claude
            
            response = app_client.post(
                "/api/analyze",
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
        with patch('httpx.AsyncClient', new_callable=AsyncMock) as mock_client:
            mock_get = AsyncMock()
            mock_get.status_code = 200
            mock_get.json = AsyncMock()
            mock_get.json.return_value = {"models": [{"name": "deepseek-r1:1.5b"}]}
            
            mock_post = AsyncMock()
            mock_post.status_code = 200
            mock_post.json = AsyncMock()
            mock_post.json.return_value = mock_response
            
            mock_client_instance = AsyncMock()
            mock_client.return_value = mock_client_instance
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.get = AsyncMock(return_value=mock_get)
            mock_client_instance.post = AsyncMock(return_value=mock_post)
            
            response = app_client.post(
                "/api/analyze",
                json={"data": test_data}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["provider"] == "deepseek"
            validate_health_metrics(data["analysis"]["metrics"])
