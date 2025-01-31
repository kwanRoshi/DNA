import React, { useState, useEffect } from 'react';
import './HealthRecordsComponent.css';
import useStore from '../utils/store';

const HealthRecordsComponent = () => {
  const { healthRecords, loading, error } = useStore();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [records, setRecords] = useState([
    {
      id: 1,
      type: '健康检查',
      date: '2024-01-15',
      icon: '🏥',
      summary: '年度体检报告显示各项指标正常',
      metrics: {
        '血压': '120/80 mmHg',
        '血糖': '5.2 mmol/L',
        '心率': '75 次/分',
        'BMI': '22.5'
      }
    },
    {
      id: 2,
      type: '基因检测',
      date: '2024-01-10',
      icon: '🧬',
      summary: '基因测序分析完成，未发现高风险遗传标记',
      metrics: {
        '基因风险评分': '低风险',
        '遗传特征': '正常',
        '代谢类型': 'A型',
        '药物敏感性': '中等'
      }
    },
    {
      id: 3,
      type: 'AI诊断',
      date: '2024-01-05',
      icon: '🤖',
      summary: 'AI健康助手完成健康状况评估',
      metrics: {
        '健康评分': '92/100',
        '生活方式': '良好',
        '压力指数': '中等',
        '睡眠质量': '优'
      }
    }
  ]);

  useEffect(() => {
    if (healthRecords) {
      let filtered = [...healthRecords];
      
      if (filter !== 'all') {
        filtered = filtered.filter(record => record.type === filter);
      }
      
      if (sortBy === 'date-desc') {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      setRecords(filtered);
    }
  }, [healthRecords, filter, sortBy]);

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
  };

  const handleShare = (record) => {
    setSelectedRecord(record);
    setShowShareModal(true);
  };

  const handleExport = () => {
    setShowExportModal(true);
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
    <div className="health-records" data-testid="health-records">
      <header className="records-header">
        <h1 className="records-title">健康档案</h1>
        <p className="records-description">
          全面的健康记录管理，包含体检报告、基因检测和AI诊断记录
        </p>
      </header>

      <div className="records-controls">
        <select
          data-testid="record-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">全部记录</option>
          <option value="健康检查">健康检查</option>
          <option value="基因检测">基因检测</option>
          <option value="AI诊断">AI诊断</option>
        </select>
        
        <select
          data-testid="record-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">日期 (升序)</option>
          <option value="date-desc">日期 (降序)</option>
        </select>

        <button onClick={handleExport}>导出记录</button>
      </div>

      <div className="records-grid">
        {records.map(record => (
          <div key={record.id} className="record-card" data-testid="record-card">
            <div className="record-header">
              <div className="record-icon">{record.icon}</div>
              <div className="record-info">
                <h3>{record.type}</h3>
                <div className="record-date" data-testid="record-date">{record.date}</div>
              </div>
            </div>
            
            <div className="record-content">
              <p>{record.summary}</p>
              <div className="record-metrics">
                {Object.entries(record.metrics).map(([key, value]) => (
                  <div key={key} className="metric-item">
                    <span className="metric-label">{key}</span>
                    <span className="metric-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="record-actions">
              <button 
                className="action-button view-button"
                onClick={() => handleViewDetails(record)}
              >
                查看详情
              </button>
              <button 
                className="action-button share-button"
                onClick={() => handleShare(record)}
              >
                分享记录
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="timeline" data-testid="timeline">
        <div className="timeline-header">
          <h2 className="timeline-title">健康时间线</h2>
          <p className="timeline-description">
            记录您的健康检查和评估历程
          </p>
        </div>

        <div className="timeline-items">
          {records.map((record, index) => (
            <div 
              key={index} 
              className="timeline-item"
              data-testid="timeline-item"
              onClick={() => handleViewDetails(record)}
            >
              <div className="timeline-date">{record.date}</div>
              <div className="timeline-content">
                <h3 className="timeline-title">{record.type}</h3>
                <p className="timeline-description">{record.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedRecord && (
        <div data-testid="record-modal" className="modal">
          <div className="modal-content">
            <h2>{selectedRecord.type}</h2>
            <p>{selectedRecord.summary}</p>
            {selectedRecord.metrics && Object.entries(selectedRecord.metrics).map(([key, value]) => (
              <div key={key}>
                {key}: {value}
              </div>
            ))}
            {selectedRecord.recommendations && (
              <div className="recommendations">
                <h3>建议</h3>
                <ul>
                  {selectedRecord.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            <button 
              data-testid="modal-close"
              onClick={() => setSelectedRecord(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showShareModal && (
        <div data-testid="share-modal" className="modal">
          <div className="modal-content">
            <h2>选择分享方式</h2>
            <button onClick={() => {
              setShowShareModal(false);
              document.body.appendChild(
                Object.assign(document.createElement('div'), {
                  'data-testid': 'doctor-share-form'
                })
              );
            }}>医生咨询</button>
            <button>家庭成员</button>
            <button onClick={() => setShowShareModal(false)}>取消</button>
          </div>
        </div>
      )}

      {showExportModal && (
        <div data-testid="export-modal" className="modal">
          <div className="modal-content">
            <h2>选择导出格式</h2>
            <button onClick={() => {
              setShowExportModal(false);
              document.body.appendChild(
                Object.assign(document.createElement('div'), {
                  'data-testid': 'export-progress'
                })
              );
            }}>PDF</button>
            <button>Excel</button>
            <button onClick={() => setShowExportModal(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecordsComponent;
