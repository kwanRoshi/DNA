import pytest
import pytest_asyncio
import json
from fastapi import HTTPException
from app.services.deepseek_service import analyze_with_deepseek

@pytest.mark.asyncio
async def test_chinese_text_deepseek(monkeypatch):
    class MockResponse:
        def __init__(self):
            self.status_code = 200
            self._content = json.dumps({
                "choices": [{
                    "message": {
                        "content": "健康状况分析结果：\n患者目前存在以下健康问题：\n1. 血压偏高\n2. 经常头痛\n3. 2型糖尿病\n\n风险因素：\n- 高血压家族史\n- 血糖控制不稳定\n- 头痛可能与压力相关\n\n建议：\n- 定期监测血压和血糖\n- 合理饮食，控制盐分摄入\n- 适量运动，保持良好作息\n- 进行压力管理"
                    }
                }]
            }).encode('utf-8')
            
        async def aread(self):
            return self._content
            
        def json(self):
            return json.loads(self._content)

    class MockAsyncClient:
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, *args, **kwargs):
            return MockResponse()

    def mock_client(*args, **kwargs):
        return MockAsyncClient()

    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", mock_client)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test_key")

    chinese_health_data = """
    患者信息：
    年龄：45岁
    主诉：血压偏高，经常头痛
    既往病史：2型糖尿病
    家族病史：父亲有高血压病史
    """
    
    result = await analyze_with_deepseek(chinese_health_data)
    assert result["success"] is True
    assert "analysis" in result
    assert isinstance(result["analysis"], dict)
    assert "summary" in result["analysis"]
    content = result["analysis"]["summary"]
    assert isinstance(content, str)
    assert len(content) > 0
    assert any(word in content for word in ["健康状况", "症状", "分析结果"])
    assert "recommendations" in result["analysis"]
    assert "risk_factors" in result["analysis"]
    assert len(result["analysis"]["recommendations"]) > 0
    assert len(result["analysis"]["risk_factors"]) > 0

@pytest.mark.asyncio
async def test_mixed_language_input(monkeypatch):
    class MockResponse:
        def __init__(self):
            self.status_code = 200
            self._content = json.dumps({
                "choices": [{
                    "message": {
                        "content": "Analysis Summary:\n\nPatient Status 患者状况：\n- Age 年龄: 35\n- Primary symptoms 主要症状: Frequent headaches 经常头痛\n\nRisk Factors 风险因素：\n- Chronic headaches 慢性头痛\n- Sleep issues 睡眠问题\n\nRecommendations 建议：\n- Regular check-ups 定期检查\n- Sleep hygiene 改善睡眠习惯"
                    }
                }]
            }).encode('utf-8')
            
        async def aread(self):
            return self._content
            
        def json(self):
            return json.loads(self._content)

    class MockAsyncClient:
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def post(self, *args, **kwargs):
            return MockResponse()

    def mock_client(*args, **kwargs):
        return MockAsyncClient()

    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", mock_client)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test_key")

    mixed_data = """
    Patient Info 患者信息:
    Age 年龄: 35
    Symptoms 症状: Frequent headaches 经常头痛
    DNA Sequence 基因序列: ATCGGCTA...
    Family History 家族病史: None 无
    """
    
    result = await analyze_with_deepseek(mixed_data)
    assert result["success"] is True
    assert "analysis" in result
    assert isinstance(result["analysis"], dict)
    assert "summary" in result["analysis"]
    content = result["analysis"]["summary"]
    assert isinstance(content, str)
    assert len(content) > 0
    assert any(word in content for word in ["症状", "Symptoms", "分析", "Analysis"])
    assert "DNA" in content or "基因" in content
