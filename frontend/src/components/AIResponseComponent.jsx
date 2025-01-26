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

  const renderAnalysisResult = (result) => {
    if (typeof result === 'string') {
      return <p>{result}</p>;
    }
    
    return (
      <div className="analysis-details">
        {Object.entries(result).map(([key, value]) => (
          <div key={key} className="analysis-item">
            <strong>{key}:</strong> {value}
          </div>
        ))}
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
