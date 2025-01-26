import { useState, useEffect } from 'react';
import { imageAnalysis } from '../services/api';
import './ImageAnalysisHistory.css';

const ImageAnalysisHistory = () => {
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadAnalysisHistory();
    
    // 监听新的分析结果
    const handleNewAnalysis = (event) => {
      const newAnalysis = event.detail;
      setAnalysisResults(prev => [newAnalysis, ...prev]);
    };

    window.addEventListener('imageAnalysisComplete', handleNewAnalysis);

    return () => {
      window.removeEventListener('imageAnalysisComplete', handleNewAnalysis);
    };
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await imageAnalysis.getHistory();
      setAnalysisResults(response.history || []);
    } catch (err) {
      setError('加载分析历史失败');
      console.error('加载分析历史失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (analysisId) => {
    if (!window.confirm('确定要删除这条分析记录吗？')) {
      return;
    }

    try {
      await imageAnalysis.deleteAnalysis(analysisId);
      setAnalysisResults(prev => 
        prev.filter(analysis => analysis._id !== analysisId)
      );
    } catch (err) {
      setError('删除分析记录失败');
      console.error('删除分析记录失败:', err);
    }
  };

  const startEditNote = (analysis) => {
    setEditingNote(analysis._id);
    setNoteText(analysis.note || '');
  };

  const cancelEditNote = () => {
    setEditingNote(null);
    setNoteText('');
  };

  const saveNote = async (analysisId) => {
    try {
      await imageAnalysis.updateNote(analysisId, noteText);
      setAnalysisResults(prev => 
        prev.map(analysis => 
          analysis._id === analysisId
            ? { ...analysis, note: noteText }
            : analysis
        )
      );
      setEditingNote(null);
      setNoteText('');
    } catch (err) {
      setError('保存备注失败');
      console.error('保存备注失败:', err);
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

  if (isLoading) {
    return (
      <div className="image-history-container card">
        <h3>分析历史</h3>
        <div className="loading-container">
          <span className="loading"></span>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-history-container card">
      <h3>分析历史</h3>
      {error && <div className="error">{error}</div>}
      
      <div className="history-list">
        {analysisResults.length === 0 ? (
          <p className="no-results">暂无分析记录</p>
        ) : (
          analysisResults.map(analysis => (
            <div key={analysis._id} className="history-item">
              <div className="history-header">
                <span className="analysis-time">
                  {formatDate(analysis.timestamp)}
                </span>
                <div className="history-actions">
                  <button
                    className="button-link"
                    onClick={() => handleDelete(analysis._id)}
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="history-content">
                {analysis.imageInfo && (
                  <div className="image-info">
                    <span>文件：{analysis.imageInfo.fileName}</span>
                    <span>类型：{analysis.analysisType}</span>
                  </div>
                )}

                <div className="analysis-result">
                  {typeof analysis.result === 'string' ? (
                    <p>{analysis.result}</p>
                  ) : (
                    Object.entries(analysis.result).map(([key, value]) => (
                      <div key={key} className="result-item">
                        <strong>{key}:</strong> {value}
                      </div>
                    ))
                  )}
                </div>

                <div className="note-section">
                  {editingNote === analysis._id ? (
                    <div className="note-edit">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="添加备注..."
                        className="note-input"
                      />
                      <div className="note-actions">
                        <button
                          className="button save-button"
                          onClick={() => saveNote(analysis._id)}
                        >
                          保存
                        </button>
                        <button
                          className="button cancel-button"
                          onClick={cancelEditNote}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="note-display">
                      {analysis.note ? (
                        <>
                          <p className="note-text">{analysis.note}</p>
                          <button
                            className="button-link"
                            onClick={() => startEditNote(analysis)}
                          >
                            编辑备注
                          </button>
                        </>
                      ) : (
                        <button
                          className="button-link"
                          onClick={() => startEditNote(analysis)}
                        >
                          添加备注
                        </button>
                      )}
                    </div>
                  )}
                </div>
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

export default ImageAnalysisHistory;
