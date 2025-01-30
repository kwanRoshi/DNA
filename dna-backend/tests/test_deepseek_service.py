import pytest
import pytest_asyncio
import httpx
from fastapi import HTTPException
from app.services.deepseek_service import analyze_sequence, analyze_with_deepseek
import os

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
            return b'{"choices": [{"message": {"content": "Summary: Test analysis result\n\nRisk Factors:\n- High blood pressure\n- Elevated cholesterol\n\nRecommendations:\n- Regular exercise\n- Balanced diet"}}]}'

        def json(self):
            return {
                "choices": [{
                    "message": {
                        "content": "Summary: Test analysis result\n\nRisk Factors:\n- High blood pressure\n- Elevated cholesterol\n\nRecommendations:\n- Regular exercise\n- Balanced diet"
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
    
    result = await analyze_with_deepseek("test health data")
    assert result["success"] is True
    assert "analysis" in result
    assert result["analysis"]["summary"] == "Test analysis result"
    assert len(result["analysis"]["recommendations"]) == 2
    assert "Regular exercise" in result["analysis"]["recommendations"]
    assert len(result["analysis"]["riskFactors"]) == 2
    assert "High blood pressure" in result["analysis"]["riskFactors"]
    assert "metrics" in result["analysis"]

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
