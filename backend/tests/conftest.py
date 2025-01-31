import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app
import pytest_asyncio
import os

@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    """Mock environment variables for testing."""
    monkeypatch.setenv("TESTING", "true")
    monkeypatch.setenv("CLAUDE_API_KEY", "mock-claude-key")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "mock-deepseek-key")
    monkeypatch.setenv("OLLAMA_API_BASE", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_TIMEOUT_SECONDS", "30")
    monkeypatch.setenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
    monkeypatch.setenv("MODEL_FALLBACK_PRIORITY", "ollama,deepseek,claude")
    monkeypatch.setenv("MONGODB_URL", "mongodb://localhost:27017")
    monkeypatch.setenv("DATABASE_NAME", "dna_analysis_test")
    monkeypatch.setenv("PORT", "8080")
    monkeypatch.setenv("HOST", "0.0.0.0")

@pytest_asyncio.fixture
async def app_client():
    """Create an async client for testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def test_data_files():
    import os
    base_path = os.path.join(os.path.dirname(__file__), "data")
    return [
        os.path.join(base_path, f"health_data_{i}.txt")
        for i in range(1, 4)
    ]

@pytest.fixture
def mock_response():
    return {
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
    }
