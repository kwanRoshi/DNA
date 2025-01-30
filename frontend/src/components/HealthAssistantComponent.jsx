import React, { useState } from 'react';
import { Card, Button, Input, Select, Alert, Spin, Typography, Space } from 'antd';
import { api } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const HealthAssistantComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisType, setAnalysisType] = useState('health');
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState(null);

  const handleAnalysis = async () => {
    if (!inputData.trim()) {
      setError('请输入健康数据进行分析');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/analyze', {
        sequence: inputData,
        provider: 'deepseek',
        analysis_type: analysisType,
        include_recommendations: true,
        include_risk_factors: true,
        include_metrics: true
      });

      if (response.data.success) {
        setResult(response.data.analysis);
      } else {
        setError(response.data.error || '分析请求失败');
      }
    } catch (err) {
      setError(err.message || '服务请求失败');
    } finally {
      setLoading(false);
    }
  };

  const renderMetrics = (metrics) => {
    if (!metrics) return null;

    return (
      <Card size="small" title="健康指标" style={{ marginTop: 16 }}>
        {metrics.healthScore && (
          <Text>健康评分: {metrics.healthScore}</Text>
        )}
        {metrics.stressLevel && (
          <Text>压力水平: {metrics.stressLevel}</Text>
        )}
        {metrics.sleepQuality && (
          <Text>睡眠质量: {metrics.sleepQuality}</Text>
        )}
        {metrics.geneticRiskScore && (
          <Text>基因风险评分: {metrics.geneticRiskScore}</Text>
        )}
        {metrics.inheritancePattern && (
          <Text>遗传模式: {metrics.inheritancePattern}</Text>
        )}
        {metrics.riskLevel && (
          <Text>风险等级: {metrics.riskLevel}</Text>
        )}
        {metrics.confidenceScore && (
          <Text>可信度: {metrics.confidenceScore}</Text>
        )}
      </Card>
    );
  };

  const renderRecommendations = (recommendations) => {
    if (!recommendations?.length) return null;

    return (
      <Card size="small" title="健康建议" style={{ marginTop: 16 }}>
        {recommendations.map((rec, index) => (
          <div key={index} style={{ marginBottom: 8 }}>
            <Text strong>{rec.suggestion}</Text>
            <br />
            <Text type="secondary">
              优先级: {rec.priority} | 类别: {rec.category}
            </Text>
          </div>
        ))}
      </Card>
    );
  };

  const renderRiskFactors = (risks) => {
    if (!risks?.length) return null;

    return (
      <Card size="small" title="风险因素" style={{ marginTop: 16 }}>
        {risks.map((risk, index) => (
          <div key={index} style={{ marginBottom: 8 }}>
            <Text strong>{risk.description}</Text>
            <br />
            <Text type="secondary">
              严重程度: {risk.severity} | 类型: {risk.type}
            </Text>
          </div>
        ))}
      </Card>
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title="AI 健康助手">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            value={analysisType}
            onChange={setAnalysisType}
            style={{ width: '100%' }}
          >
            <Option value="health">健康咨询</Option>
            <Option value="gene">基因测序</Option>
            <Option value="early_screening">早期筛查</Option>
          </Select>

          <Input.TextArea
            rows={6}
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="请输入您的健康数据进行分析..."
          />

          <Button
            type="primary"
            onClick={handleAnalysis}
            loading={loading}
            block
          >
            开始分析
          </Button>

          {error && (
            <Alert type="error" message={error} />
          )}

          {result && (
            <>
              <Card size="small" title="分析总结">
                <Text>{result.summary}</Text>
              </Card>
              {renderMetrics(result.metrics)}
              {renderRiskFactors(result.riskFactors)}
              {renderRecommendations(result.recommendations)}
            </>
          )}
        </Space>
      </Card>
    </Space>
  );
};

export default HealthAssistantComponent;
