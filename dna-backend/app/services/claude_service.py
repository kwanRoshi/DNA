import os
import httpx
from typing import Dict, Any

async def analyze_with_claude(text_data: str) -> Dict[str, Any]:
    """Analyze health data using Claude API."""
    api_key = os.getenv("CLAUDE_API_KEY")
    if not api_key:
        raise ValueError("Claude API key not found in environment variables")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    system_prompt = """You are a health analysis AI assistant. Analyze the provided health data and return a structured assessment.
    Focus on key health indicators, risk factors, and provide actionable recommendations."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": "claude-3-opus-20240229",
                    "max_tokens": 1000,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text_data}
                    ]
                }
            )
            
            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"API request failed with status {response.status_code}"
                }

            result = response.json()
            content = result["content"][0]["text"]
            
            # Parse the response into structured format
            lines = content.split("\n")
            health_assessment = []
            recommendations = []
            
            current_section = None
            for line in lines:
                if "Health Assessment:" in line:
                    current_section = "assessment"
                elif "Recommendations:" in line:
                    current_section = "recommendations"
                elif line.strip().startswith("- "):
                    if current_section == "assessment":
                        health_assessment.append(line.strip()[2:])
                    elif current_section == "recommendations":
                        recommendations.append(line.strip()[2:])

            return {
                "success": True,
                "analysis": {
                    "healthAssessment": health_assessment,
                    "recommendations": recommendations
                }
            }

    except Exception as e:
        return {
            "success": False,
            "error": f"Analysis failed: {str(e)}"
        }
