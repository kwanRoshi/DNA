import pytest
import pytest_asyncio
import httpx
from fastapi import HTTPException
from app.services.deepseek_service import analyze_sequence, analyze_with_deepseek
import os
import json

@pytest.mark.asyncio
async def test_analyze_sequence_with_empty_input():
    with pytest.raises(HTTPException) as exc_info:
        await analyze_sequence("")
    assert exc_info.value.status_code == 400
    assert "Sequence cannot be empty" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_analyze_sequence_with_invalid_provider():
    with pytest.raises(HTTPException) as exc_info:
        await analyze_sequence("test data", provider="invalid")
    assert exc_info.value.status_code == 400
    assert "Unsupported provider" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_analyze_with_deepseek_success(monkeypatch):
    class MockResponse:
        def __init__(self):
            self.status_code = 200

        async def aread(self):
            content = {
                "choices": [{
                    "message": {
                        "content": "摘要：健康状况分析结果\n\n风险因素：\n- 血压偏高\n- 胆固醇水平升高\n- 睡眠质量差\n\n建议：\n- 规律运动\n- 均衡饮食\n- 改善作息时间"
                    }
                }]
            }
            return json.dumps(content).encode('utf-8')

        def json(self):
            return {
                "choices": [{
                    "message": {
                        "content": "摘要：健康状况分析结果\n\n风险因素：\n- 血压偏高\n- 胆固醇水平升高\n- 睡眠质量差\n\n建议：\n- 规律运动\n- 均衡饮食\n- 改善作息时间"
                    }
                }]
            }

    class MockClient:
        def __init__(self, *args, **kwargs):
            self.timeout = kwargs.get('timeout', None)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return MockResponse()

    monkeypatch.setattr(httpx, "AsyncClient", MockClient)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test_key")
    
    # Test with Chinese input
    result = await analyze_with_deepseek("最近感觉疲劳，睡眠质量差，血压偏高")
    assert result["success"] is True
    assert "analysis" in result
    assert "健康状况分析结果" in result["analysis"]["summary"]
    assert len(result["analysis"]["recommendations"]) == 3
    assert "规律运动" in result["analysis"]["recommendations"]
    assert "均衡饮食" in result["analysis"]["recommendations"]
    assert "改善作息时间" in result["analysis"]["recommendations"]
    assert len(result["analysis"]["risk_factors"]) == 3
    assert any("血压偏高" in rf for rf in result["analysis"]["risk_factors"])
    assert any("睡眠质量差" in rf for rf in result["analysis"]["risk_factors"])
    assert "metrics" in result["analysis"]

    # Test with mixed language input
    result = await analyze_with_deepseek("Blood pressure 偏高，feeling tired 疲劳")
    assert result["success"] is True
    assert "analysis" in result
    assert "健康状况分析结果" in result["analysis"]["summary"]
    assert len(result["analysis"]["recommendations"]) == 3
    assert len(result["analysis"]["riskFactors"]) == 3

@pytest.mark.asyncio
async def test_analyze_with_deepseek_api_error(monkeypatch):
    class MockResponse:
        def __init__(self):
            self.status_code = 401

        async def aread(self):
            return b'{"error": {"message": "Invalid API key"}}'

        def json(self):
            return {"error": {"message": "Invalid API key"}}

    class MockClient:
        def __init__(self, *args, **kwargs):
            self.timeout = kwargs.get('timeout', None)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return MockResponse()

    monkeypatch.setattr(httpx, "AsyncClient", MockClient)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "invalid_key")
    
    with pytest.raises(HTTPException) as exc_info:
        await analyze_with_deepseek("test health data")
    assert exc_info.value.status_code == 401
    assert "Invalid API key" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_analyze_with_deepseek_rate_limit(monkeypatch):
    class MockResponse:
        def __init__(self):
            self.status_code = 429

        async def aread(self):
            return b'{"error": {"message": "Rate limit exceeded"}}'

        def json(self):
            return {"error": {"message": "Rate limit exceeded"}}

    class MockClient:
        def __init__(self, *args, **kwargs):
            self.timeout = kwargs.get('timeout', None)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return MockResponse()

    monkeypatch.setattr(httpx, "AsyncClient", MockClient)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test_key")

    with pytest.raises(HTTPException) as exc_info:
        await analyze_with_deepseek("test health data")
    assert exc_info.value.status_code == 429
    assert "DeepSeek API rate limit exceeded" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_analyze_with_deepseek_timeout(monkeypatch):
    class MockClient:
        def __init__(self, *args, **kwargs):
            self.timeout = kwargs.get('timeout', None)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            raise httpx.TimeoutException("Request timed out")

    monkeypatch.setattr(httpx, "AsyncClient", MockClient)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test_key")

    with pytest.raises(HTTPException) as exc_info:
        await analyze_with_deepseek("test health data")
    assert exc_info.value.status_code == 504
    assert "Analysis request timed out" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_analyze_with_deepseek_malformed_response(monkeypatch):
    class MockResponse:
        def __init__(self):
            self.status_code = 200

        async def aread(self):
            return b'{"choices": []}'

        def json(self):
            return {"choices": []}

    class MockClient:
        def __init__(self, *args, **kwargs):
            self.timeout = kwargs.get('timeout', None)

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return MockResponse()

    monkeypatch.setattr(httpx, "AsyncClient", MockClient)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test_key")

    with pytest.raises(HTTPException) as exc_info:
        await analyze_with_deepseek("test health data")
    assert exc_info.value.status_code == 502
    assert "Invalid response" in str(exc_info.value.detail)
