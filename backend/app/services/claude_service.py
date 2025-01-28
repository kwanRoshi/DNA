import httpx
import json
import anthropic
from ..config import CLAUDE_API_KEY

async def analyze_with_claude(sequence: str) -> dict:
    """
    Analyze a sequence using Claude API
    """
    if not CLAUDE_API_KEY or CLAUDE_API_KEY == 'test':
        return {
            "summary": "测试DNA序列分析",
            "recommendations": [
                {"text": "增加运动量", "priority": "high"},
                {"text": "保持良好的睡眠习惯", "priority": "medium"}
            ],
            "risks": [
                {"text": "存在心血管疾病风险", "severity": "medium"},
                {"text": "轻度贫血风险", "severity": "low"}
            ]
        }

    client = anthropic.AsyncAnthropic(api_key=CLAUDE_API_KEY)

    system_prompt = """You are a bioinformatics expert analyzing biological sequences. 
    Provide a detailed analysis including:
    1. Sequence Type Identification
    2. Basic Features Analysis
    3. Health Implications
    4. Clinical Significance
    5. Recommendations
    Format the response in clear sections."""

    try:
        response = await client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=2000,
            temperature=0.3,
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": f"Analyze this sequence and provide health insights: {sequence}"
            }]
        )
        
        try:
            analysis = response.content[0].text if hasattr(response.content[0], 'text') else str(response.content[0])
            analysis_data = json.loads(analysis)
        except (AttributeError, json.JSONDecodeError):
            analysis_data = {
                "summary": str(response.content[0]) if response.content else "Analysis failed",
                "recommendations": [
                    {"text": "需要更多数据分析", "priority": "high"}
                ],
                "risks": [
                    {"text": "无法确定具体风险", "severity": "unknown"}
                ]
            }

        return analysis_data

    except Exception as e:
        print(f"Error in Claude analysis: {str(e)}")
        raise Exception(f"Failed to analyze sequence with Claude: {str(e)}")                                                                                                                              