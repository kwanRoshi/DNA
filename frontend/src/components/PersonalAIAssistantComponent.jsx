import React, { useState } from 'react';
import './PersonalAIAssistantComponent.css';
import useStore from '../utils/store';

const featureDescriptions = {
  '智能诊断': '基于DeepSeek AI的智能症状分析和健康建议',
  '基因解读': '专业的基因测序数据分析和健康风险评估',
  '健康追踪': '全面的健康数据追踪和趋势分析',
  '个性化建议': '基于AI分析的个性化健康和生活方式建议',
  '深度分析': '多维度健康数据的深度分析和预测',
  '专家咨询': '与AI专家系统进行深度健康咨询'
};

const PersonalAIAssistantComponent = () => {
  const { user, features, consultationHistory, loading, error, setError } = useStore();
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFeatureClick = (feature) => {
    if (features?.unlocked.includes(feature)) {
      setSelectedFeature(feature);
      setShowDetails(true);
    }
  };

  const handleCloseDetails = () => {
    setSelectedFeature(null);
    setShowDetails(false);
  };

  if (loading) {
    return <div data-testid="loading-state">加载中...</div>;
  }

  if (error) {
    return (
      <div data-testid="error-message">
        {error}
        <button onClick={() => useStore.setState({ error: null })}>重试</button>
      </div>
    );
  }

  return (
    <div className="personal-assistant" data-testid="ai-assistant">
      <header className="assistant-header">
        <h1 className="assistant-title">我的AI助手</h1>
        <p className="assistant-description">
          您的个性化健康管理专家，随时为您提供专业的健康建议
        </p>
      </header>

      <div className="stats-container">
        <div className="stat-item" data-testid="stat-健康咨询">
          <span>健康咨询</span>
          <span>{user?.consultationCount}次</span>
        </div>
        <div className="stat-item" data-testid="stat-基因分析">
          <span>基因分析</span>
          <span>{user?.geneAnalysisCount}次</span>
        </div>
        <div className="stat-item" data-testid="stat-健康评分">
          <span>健康评分</span>
          <span>{user?.healthScore}分</span>
        </div>
        <div className="stat-item" data-testid="stat-AI助手等级">
          <span>AI助手等级</span>
          <span>{user?.aiAssistantLevel}级</span>
        </div>
      </div>

      <div className="level-progress" data-testid="level-progress">
        <div className="level-info">
          <span className="level-text" data-testid="level-display">当前等级: {user?.aiAssistantLevel}</span>
          <span className="level-text">下一等级: {user?.aiAssistantLevel + 1}</span>
        </div>
        <div
          className="progress-bar"
          data-testid="experience-bar"
          aria-valuenow={user?.experience}
          aria-valuemax="3000"
        >
          <div
            className="progress-fill"
            style={{ width: `${(user?.experience / 3000) * 100}%` }}
          />
        </div>
        <span className="experience-text" data-testid="experience-display">{user?.experience}</span>
      </div>

      <div className="feature-grid" data-testid="feature-grid">
        {[...features?.unlocked, ...features?.locked].map((feature, index) => (
          <div
            key={index}
            className="feature-card"
            data-testid="feature-card"
            data-unlocked={features?.unlocked.includes(feature).toString()}
            onClick={() => features?.unlocked.includes(feature) && handleFeatureClick(feature)}
          >
            <h3>{feature}</h3>
            {!features?.unlocked.includes(feature) && (
              <p>达到{features?.requirements[feature]}级解锁此功能</p>
            )}
          </div>
        ))}
      </div>

      {showDetails && selectedFeature && (
        <div className="feature-details" data-testid="feature-details">
          <h3>{selectedFeature}</h3>
          <p>{featureDescriptions[selectedFeature]}</p>
          <button 
            className="close-button"
            data-testid="close-details"
            onClick={handleCloseDetails}
          >
            关闭
          </button>
        </div>
      )}

      <div className="consultation-history" data-testid="consultation-history">
        <h2>咨询历史</h2>
        {consultationHistory?.map((item, index) => (
          <div 
            key={index} 
            className="history-item" 
            data-testid="history-item"
            onClick={() => {
              document.body.appendChild(
                Object.assign(document.createElement('div'), {
                  'data-testid': 'consultation-details',
                  textContent: item.summary
                })
              );
            }}
          >
            <span>{item.date}</span>
            <span>{item.type}</span>
            <p>{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalAIAssistantComponent;
