import { useState, useRef } from 'react';
import { imageAnalysis } from '../services/api';
import './ImageAnalysisComponent.css';

const ImageAnalysisComponent = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('请上传图片文件');
        setImage(null);
        setPreview('');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        setImage(null);
        setPreview('');
        return;
      }
      setImage(selectedFile);
      setError('');
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith('image/')) {
        setError('请上传图片文件');
        return;
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }
      setImage(droppedFile);
      setError('');
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('请选择要分析的图片');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('analysisType', analysisType);

    try {
      setIsLoading(true);
      setError('');
      const response = await imageAnalysis.analyze(formData);
      setSuccess('图片分析成功');
      // 触发分析结果更新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('imageAnalysisComplete', { 
          detail: response 
        }));
      }
    } catch (err) {
      setError(err.error || '图片分析失败，请重试');
    } finally {
      setIsLoading(false);
      setImage(null);
      setPreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="image-analysis-container card">
      <h3>图片分析</h3>
      <form onSubmit={handleSubmit}>
        <div className="analysis-type-selector">
          <label>分析类型：</label>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            disabled={isLoading}
          >
            <option value="general">通用分析</option>
            <option value="medical">医疗分析</option>
            <option value="pathology">病理分析</option>
          </select>
        </div>

        <div 
          className={`file-upload ${preview ? 'has-preview' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          {preview ? (
            <div className="preview-container">
              <img src={preview} alt="预览" className="preview-image" />
              <p className="file-info">
                {image?.name} ({(image?.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          ) : (
            <div className="upload-prompt">
              <p>点击或拖拽图片到此处上传</p>
              <p className="upload-hint">支持 JPG、PNG、GIF 格式，最大5MB</p>
            </div>
          )}
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <button 
          type="submit" 
          className="button" 
          disabled={!image || isLoading}
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

export default ImageAnalysisComponent;
