from pydantic import BaseModel
from typing import Dict, List, Optional, Any

class AnalysisResponse(BaseModel):
    status: str
    analysis: Dict[str, Any]
    model: Optional[str] = None
    provider: Optional[str] = None
