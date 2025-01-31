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

@pytest.mark.asyncio
async def test_analyze_with_ollama(test_data_files):
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
    with pytest.raises(HTTPException) as exc_info:
        await analyze_with_ollama(invalid_data)
    assert exc_info.value.status_code == 500
    assert "Error processing health data" in str(exc_info.value.detail)
