import pytest
import pytest_asyncio
import httpx
from fastapi import HTTPException
from app.services.claude_service import analyze_with_claude
import os
import json

@pytest.mark.asyncio
async def test_analyze_with_claude_chinese_content(monkeypatch):
    class MockResponse:
        def __init__(self):
            self.status_code = 200

        async def aread(self):
            content = {
                "content": [{
                    "text": "Analysis Results:\n\nHealth Assessment:\n- Immune system function decreased\n- Stress level elevated\n\nRecommendations:\n- Improve nutrition\n- Get adequate sleep\n- Exercise regularly"
                }]
            }
            return json.dumps(content).encode('utf-8')

        def json(self):
            return {
                "content": [{
                    "text": "Analysis Results:\n\nHealth Assessment:\n- Immune system function decreased\n- Stress level elevated\n\nRecommendations:\n- Improve nutrition\n- Get adequate sleep\n- Exercise regularly"
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
    monkeypatch.setenv("CLAUDE_API_KEY", "test_key")

    result = await analyze_with_claude("Recent cold symptoms, high work stress, poor sleep quality")
    assert result["success"] is True
    assert "analysis" in result
    assert "Immune system function decreased" in result["analysis"]["healthAssessment"]
    assert "Stress level elevated" in result["analysis"]["healthAssessment"]
    assert len(result["analysis"]["recommendations"]) == 3
    assert "Improve nutrition" in result["analysis"]["recommendations"]
    assert "Get adequate sleep" in result["analysis"]["recommendations"]

@pytest.mark.asyncio
async def test_analyze_with_claude_mixed_language(monkeypatch):
    class MockResponse:
        def __init__(self):
            self.status_code = 200

        async def aread(self):
            content = {
                "content": [{
                    "text": "Analysis Results:\n\nHealth Assessment:\n- Immune system function decreased\n- Stress level elevated\n\nRecommendations:\n- Improve nutrition\n- Get adequate sleep\n- Exercise regularly"
                }]
            }
            return json.dumps(content).encode('utf-8')

        def json(self):
            return {
                "content": [{
                    "text": "Analysis Results:\n\nHealth Assessment:\n- Immune system function decreased\n- Stress level elevated\n\nRecommendations:\n- Improve nutrition\n- Get adequate sleep\n- Exercise regularly"
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
    monkeypatch.setenv("CLAUDE_API_KEY", "test_key")

    result = await analyze_with_claude("Feeling tired and getting sick easily, experiencing high stress")
    assert result["success"] is True
    assert "analysis" in result
    assert "Immune system function decreased" in result["analysis"]["healthAssessment"]
    assert "Stress level elevated" in result["analysis"]["healthAssessment"]
    assert len(result["analysis"]["recommendations"]) == 3
    assert "Improve nutrition" in result["analysis"]["recommendations"]
    assert "Get adequate sleep" in result["analysis"]["recommendations"]
