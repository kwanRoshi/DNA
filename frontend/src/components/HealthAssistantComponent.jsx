import React, { useState } from 'react';
import './HealthAssistantComponent.css';

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
    <div className="health-assistant" role="main">
      <header className="assistant-header" role="banner">
        <h1 className="assistant-title" role="heading" aria-level="1">AI健康助手</h1>
        <p className="assistant-description" role="contentinfo">
          基于DeepSeek AI的智能健康分析系统，为您提供专业的健康评估和个性化建议
        </p>
      </header>

      <form className="analysis-form" role="form" aria-label="健康数据分析表单" onSubmit={(e) => { e.preventDefault(); handleAnalysis(); }}>
        <div className="form-group" role="group" aria-labelledby="analysis-type-label">
          <label id="analysis-type-label" className="form-label">分析类型</label>
          <select
            data-testid="analysis-type"
            className="form-select"
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            aria-label="分析类型"
            aria-required="true"
            tabIndex="0"
          >
            <option value="health">健康咨询</option>
            <option value="gene">基因测序</option>
            <option value="early_screening">早期筛查</option>
          </select>
        </div>

        <div className="form-group" role="group" aria-labelledby="health-data-label">
          <label id="health-data-label" className="form-label">健康数据</label>
          <textarea
            data-testid="analysis-input"
            className="form-textarea"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="请输入您的健康数据进行分析..."
            required
            aria-required="true"
            aria-invalid={!inputData.trim()}
            tabIndex="0"
          />
        </div>

        <button
          type="submit"
          data-testid="submit-analysis"
          className="submit-button"
          disabled={loading || !inputData.trim()}
          aria-disabled={loading || !inputData.trim()}
          aria-busy={loading}
          tabIndex="0"
        >
          {loading ? (
            <span data-testid="loading-state" role="status" aria-live="polite">分析中...</span>
          ) : '开始分析'}
        </button>

        {error && (
          <div 
            data-testid="error-message" 
            className="error-message" 
            role="alert" 
            aria-live="assertive"
          >
            {error}
            <button 
              onClick={handleAnalysis} 
              data-testid="retry-button"
              aria-label="重试分析"
              tabIndex="0"
            >
              重试
            </button>
          </div>
        )}
      </form>

      {result && (
        <div data-testid="analysis-result" className="results-container" role="region" aria-label="分析结果">
          <div className="result-card" role="region" aria-labelledby="summary-heading">
            <h3 id="summary-heading" role="heading" aria-level="3">分析总结</h3>
            <p>{result.summary}</p>
          </div>

          {result.metrics && (
            <div className="result-card" role="region" aria-labelledby="metrics-heading">
              <h3 id="metrics-heading" role="heading" aria-level="3">健康指标</h3>
              <div data-testid="health-metrics" className="metrics-grid" role="list">
                {Object.entries(result.metrics).map(([key, value]) => (
                  <div key={key} className="metric-item" role="listitem" data-testid={`metric-${key}`}>
                    <div className="metric-label">{key}</div>
                    <div className="metric-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.riskFactors?.length > 0 && (
            <div className="result-card" role="region" aria-labelledby="risks-heading">
              <h3 id="risks-heading" role="heading" aria-level="3">风险因素</h3>
              <ul data-testid="risk-factors" className="risk-factors-list" role="list">
                {result.riskFactors.map((risk, index) => (
                  <li key={index} role="listitem" data-testid={`risk-${index}`}>
                    <strong>{risk.description}</strong>
                    <div className="risk-severity" aria-label={`严重程度: ${risk.severity}, 类型: ${risk.type}`}>
                      严重程度: {risk.severity} | 类型: {risk.type}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div className="result-card" role="region" aria-labelledby="recommendations-heading">
              <h3 id="recommendations-heading" role="heading" aria-level="3">健康建议</h3>
              <ul data-testid="recommendations" className="recommendations-list" role="list">
                {result.recommendations.map((rec, index) => (
                  <li key={index} role="listitem" data-testid={`recommendation-${index}`}>
                    <strong>{rec.suggestion}</strong>
                    <div className="recommendation-priority" aria-label={`优先级: ${rec.priority}, 类别: ${rec.category}`}>
                      优先级: {rec.priority} | 类别: {rec.category}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthAssistantComponent;
