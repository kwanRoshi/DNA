import httpx
import json
from ..config import CLAUDE_API_KEY, CLAUDE_API_ENDPOINT

async def analyze_with_claude(sequence: str) -> dict:
    """
    Analyze a sequence using Claude API
    """
    headers = {
        "anthropic-version": "2023-06-01",
        "x-api-key": CLAUDE_API_KEY,
        "content-type": "application/json"
    }

    system_prompt = """你是一位专业的生物信息学专家，负责分析生物序列。
    请提供详细的分析，包括：
    1. 序列类型识别
    2. 基本特征分析
    3. 健康影响
    4. 临床意义
    5. 建议
    请以清晰的章节格式回复。所有回复必须使用中文。"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                CLAUDE_API_ENDPOINT,
                headers=headers,
                json={
                    "model": "claude-3-opus-20240229",
                    "max_tokens": 2000,
                    "temperature": 0.3,
                    "system": system_prompt,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"Analyze this sequence and provide health insights: {sequence}"
                        }
                    ]
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Claude API error: {response.text}")

            result = response.json()
            analysis = result['content'][0]['text']

            return {
                "analysis": analysis,
                "model": "claude-3-opus-20240229",
                "provider": "anthropic"
            }

    except Exception as e:
        print(f"Error in Claude analysis: {str(e)}")
        raise Exception(f"Failed to analyze sequence with Claude: {str(e)}")              