# API 文档

## 健康咨询 API

### 症状评估
```http
POST /api/ai-assistant/consult
Content-Type: application/json

{
  "data": "症状描述",
  "timestamp": "2024-03-15T10:00:00Z"
}
```

响应示例：
```json
{
  "consultation_id": "c_123456",
  "timestamp": "2024-03-15T10:00:00Z",
  "response": {
    "summary": "健康状况总结",
    "recommendations": [
      {
        "suggestion": "建议内容",
        "priority": "high",
        "category": "lifestyle"
      }
    ],
    "risk_factors": [
      {
        "description": "风险描述",
        "severity": "medium",
        "type": "psychological"
      }
    ],
    "metrics": {
      "healthScore": 75,
      "stressLevel": "medium",
      "sleepQuality": "poor"
    }
  }
}
```

### 基因测序分析
```http
POST /api/analyze
Content-Type: application/json

{
  "sequence": "基因序列数据",
  "analysis_type": "gene",
  "provider": "deepseek"
}
```

### 健康档案管理
```http
POST /api/health-records
Content-Type: application/json

{
  "user_id": "用户ID",
  "record_type": "consultation",
  "data": {
    "symptoms": ["症状1", "症状2"],
    "duration": "持续时间",
    "severity": "严重程度"
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

### 检测机构推荐
```http
POST /api/ai-assistant/recommend-facilities
Content-Type: application/json

{
  "location": "北京",
  "service_type": "gene_sequencing",
  "max_results": 3
}
```

## 错误处理
所有API在发生错误时返回标准HTTP错误码：
- 400: 请求参数错误
- 401: 未授权访问
- 404: 资源不存在
- 500: 服务器内部错误

## 数据格式
- 所有请求和响应均使用UTF-8编码
- 时间戳使用ISO 8601格式
- 文本数据支持中文和英文
