import { useState, useRef } from 'react';
import { healthData } from '../services/api';
import './DataFormComponent.css';

const DataFormComponent = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const maxSize = import.meta.env.VITE_MAX_UPLOAD_SIZE || 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/plain') {
        setError('请上传txt格式的文件');
        setFile(null);
        return;
      }
      if (selectedFile.size > maxSize) {
        setError(`文件大小不能超过${maxSize / 1024 / 1024}MB`);
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'text/plain') {
        setError('请上传txt格式的文件');
        return;
      }
      if (droppedFile.size > maxSize) {
        setError(`文件大小不能超过${maxSize / 1024 / 1024}MB`);
        return;
      }
      setFile(droppedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('请选择要上传的文件');
      return;
    }

    const formData = new FormData();
    formData.append('healthData', file);

    try {
      setIsLoading(true);
      setError('');
      setUploadProgress(0);

      // 验证登录状态
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录后再上传文件');
        return;
      }

      const response = await healthData.analyze(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setSuccess('数据分析成功');
      // 触发分析结果更新
      window.dispatchEvent(new CustomEvent('analysisComplete', { 
        detail: response 
      }));
    } catch (err) {
      console.error('分析失败:', err);
      if (err.status === 'network_error') {
        setError('网络连接失败，请检查网络设置后重试');
      } else if (err.status === 'unauthorized') {
        setError('登录已过期，请重新登录');
      } else {
        setError(err.message || '数据分析失败，请重试');
      }
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="data-form-container card">
      <h3>健康数据分析</h3>
      <form onSubmit={handleSubmit}>
        <div 
          className={`file-upload ${isLoading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt"
            style={{ display: 'none' }}
            disabled={isLoading}
            data-testid="file-input"
          />
          {isLoading ? (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p>{uploadProgress}% 上传中...</p>
            </div>
          ) : file ? (
            <div className="file-info">
              <p>已选择文件：{file.name}</p>
              <p>大小：{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="upload-prompt">
              <p>点击或拖拽文件到此处上传</p>
              <p className="upload-hint">支持 .txt 格式，最大{maxSize / 1024 / 1024}MB</p>
            </div>
          )}
        </div>
        {error && <div className="error" data-testid="error-message">{error}</div>}
        {success && <div className="success" data-testid="success-message">{success}</div>}
        <button 
          type="submit" 
          className="button" 
          disabled={!file || isLoading}
          data-testid="submit-button"
        >
          {isLoading ? (
            <>
              <span className="loading"></span>
              <span>分析中...</span>
            </>
          ) : (
            '开始分析'
          )}
        </button>
      </form>
    </div>
  );
};

export default DataFormComponent;
