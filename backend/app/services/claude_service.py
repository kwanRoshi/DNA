import httpx
import json
from ..config import CLAUDE_API_KEY

async def analyze_with_claude(sequence: str) -> dict:
    """
    Analyze a sequence using Claude API
    """
    headers = {
        "anthropic-version": "2023-06-01",
        "x-api-key": CLAUDE_API_KEY,
        "content-type": "application/json"
    }

    system_prompt = """You are a bioinformatics expert analyzing biological sequences. 
    Provide a detailed analysis including:
    1. Sequence Type Identification
    2. Basic Features Analysis
    3. Health Implications
    4. Clinical Significance
    5. Recommendations
    Format the response in clear sections."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": "claude-3-opus-20240229",  # Using Claude 3 Opus as it's the most capable model available
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
                "model": "claude-3.5",
                "provider": "anthropic"
            }

    except Exception as e:
        print(f"Error in Claude analysis: {str(e)}")
        raise Exception(f"Failed to analyze sequence with Claude: {str(e)}")       