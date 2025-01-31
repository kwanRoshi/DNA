import pytest
from fastapi import HTTPException
from app.routers.analysis import process_sequence
from tests.test_analysis_pipeline import validate_health_metrics
from unittest.mock import patch, AsyncMock
import os

@pytest.fixture(autouse=True)
def setup_test_env():
    os.environ["CLAUDE_API_KEY"] = "test_key"
    os.environ["DEEPSEEK_API_KEY"] = "test_key"
    os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
    yield
    del os.environ["CLAUDE_API_KEY"]
    del os.environ["DEEPSEEK_API_KEY"]
    del os.environ["MONGODB_URI"]

@pytest.mark.asyncio
async def test_process_sequence_empty_input():
    with pytest.raises(HTTPException) as exc_info:
        await process_sequence("", "deepseek")
    assert exc_info.value.status_code == 400
    assert "No sequence provided" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_process_sequence_invalid_provider():
    with pytest.raises(HTTPException) as exc_info:
        await process_sequence("test sequence", "invalid")
    assert exc_info.value.status_code == 400
    assert "Invalid provider specified" in str(exc_info.value.detail)

@pytest.mark.asyncio
@pytest.mark.timeout(180)
async def test_process_sequence_success():
    """Test the fallback mechanism and response format."""
    test_sequence = """
姓名：王五
年龄：35岁
性别：男

基本指标：
血压：125/80
血糖：5.5
胆固醇：4.8
BMI：23.5
睡眠：良好，每晚7-8小时
压力：中等

症状：
- 偶尔头痛
- 轻度疲劳

生活习惯：
- 每周运动2-3次
- 饮食规律
- 不吸烟
- 偶尔饮酒
"""
    
    # Test with Ollama (primary provider)
    with patch('app.services.ollama_service.httpx.AsyncClient') as mock_client:
        mock_client_instance = AsyncMock()
        mock_client.return_value = mock_client_instance
        mock_client_instance.__aenter__.return_value = mock_client_instance
        
        mock_client_instance.get.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={"models": [{"name": "deepseek-r1:1.5b"}]})
        )
        
        mock_client_instance.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={
                "response": "总结：血压正常，血糖在标准范围内，BMI指数正常。\n\n建议：\n- 保持健康饮食，规律作息\n- 适量运动，增强体质\n- 定期体检，预防疾病\n\n风险因素：\n- 工作压力可能较大\n- 作息时间不规律"
            })
        )
        
        mock_client_instance = AsyncMock()
        mock_client.return_value = mock_client_instance
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.get = AsyncMock(return_value=mock_get_response)
        mock_client_instance.post = AsyncMock(return_value=mock_post_response)
        
        result = await process_sequence(test_sequence, "ollama")
    assert isinstance(result, dict)
    assert "analysis" in result
    analysis = result["analysis"]
    assert isinstance(analysis, dict)
    assert all(key in analysis for key in ["summary", "recommendations", "risk_factors", "metrics"])
    assert any(ord(c) > 127 for c in analysis["summary"])  # Contains Chinese characters
    assert len(analysis["recommendations"]) >= 2
    assert len(analysis["risk_factors"]) >= 1
    validate_health_metrics(analysis["metrics"])
    
    # Test fallback mechanism
    result = await process_sequence(test_sequence)
    assert isinstance(result, dict)
    assert "analysis" in result
    analysis = result["analysis"]
    assert isinstance(analysis, dict)
    assert all(key in analysis for key in ["summary", "recommendations", "risk_factors", "metrics"])
    assert any(ord(c) > 127 for c in analysis["summary"])
    validate_health_metrics(analysis["metrics"])
    assert "analysis" in result
    assert isinstance(result["analysis"], dict)
    assert "summary" in result["analysis"]
    assert "recommendations" in result["analysis"]
    assert isinstance(result["analysis"]["recommendations"], list)
    assert len(result["analysis"]["recommendations"]) > 0
    assert "risk_factors" in result["analysis"]
    assert isinstance(result["analysis"]["risk_factors"], list)
