import re
from typing import Optional

def determine_priority(text: str) -> str:
    if any(word in text for word in ['立即', '紧急', '重要']):
        return 'high'
    elif any(word in text for word in ['建议', '可以']):
        return 'medium'
    return 'low'

def determine_category(text: str) -> str:
    categories = {
        '饮食': ['饮食', '营养', '食物'],
        '运动': ['运动', '锻炼', '活动'],
        '睡眠': ['睡眠', '休息'],
        '生活方式': ['生活', '习惯', '作息'],
        '医疗': ['就医', '检查', '治疗']
    }
    
    for category, keywords in categories.items():
        if any(keyword in text for keyword in keywords):
            return category
    return '其他'

def determine_severity(text: str) -> str:
    if any(word in text for word in ['严重', '高度', '紧急']):
        return 'high'
    elif any(word in text for word in ['中等', '注意']):
        return 'medium'
    return 'low'

def determine_risk_type(text: str) -> str:
    risk_types = {
        '慢性病': ['慢性', '长期'],
        '急性': ['急性', '突发'],
        '遗传': ['遗传', '基因'],
        '环境': ['环境', '外部'],
        '生活方式': ['生活', '习惯']
    }
    
    for risk_type, keywords in risk_types.items():
        if any(keyword in text for keyword in keywords):
            return risk_type
    return '未分类'

def extract_health_score(text: str) -> Optional[int]:
    matches = re.findall(r'健康[指数|评分].*?(\d+)', text)
    return int(matches[0]) if matches else None

def extract_stress_level(text: str) -> Optional[str]:
    if '压力' not in text:
        return None
    if any(word in text for word in ['高压', '重度']):
        return 'high'
    elif any(word in text for word in ['中度', '适中']):
        return 'medium'
    return 'low'

def extract_sleep_quality(text: str) -> Optional[str]:
    if '睡眠' not in text:
        return None
    if any(word in text for word in ['优质', '良好']):
        return 'good'
    elif any(word in text for word in ['一般', '适中']):
        return 'fair'
    return 'poor'

def extract_genetic_risk(text: str) -> Optional[float]:
    matches = re.findall(r'基因风险.*?([\d.]+)', text)
    return float(matches[0]) if matches else None

def extract_inheritance_pattern(text: str) -> Optional[str]:
    patterns = ['常染色体显性', '常染色体隐性', '伴性遗传', '线粒体遗传']
    for pattern in patterns:
        if pattern in text:
            return pattern
    return None

def extract_risk_level(text: str) -> Optional[str]:
    if any(word in text for word in ['高风险', '重度风险']):
        return 'high'
    elif any(word in text for word in ['中度风险', '中等风险']):
        return 'medium'
    return 'low'

def extract_confidence_score(text: str) -> Optional[float]:
    matches = re.findall(r'可信度.*?([\d.]+)', text)
    return float(matches[0]) if matches else None
