import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import useStore from '../utils/store';
import './MainLayout.css';

const MainLayout = () => {
  const { userInfo } = useStore();

  return (
    <div className="layout-container">
      <header className="header">
        <div className="header-content">
          <h1>AI健康检测平台</h1>
          <nav className="main-nav">
            <Link to="/health-assistant" className="nav-item">
              <span className="nav-icon">🤖</span>
              AI健康助手
            </Link>
            <Link to="/gene-sequencing" className="nav-item">
              <span className="nav-icon">🧬</span>
              基因测序
            </Link>
            <Link to="/health-records" className="nav-item">
              <span className="nav-icon">📋</span>
              健康档案
            </Link>
          </nav>
          {userInfo && (
            <div className="user-info">
              <span className="user-name">{userInfo.name}</span>
              <div className="security-badge" title="数据安全加密">🔒</div>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <div className="platform-status">
          <div className="status-item">
            <span className="status-icon">✓</span>
            AI系统状态: 正常运行
          </div>
          <div className="status-item">
            <span className="status-icon">🔄</span>
            数据同步: 实时
          </div>
          <div className="status-item">
            <span className="status-icon">🛡️</span>
            安全防护: 已启用
          </div>
        </div>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>平台认证</h3>
            <ul>
              <li>医疗AI系统认证</li>
              <li>数据安全等级认证</li>
              <li>隐私保护认证</li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>技术支持</h3>
            <ul>
              <li>DeepSeek AI</li>
              <li>区块链存储</li>
              <li>实时分析引擎</li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>服务保障</h3>
            <ul>
              <li>24/7系统监控</li>
              <li>专业医疗顾问</li>
              <li>数据安全保障</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 AI健康检测平台 - 您的智能健康管理专家</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
