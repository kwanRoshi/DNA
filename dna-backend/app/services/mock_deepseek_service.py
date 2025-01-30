import logging
from typing import Dict, Any
from fastapi import HTTPException

logger = logging.getLogger(__name__)

MOCK_RESPONSES = {
    'health': {
        'success': True,
        'analysis': {
            'summary': '根据症状描述，患者可能存在以下健康问题：\n1. 慢性疲劳\n2. 睡眠质量差\n3. 轻度头痛\n4. 可能与工作压力相关的身心症状',
            'recommendations': [
                {'suggestion': '调整作息时间，保证充足睡眠', 'priority': 'high', 'category': 'lifestyle'},
                {'suggestion': '增加适度运动', 'priority': 'medium', 'category': 'exercise'},
                {'suggestion': '建议进行全面体检', 'priority': 'high', 'category': 'medical'}
            ],
            'risk_factors': [
                {'description': '工作压力过大', 'severity': 'medium', 'type': 'psychological'},
                {'description': '睡眠质量差', 'severity': 'high', 'type': 'lifestyle'}
            ],
            'metrics': {
                'healthScore': 75,
                'stressLevel': 'medium',
                'sleepQuality': 'poor'
            }
        }
    },
    'gene': {
        'success': True,
        'analysis': {
            'summary': '基因检测结果分析：\n1. BRCA1基因：未发现已知致病变异\n2. MTHFR基因：存在C677T多态性\n3. ApoE基因：E3/E3基因型',
            'recommendations': [
                {'suggestion': '定期进行乳腺癌筛查', 'priority': 'medium', 'category': 'screening'},
                {'suggestion': '补充叶酸', 'priority': 'high', 'category': 'nutrition'},
                {'suggestion': '定期监测血压', 'priority': 'high', 'category': 'monitoring'}
            ],
            'risk_factors': [
                {'description': '叶酸代谢效率可能降低', 'severity': 'medium', 'type': 'genetic'},
                {'description': '血压相关基因风险', 'severity': 'medium', 'type': 'cardiovascular'}
            ],
            'metrics': {
                'geneticRiskScore': 0.25,
                'variantSignificance': 'moderate',
                'inheritancePattern': 'complex',
                'preventiveMeasuresScore': 0.75
            }
        }
    },
     'early_screening': {
         'success': True,
         'analysis': {
             'summary': '早期筛查结果分析：\n1. 血压轻度偏高\n2. 血糖处于临界值\n3. 胆固醇略高',
             'recommendations': [
                 {'suggestion': '控制饮食，减少盐分摄入', 'priority': 'high', 'category': 'diet'},
                 {'suggestion': '增加有氧运动频率', 'priority': 'medium', 'category': 'exercise'}
             ],
             'riskFactors': [
                 {'description': '心血管疾病风险', 'severity': 'medium', 'type': 'cardiovascular'},
                 {'description': '代谢综合征风险', 'severity': 'low', 'type': 'metabolic'}
             ],
             'metrics': {
                 'riskLevel': 'medium',
                 'confidenceScore': 0.85,
                 'healthIndex': 78
             }
         }
     },
    'early_screening': {
        'success': True,
        'analysis': {
            'summary': '早期筛查结果分析：\n1. 血压轻度偏高\n2. 血糖处于临界值\n3. 胆固醇略高',
            'recommendations': [
                {'suggestion': '控制饮食，减少盐分摄入', 'priority': 'high', 'category': 'diet'},
                {'suggestion': '增加有氧运动频率', 'priority': 'medium', 'category': 'exercise'}
            ],
            'risk_factors': [
                {'description': '心血管疾病风险', 'severity': 'medium', 'type': 'cardiovascular'},
                {'description': '代谢综合征风险', 'severity': 'low', 'type': 'metabolic'}
            ],
            'metrics': {
                'riskLevel': 'medium',
                'confidenceScore': 0.85,
                'healthIndex': 78
            }
        }
    }
}

async def mock_analyze_sequence(
    sequence: str,
    analysis_type: str = "health",
    include_recommendations: bool = True,
    include_risk_factors: bool = True,
    include_metrics: bool = True
) -> Dict[str, Any]:
    if not sequence:
        raise HTTPException(status_code=400, detail="No sequence provided")
        
    if analysis_type not in MOCK_RESPONSES:
        raise HTTPException(status_code=400, detail="Invalid analysis type")
        
    response = MOCK_RESPONSES[analysis_type].copy()
    if not include_recommendations:
        response["analysis"].pop("recommendations", None)
    if not include_risk_factors:
        response["analysis"].pop("riskFactors", None)
    if not include_metrics:
        response["analysis"].pop("metrics", None)
        
    return response
