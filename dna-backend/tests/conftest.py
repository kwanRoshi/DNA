import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from httpx import AsyncClient, TimeoutException
from app.main import app
from app.services import deepseek_service

ASYNC_TIMEOUT = 30  # seconds

@pytest.fixture
def mock_deepseek_api(monkeypatch):
    mock_responses = {
        'health': {
            'success': True,
            'analysis': {
                'summary': '健康状况总体良好，但存在一些需要关注的问题。',
                'recommendations': [
                    {'suggestion': '增加运动量，每周至少进行3次中等强度运动', 'priority': 'high', 'category': 'lifestyle'},
                    {'suggestion': '改善睡眠质量，保证每晚7-8小时睡眠', 'priority': 'high', 'category': 'lifestyle'}
                ],
                'riskFactors': [
                    {'description': '睡眠质量不佳可能影响身体恢复', 'severity': 'medium', 'type': 'lifestyle'},
                    {'description': '工作压力过大可能导致身心健康问题', 'severity': 'high', 'type': 'mental'}
                ],
                'metrics': {
                    'healthScore': 85,
                    'stressLevel': 'high',
                    'sleepQuality': 'poor',
                    'exerciseFrequency': 'low'
                }
            }
        },
        'gene': {
            'success': True,
            'analysis': {
                'summary': '基因测序分析显示部分基因变异，需要进一步关注。',
                'recommendations': [
                    {'suggestion': '定期进行相关健康检查', 'priority': 'high', 'category': 'medical'},
                    {'suggestion': '调整生活方式以降低潜在风险', 'priority': 'medium', 'category': 'lifestyle'}
                ],
                'riskFactors': [
                    {'description': '特定基因变异可能增加某些疾病风险', 'severity': 'medium', 'type': 'genetic'},
                    {'description': '家族病史需要特别关注', 'severity': 'high', 'type': 'hereditary'}
                ],
                'metrics': {
                    'geneticRiskScore': 0.15,
                    'variantSignificance': 'moderate',
                    'preventiveMeasuresScore': 0.75
                }
            }
        },
        'screening': {
            'success': True,
            'analysis': {
                'summary': '早期筛查显示需要关注的健康风险。',
                'recommendations': [
                    {'suggestion': '建议进行进一步专业检查', 'priority': 'high', 'category': 'medical'},
                    {'suggestion': '调整生活方式降低风险', 'priority': 'medium', 'category': 'lifestyle'}
                ],
                'riskFactors': [
                    {'description': '发现潜在健康风险指标异常', 'severity': 'medium', 'type': 'screening'},
                    {'description': '需要进行专业医疗评估', 'severity': 'high', 'type': 'medical'}
                ],
                'metrics': {
                    'riskScore': 0.35,
                    'urgencyLevel': 'medium',
                    'followUpRequired': True
                }
            }
        }
    }

    async def mock_analyze(*args, **kwargs):
        analysis_type = kwargs.get('analysis_type', 'health')
        sequence = kwargs.get('sequence', '')
        
        if not sequence:
            raise ValueError("Empty sequence provided")
            
        if analysis_type not in ['health', 'gene', 'screening']:
            raise ValueError("Invalid analysis type")
            
        response = mock_responses.get(analysis_type, mock_responses['health'])
        if not response.get('success'):
            raise Exception("Analysis failed")
            
        return response

    mock = AsyncMock(side_effect=mock_analyze)
    monkeypatch.setattr(deepseek_service, 'analyze_sequence', mock)
    return mock

@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    monkeypatch.setenv("DEEPSEEK_API_KEY", "mock_deepseek_key")
    monkeypatch.setenv("CLAUDE_API_KEY", "mock_claude_key")

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_deepseek_response():
    return {
        "success": True,
        "analysis": {
            "summary": "健康状况总体良好，但存在一些需要关注的问题。",
            "recommendations": [
                {
                    "suggestion": "增加运动量，每周至少进行3次中等强度运动",
                    "priority": "high",
                    "category": "lifestyle"
                },
                {
                    "suggestion": "改善睡眠质量，保证每晚7-8小时睡眠",
                    "priority": "high",
                    "category": "lifestyle"
                }
            ],
            "riskFactors": [
                {
                    "description": "睡眠质量不佳可能影响身体恢复",
                    "severity": "medium",
                    "type": "lifestyle"
                },
                {
                    "description": "工作压力过大可能导致身心健康问题",
                    "severity": "high",
                    "type": "mental"
                }
            ],
            "metrics": {
                "healthScore": 85,
                "stressLevel": "high",
                "sleepQuality": "poor",
                "exerciseFrequency": "low",
                "dietQuality": "moderate"
            }
        }
    }

@pytest.fixture
def mock_gene_response():
    return {
        "success": True,
        "analysis": {
            "summary": "基因测序分析显示部分基因变异，需要进一步关注。",
            "recommendations": [
                {
                    "suggestion": "定期进行相关健康检查",
                    "priority": "high",
                    "category": "medical"
                },
                {
                    "suggestion": "调整生活方式以降低潜在风险",
                    "priority": "medium",
                    "category": "lifestyle"
                }
            ],
            "riskFactors": [
                {
                    "description": "特定基因变异可能增加某些疾病风险",
                    "severity": "medium",
                    "type": "genetic"
                },
                {
                    "description": "家族病史需要特别关注",
                    "severity": "high",
                    "type": "hereditary"
                }
            ],
            "metrics": {
                "geneticRiskScore": 0.15,
                "inheritancePattern": "complex",
                "variantSignificance": "moderate",
                "preventiveMeasuresScore": 0.75
            }
        }
    }

@pytest.fixture
def mock_facility_response():
    return {
        "success": True,
        "facilities": [
            {
                "name": "北京协和医院",
                "services": ["gene_sequencing", "health_screening", "early_detection"],
                "location": "北京市东城区帅府园一号",
                "rating": 4.8,
                "specialties": ["遗传病筛查", "健康体检", "肿瘤早筛"],
                "availability": "可预约",
                "certifications": ["三级甲等医院", "国家重点实验室"]
            },
            {
                "name": "中国医学科学院肿瘤医院",
                "services": ["gene_sequencing", "cancer_screening", "precision_medicine"],
                "location": "北京市朝阳区潘家园南里17号",
                "rating": 4.7,
                "specialties": ["肿瘤基因检测", "靶向治疗", "免疫治疗"],
                "availability": "可预约",
                "certifications": ["三级甲等医院", "国家癌症中心"]
            }
        ]
    }
