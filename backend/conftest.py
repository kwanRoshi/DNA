import os
import sys
import pytest
import pytest_asyncio
from pathlib import Path
from fastapi.testclient import TestClient
from httpx import AsyncClient
from app.main import app

# Add the project root directory to Python path
project_root = Path(__file__).parent
tests_dir = project_root / "tests"

# Update Python path for test discovery
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(tests_dir))

# Set PYTHONPATH for subprocess test runs
os.environ["PYTHONPATH"] = f"{str(project_root)}"

@pytest_asyncio.fixture
async def app_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def test_data_files():
    base_path = os.path.join(os.path.dirname(__file__), "tests", "data")
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
        "provider": "deepseek",
        "model": "deepseek-chat"
    }

@pytest.fixture
def test_data_files():
    base_path = os.path.join(os.path.dirname(__file__), "tests", "data")
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
        }
    }
