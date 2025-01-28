import pytest
from unittest.mock import AsyncMock, patch
from app.services.claude_service import analyze_with_claude

@pytest.mark.asyncio
async def test_analyze_with_claude():
    mock_response = {
        "summary": "健康报告分析",
        "recommendations": [
            {"text": "增加运动量", "priority": "high"},
            {"text": "保持良好的睡眠习惯", "priority": "medium"}
        ],
        "risks": [
            {"text": "存在心血管疾病风险", "severity": "high"},
            {"text": "轻度贫血风险", "severity": "low"}
        ]
    }
    
    with patch('app.services.claude_service.anthropic.AsyncAnthropic') as mock_anthropic:
        mock_client = AsyncMock()
        mock_client.messages.create.return_value.content = [{"text": str(mock_response)}]
        mock_anthropic.return_value = mock_client
        
        result = await analyze_with_claude("ATCG GCTA")
        
        assert isinstance(result, dict)
        assert "summary" in result
        assert "recommendations" in result
        assert "risks" in result
        assert len(result["recommendations"]) > 0
        assert len(result["risks"]) > 0
        assert all(isinstance(rec, dict) for rec in result["recommendations"])
        assert all(isinstance(risk, dict) for risk in result["risks"])
