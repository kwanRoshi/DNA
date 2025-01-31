import pytest
from app.services.ollama_service import analyze_with_ollama, parse_ollama_response
from fastapi import HTTPException
import os

@pytest.fixture
def test_data_files():
    base_path = os.path.join(os.path.dirname(__file__), "data")
    return [
        os.path.join(base_path, f"health_data_{i}.txt")
        for i in range(1, 4)
    ]

from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_analyze_with_ollama(test_data_files):
    mock_response = {
        "response": "分析结果：血压正常，血糖在标准范围内，BMI指数正常。建议：保持健康饮食，规律作息，适量运动。"
    }
    
    with patch('httpx.AsyncClient') as mock_client:
        mock_client_instance = AsyncMock()
        mock_client.return_value = mock_client_instance
        mock_client_instance.__aenter__.return_value = mock_client_instance
        
        mock_get_response = AsyncMock()
        mock_get_response.status_code = 200
        mock_get_response.json = AsyncMock()
        mock_get_response.json.return_value = {"models": [{"name": "deepseek-r1:1.5b"}]}
        mock_client_instance.get = AsyncMock(return_value=mock_get_response)

        mock_post_response = AsyncMock()
        mock_post_response.status_code = 200
        mock_post_response.json = AsyncMock()
        mock_post_response.json.return_value = mock_response
        mock_client_instance.post = AsyncMock(return_value=mock_post_response)
        
        for file_path in test_data_files:
            with open(file_path, 'r', encoding='utf-8') as f:
                health_data = f.read()
                
            result = await analyze_with_ollama(health_data)
            assert result["success"] is True
            assert "analysis" in result
            assert "summary" in result["analysis"]
            assert "recommendations" in result["analysis"]
            assert "risk_factors" in result["analysis"]
            assert "metrics" in result["analysis"]
            
            # Verify metrics structure
            metrics = result["analysis"]["metrics"]
            assert "healthScore" in metrics
            assert "stressLevel" in metrics
            assert "sleepQuality" in metrics
            assert "riskLevel" in metrics
            assert "confidenceScore" in metrics
            assert "healthIndex" in metrics
            
            # Verify recommendations and risk factors
            assert len(result["analysis"]["recommendations"]) >= 3
            assert len(result["analysis"]["risk_factors"]) >= 2
            
            # Verify Chinese content
            assert any(ord(c) > 127 for c in result["analysis"]["summary"])
            for rec in result["analysis"]["recommendations"]:
                assert any(ord(c) > 127 for c in rec)
            for risk in result["analysis"]["risk_factors"]:
                assert any(ord(c) > 127 for c in risk)

@pytest.mark.asyncio
async def test_analyze_with_ollama_error_handling():
    # Test empty input
    with pytest.raises(HTTPException) as exc_info:
        await analyze_with_ollama("")
    assert exc_info.value.status_code == 400
    assert "Empty sequence provided" in str(exc_info.value.detail)
    
    # Test invalid input data
    invalid_data = "这不是有效的健康数据。没有任何指标。"
    with patch('httpx.AsyncClient') as mock_client:
        mock_client_instance = AsyncMock()
        mock_client.return_value.__aenter__.return_value = mock_client_instance
        
        # Mock the models list call
        mock_client_instance.get.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={"models": [{"name": "deepseek-r1:1.5b"}]})
        )
        
        # Mock the generation call
        mock_client_instance.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={"response": "无法识别的数据"})
        )

        with pytest.raises(HTTPException) as exc_info:
            await analyze_with_ollama(invalid_data)
        assert exc_info.value.status_code == 500
        assert "No valid health indicators found" in str(exc_info.value.detail)
