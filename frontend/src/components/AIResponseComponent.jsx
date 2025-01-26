import { useState, useEffect } from 'react';
import { healthData } from '../services/api';
import './AIResponseComponent.css';

const AIResponseComponent = () => {
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalysisHistory();
    
    // 监听新的分析结果
    const handleNewAnalysis = (event) => {
      const newAnalysis = event.detail;
      setAnalysisResults(prev => [newAnalysis, ...prev]);
    };

    window.addEventListener('analysisComplete', handleNewAnalysis);

    return () => {
      window.removeEventListener('analysisComplete', handleNewAnalysis);
    };
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await healthData.getHistory();
      setAnalysisResults(response.history || []);
    } catch (err) {
      setError('加载分析历史失败');
      console.error('加载分析历史失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMetrics = (metrics) => {
    const metricLabels = {
      healthScore: '健康评分',
      riskLevel: '风险等级',
      reliabilityScore: '可信度',
      stressLevel: '压力水平',
      sleepQuality: '睡眠质量'
    };

    return (
      <div className="metrics-grid">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="metric-item">
            <div className="metric-label">{metricLabels[key] || key}</div>
            <div className="metric-value">{value}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecommendations = (recommendations) => {
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return null;
    }

    return (
      <div className="recommendations-section">
        <h4>改善建议</h4>
        <ul className="recommendations-list">
          {recommendations.map((rec, index) => (
            <li key={index} className={`priority-${rec.priority || 'medium'}`}>
              {rec.category && <span className="category">{rec.category}</span>}
              <span className="suggestion">{rec.suggestion || rec}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderRiskFactors = (risks) => {
    if (!Array.isArray(risks) || risks.length === 0) {
      return null;
    }

    return (
      <div className="risks-section">
        <h4>健康风险</h4>
        <ul className="risks-list">
          {risks.map((risk, index) => (
            <li key={index} className={`severity-${risk.severity || 'medium'}`}>
              {risk.type && <span className="risk-type">{risk.type}</span>}
              <span className="description">{risk.description}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderAnalysisResult = (result) => {
    if (typeof result === 'string') {
      return <p>{result}</p>;
    }

    return (
      <div className="analysis-details">
        {result.summary && (
          <div className="summary-section">
            <h4>分析摘要</h4>
            <p>{result.summary}</p>
          </div>
        )}
        
        {result.metrics && renderMetrics(result.metrics)}
        {result.recommendations && renderRecommendations(result.recommendations)}
        {result.risks && renderRiskFactors(result.risks)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="ai-response-container card">
        <h3>分析结果</h3>
        <div className="loading-container">
          <span className="loading"></span>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-response-container card">
      <h3>分析结果</h3>
      {error && <div className="error">{error}</div>}
      
      <div className="analysis-list">
        {analysisResults.length === 0 ? (
          <p className="no-results">暂无分析结果</p>
        ) : (
          analysisResults.map((analysis, index) => (
            <div key={index} className="analysis-card">
              <div className="analysis-header">
                <span className="analysis-time">
                  {formatDate(analysis.timestamp)}
                </span>
                {analysis.fileInfo && (
                  <span className="file-name">
                    文件：{analysis.fileInfo.fileName}
                  </span>
                )}
              </div>
              <div className="analysis-content">
                {renderAnalysisResult(analysis.result)}
              </div>
            </div>
          ))
        )}
      </div>

      {analysisResults.length > 0 && (
        <button 
          className="button refresh-button"
          onClick={loadAnalysisHistory}
          disabled={isLoading}
        >
          刷新
        </button>
      )}
    </div>
  );
};

export default AIResponseComponent;
