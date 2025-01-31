import pytest
import asyncio
import os
import json
import httpx
from typing import Dict, List
from pathlib import Path
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
from httpx import AsyncClient

from app.main import app
from app.models.analysis import AnalysisResponse
from app.services.ollama_service import analyze_with_ollama
from app.services.deepseek_service import analyze_with_deepseek
from app.services.claude_service import analyze_with_claude
from app.routers.analysis import process_sequence

from .data.mock_responses import MOCK_HEALTH_RESPONSE, format_mock_response

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

@pytest.mark.timeout(180)
@pytest.mark.asyncio
async def test_health_analysis_pipeline(test_data_files, app_client: AsyncClient, monkeypatch):
    """Test the complete health analysis pipeline with real data."""
    # Set required environment variables
    monkeypatch.setenv("OLLAMA_API_BASE", "http://localhost:11434")
    monkeypatch.setenv("MODEL_FALLBACK_PRIORITY", "ollama,deepseek,claude")
    monkeypatch.setenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
    monkeypatch.setenv("OLLAMA_ENABLED", "true")

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
                },
                "provider": "ollama",
                "model": "deepseek-r1:1.5b"
            })
        )
        mock_ollama_client.return_value = mock_ollama

        # Mock DeepSeek client
        mock_deepseek = AsyncMock()
        mock_deepseek.__aenter__.return_value = mock_deepseek
        mock_deepseek.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={
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
                },
                "provider": "deepseek",
                "model": "deepseek-chat"
            })
        )
        mock_deepseek_client.return_value = mock_deepseek

        # Mock Claude client
        mock_claude = AsyncMock()
        mock_claude.__aenter__.return_value = mock_claude
        mock_claude.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={
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
                },
                "provider": "claude",
                "model": "claude-3-opus-20240229"
            })
        )
        mock_claude_client.return_value = mock_claude
        
        for file_path in test_data_files:
            with open(file_path, 'rb') as f:
                data = f.read().decode('utf-8')
                response = await app_client.post(
                    "/api/analyze",
                    json={"sequence": data}
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
@pytest.mark.asyncio
async def test_fallback_mechanism(app_client: AsyncClient, mock_response, monkeypatch):
    """Test the model fallback mechanism with forced failures."""
    
    # Set required environment variables
    monkeypatch.setenv("CLAUDE_API_KEY", "test-key")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.setenv("OLLAMA_API_BASE", "http://localhost:11434")
    monkeypatch.setenv("MODEL_FALLBACK_PRIORITY", "ollama,deepseek,claude")
    monkeypatch.setenv("TESTING", "false")  # Disable testing mode to allow mocking
    monkeypatch.setenv("MOCK_PROVIDER_FAILURE", "true")  # Force Ollama failure
    monkeypatch.setenv("MONGODB_URL", "mongodb://localhost:27017")
    monkeypatch.setenv("DATABASE_NAME", "dna_analysis_test")
    monkeypatch.setenv("PORT", "8080")
    monkeypatch.setenv("HOST", "0.0.0.0")
    monkeypatch.setenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
    monkeypatch.setenv("OLLAMA_TIMEOUT_SECONDS", "30")
    monkeypatch.setenv("DEEPSEEK_MODEL", "deepseek-chat")
    monkeypatch.setenv("DEEPSEEK_TIMEOUT", "60")
    
    with open(os.path.join(os.path.dirname(__file__), "data", "health_data_1.txt"), 'rb') as f:
        test_data = f.read().decode('utf-8')
        
    mock_deepseek_response = {
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
        },
        "provider": "deepseek",
        "model": "deepseek-chat"
    }

    # Test Ollama failure -> DeepSeek fallback
    with patch('app.services.ollama_service.httpx.AsyncClient') as mock_ollama_client, \
         patch('app.services.deepseek_service.httpx.AsyncClient') as mock_deepseek_client, \
         patch('app.services.claude_service.httpx.AsyncClient') as mock_claude_client:
        
        # Mock Ollama client to fail
        mock_ollama = AsyncMock()
        mock_ollama.__aenter__.return_value = mock_ollama
        mock_ollama.get.side_effect = httpx.ConnectError("Failed to connect to Ollama service")
        mock_ollama.post.side_effect = httpx.ConnectError("Failed to connect to Ollama service")
        mock_ollama_client.return_value = mock_ollama

        # Mock DeepSeek client to succeed
        mock_deepseek = AsyncMock()
        mock_deepseek.__aenter__.return_value = mock_deepseek
        mock_deepseek.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value=mock_deepseek_response)
        )
        mock_deepseek_client.return_value = mock_deepseek

        # Mock Claude client to fail
        mock_claude = AsyncMock()
        mock_claude.__aenter__.return_value = mock_claude
        mock_claude.post.side_effect = Exception("Claude service unavailable")
        mock_claude_client.return_value = mock_claude

        response = await app_client.post(
            "/api/analyze",
            json={"sequence": test_data}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["provider"] == "deepseek"
        assert result["model"] == "deepseek-chat"
        
        # Verify analysis content
        analysis = result["analysis"]
        assert isinstance(analysis, dict)
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
        
        # Verify analysis content
        analysis = result["analysis"]
        assert isinstance(analysis, dict)
        assert "summary" in analysis
        assert "recommendations" in analysis
        assert "risk_factors" in analysis
        assert "metrics" in analysis
        
        # Verify Chinese content
        assert any(ord(c) > 127 for c in analysis["summary"])
        
        # Verify recommendations and risk factors
        assert len(analysis["recommendations"]) >= 3
        assert len(analysis["risk_factors"]) >= 2
        
        # Verify metrics
        validate_health_metrics(analysis["metrics"])
