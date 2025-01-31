import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self):
        self.base_url = "http://localhost:11434/api"  # Default Ollama API endpoint
        self.model = "deepseek-r1:1.5b"
        
    async def analyze_sequence(self, sequence: str) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/generate",
                    json={
                        "model": self.model,
                        "prompt": f"请分析以下DNA序列并提供健康见解：{sequence}",
                        "system": "你是一位专业的生物信息学专家，负责分析生物序列。请提供详细的分析，包括：\n1. 序列类型识别\n2. 基本特征分析\n3. 健康影响\n4. 临床意义\n5. 建议\n所有回复必须使用中文。",
                        "stream": False
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
