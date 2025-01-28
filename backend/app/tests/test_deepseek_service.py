import pytest
from unittest.mock import AsyncMock, patch
from app.services.deepseek_service import analyze_with_deepseek

@pytest.mark.asyncio
async def test_analyze_with_deepseek():
    mock_response = {
        "analysis": {
            "sequence_type": "DNA",
            "gc_content": 0.5,
            "mutations": [
                {"position": 10, "type": "SNP", "severity": "high"},
                {"position": 20, "type": "deletion", "severity": "medium"}
            ],
            "health_implications": [
                "可能增加某些疾病风险",
                "需要进一步临床验证"
            ]
        }
    }
    
    with patch('app.services.deepseek_service.DeepseekAPI') as mock_deepseek:
        mock_client = AsyncMock()
        mock_client.analyze_sequence.return_value = mock_response
        mock_deepseek.return_value = mock_client
        
        result = await analyze_with_deepseek("ATCG GCTA")
        
        assert isinstance(result, dict)
        assert "analysis" in result
        assert "sequence_type" in result["analysis"]
        assert "mutations" in result["analysis"]
        assert "health_implications" in result["analysis"]
        assert len(result["analysis"]["mutations"]) > 0
        assert len(result["analysis"]["health_implications"]) > 0

@pytest.mark.asyncio
async def test_analyze_with_deepseek_error_handling():
    with patch('app.services.deepseek_service.DeepseekAPI') as mock_deepseek:
        mock_client = AsyncMock()
        mock_client.analyze_sequence.side_effect = Exception("API Error")
        mock_deepseek.return_value = mock_client
        
        with pytest.raises(Exception) as exc_info:
            await analyze_with_deepseek("INVALID SEQUENCE")
        
        assert "API Error" in str(exc_info.value)
