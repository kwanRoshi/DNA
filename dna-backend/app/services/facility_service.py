import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

async def recommend_facilities(
    location: str,
    service_type: str,
    max_results: int = 5
) -> Dict[str, List[Dict[str, Any]]]:
    """推荐医疗机构"""
    try:
        facilities = [
            {
                "name": "北京协和医院",
                "services": ["gene_sequencing", "health_screening"],
                "location": "北京市东城区帅府园一号",
                "rating": 4.8
            },
            {
                "name": "中国医学科学院肿瘤医院",
                "services": ["gene_sequencing", "cancer_screening"],
                "location": "北京市朝阳区潘家园南里17号",
                "rating": 4.7
            }
        ]
        
        filtered_facilities = [
            f for f in facilities 
            if service_type in f["services"] and location in f["location"]
        ][:max_results]
        
        return {"facilities": filtered_facilities}
    except Exception as e:
        logger.error(f"Error recommending facilities: {str(e)}")
        raise
