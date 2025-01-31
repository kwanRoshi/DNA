import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self):
        self.base_url = "http://localhost:11434/api"
        self.model = "deepseek-coder:33b-instruct"
        
    async def analyze_sequence(self, sequence: str) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/generate",
                    json={
                        "model": self.model,
                        "prompt": f"Please analyze this sequence and provide health insights: {sequence}",
                        "system": "You are a bioinformatics expert analyzing biological sequences."
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Ollama API error: {response.text}")
                    return None
                    
                result = response.json()
                return {
                    "analysis": result["response"],
                    "model": f"ollama-{self.model}",
                    "provider": "ollama"
                }
                
        except Exception as e:
            logger.error(f"Ollama analysis error: {str(e)}")
            return None

ollama_service = OllamaService()
