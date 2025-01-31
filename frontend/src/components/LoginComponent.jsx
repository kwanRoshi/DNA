import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../utils/store';
import './LoginComponent.css';

const LoginComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const store = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await store.login({
        token: 'dummy-token',
        userId: 'guest-user',
        userInfo: { name: 'Guest User' }
      });
      navigate('/dashboard');
    } catch (error) {
      setError('登录失败');
      console.error('Login error:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>AI健康检测平台</h2>
        <p>欢迎使用智能健康检测系统</p>

        {error && <div data-testid="error-message" className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <button 
            type="submit" 
            data-testid="login-button"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div data-testid="loading-state">
                <span className="loading-spinner"></span>
                登录中...
              </div>
            ) : '开始使用'}
          </button>
        </form>
      </div>

      <style>{`
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 8px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoginComponent;
