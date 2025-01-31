import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.ollama.ollama_service import OllamaService
from app.services.deepseek_service import analyze_with_deepseek
from app.services.claude_service import analyze_with_claude

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "model": "deepseek-r1:1.5b"
    }

@pytest.mark.asyncio
async def test_dna_analysis_success():
    mock_result = {
        "analysis": """1. 序列类型：这是一段基因组DNA序列，长度为20个碱基对，属于编码区序列
2. 基本特征分析：
   - 序列组成：包含ATCG四种碱基，GC含量适中
   - 序列特点：未发现明显的重复序列或异常结构
   - 保守性分析：与已知基因序列具有一定相似性
3. 健康影响评估：
   - 初步分析未发现已知的致病性变异
   - 序列变异在人群中属于常见类型
   - 当前无明显健康风险提示
4. 临床意义解读：
   - 序列变异属于正常多态性
   - 需要结合其他临床指标进行综合评估
   - 建议进行定期健康监测
5. 健康建议：
   - 建议进行全面基因检测以获取更完整的健康信息
   - 保持良好的生活习惯，定期体检
   - 如有特殊健康问题，请及时咨询专业医生""",
        "model": "ollama-deepseek-r1:1.5b",
        "provider": "ollama"
    }
    
    with patch('app.services.ollama.ollama_service.OllamaService.analyze_sequence', new_callable=AsyncMock) as mock_ollama, \
         patch('app.services.deepseek_service.analyze_with_deepseek', new_callable=AsyncMock) as mock_deepseek, \
         patch('app.services.claude_service.analyze_with_claude', new_callable=AsyncMock) as mock_claude:
        mock_ollama.return_value = mock_result
        mock_deepseek.side_effect = Exception("DeepSeek API not available")
        mock_claude.side_effect = Exception("Claude API not available")
        response = client.post(
            "/analyze",
            json={"sequence": "ATCGATCGATCGTAGCTACG"}
        )
        assert response.status_code == 200
        result = response.json()
        assert result == mock_result
        assert "序列类型" in result["analysis"]
        assert "健康影响" in result["analysis"]
        assert "建议" in result["analysis"]
        assert len(result["analysis"]) > 200

@pytest.mark.asyncio
async def test_dna_analysis_service_failure():
    with patch('app.services.ollama.ollama_service.OllamaService.analyze_sequence', new_callable=AsyncMock) as mock_ollama, \
         patch('app.services.deepseek_service.analyze_with_deepseek', new_callable=AsyncMock) as mock_deepseek, \
         patch('app.services.claude_service.analyze_with_claude', new_callable=AsyncMock) as mock_claude:
        mock_ollama.side_effect = Exception("Ollama服务错误")
        mock_deepseek.side_effect = Exception("DeepSeek API not available")
        mock_claude.side_effect = Exception("Claude API not available")
        response = client.post(
            "/analyze",
            json={"sequence": "ATCGATCGATCG"}
        )
        assert response.status_code == 500
        result = response.json()
        assert "detail" in result
        assert "DNA分析失败" in result["detail"]
        assert "Ollama服务错误" in result["detail"]

@pytest.mark.asyncio
async def test_dna_analysis_chinese_output():
    mock_result = {
        "analysis": """1. 序列类型：这是一段较长的基因组DNA序列，包含显著的重复单元
2. 基本特征分析：
   - 序列长度：约95个碱基对
   - 结构特点：包含多个GCTAG重复片段
   - GC含量：偏高（约60%），可能影响序列稳定性
   - 重复模式：观察到规律性的重复序列模式
3. 健康影响评估：
   - 重复序列可能与特定遗传特征相关
   - 需要评估是否存在潜在的基因变异
   - 建议关注相关表型特征的表现
4. 临床意义解读：
   - 此类重复序列模式需要专业的遗传学解读
   - 可能与某些遗传性疾病存在关联
   - 建议进行更详细的基因组分析和家族史调查
5. 专业建议：
   - 强烈建议咨询专业的遗传咨询师
   - 考虑进行全基因组测序分析
   - 建议进行家族成员的相关检测
   - 定期进行健康监测和随访评估""",
        "model": "ollama-deepseek-r1:1.5b",
        "provider": "ollama"
    }
    
    with patch('app.services.ollama.ollama_service.OllamaService.analyze_sequence', new_callable=AsyncMock) as mock_ollama, \
         patch('app.services.deepseek_service.analyze_with_deepseek', new_callable=AsyncMock) as mock_deepseek, \
         patch('app.services.claude_service.analyze_with_claude', new_callable=AsyncMock) as mock_claude:
        mock_ollama.return_value = mock_result
        mock_deepseek.side_effect = Exception("DeepSeek API not available")
        mock_claude.side_effect = Exception("Claude API not available")
        response = client.post(
            "/analyze",
            json={"sequence": "GCTAGCTAGCTAGCTAGCT" * 5}
        )
        assert response.status_code == 200
        result = response.json()
        assert result == mock_result
        assert all(key in result["analysis"] for key in ["序列类型", "基本特征", "健康影响", "临床意义", "建议"])
