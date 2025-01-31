import React from 'react';
import './PlatformOverviewComponent.css';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

const PlatformOverviewComponent = () => {
  const handleFeatureKeyDown = useKeyboardNavigation('[data-testid="feature-card"]', true);
  const handleSecurityKeyDown = useKeyboardNavigation('[data-testid="security-card"]', true);
  const handleCertificationKeyDown = useKeyboardNavigation('[data-testid="certification-card"]', true);
  return (
    <div className="platform-overview" data-testid="platform-overview">
      <a href="#main-content" className="sr-only">跳转到主要内容</a>
      <header className="overview-header">
        <h1 className="overview-title" role="heading" aria-level="1">AI健康检测平台</h1>
        <p className="overview-subtitle">
          基于先进AI技术的智能健康管理系统，为您提供全方位的健康检测和个性化建议
        </p>
      </header>

      <div className="feature-grid" data-testid="feature-grid" role="list">
        <div 
          className="feature-card" 
          data-testid="feature-card" 
          tabIndex="0" 
          role="listitem" 
          aria-label="AI智能诊断功能" 
          onKeyDown={handleFeatureKeyDown}
        >
          <div className="feature-icon ai" aria-hidden="true">🤖</div>
          <h2 className="feature-title" role="heading" aria-level="2">AI智能诊断</h2>
          <p className="feature-description">
            采用DeepSeek AI模型，提供准确的健康评估和个性化建议
          </p>
          <ul className="feature-list" aria-label="AI智能诊断功能列表">
            <li>智能症状分析</li>
            <li>个性化健康建议</li>
            <li>实时健康监测</li>
            <li>风险预警提示</li>
          </ul>
        </div>

        <div 
          className="feature-card" 
          data-testid="feature-card" 
          tabIndex="0" 
          role="listitem" 
          aria-label="数据安全功能"
          onKeyDown={handleFeatureKeyDown}
        >
          <div className="feature-icon security" aria-hidden="true">🔒</div>
          <h2 className="feature-title" role="heading" aria-level="2">数据安全</h2>
          <p className="feature-description">
            采用区块链技术和高级加密算法，确保您的健康数据安全
          </p>
          <ul className="feature-list" aria-label="数据安全功能列表">
            <li>区块链存储</li>
            <li>端到端加密</li>
            <li>隐私保护</li>
            <li>安全审计</li>
          </ul>
        </div>

        <div 
          className="feature-card" 
          data-testid="feature-card" 
          tabIndex="0" 
          role="listitem" 
          aria-label="健康档案功能"
          onKeyDown={handleFeatureKeyDown}
        >
          <div className="feature-icon data" aria-hidden="true">📊</div>
          <h2 className="feature-title" role="heading" aria-level="2">健康档案</h2>
          <p className="feature-description">
            全面的健康数据管理和分析系统
          </p>
          <ul className="feature-list" aria-label="健康档案功能列表">
            <li>电子健康档案</li>
            <li>检测报告管理</li>
            <li>健康趋势分析</li>
            <li>家族病史追踪</li>
          </ul>
        </div>
      </div>

      <section className="security-section" data-testid="security-section" role="region" aria-labelledby="security-heading">
        <h2 id="security-heading" role="heading" aria-level="2">数据安全保障</h2>
        <div className="security-grid">
          <div className="security-item" data-testid="security-card" tabIndex="0" role="button" aria-label="加密存储功能" onKeyDown={handleSecurityKeyDown}>
            <h3 role="heading" aria-level="3">🔐 加密存储</h3>
            <p>采用军事级别的AES-256加密算法，确保数据存储安全</p>
          </div>
          <div className="security-item" data-testid="security-card" tabIndex="0" role="button" aria-label="区块链技术功能" onKeyDown={handleSecurityKeyDown}>
            <h3 role="heading" aria-level="3">⛓️ 区块链技术</h3>
            <p>利用区块链不可篡改特性，保证数据真实性和可追溯性</p>
          </div>
          <div className="security-item" data-testid="security-card" tabIndex="0" role="button" aria-label="访问控制功能" onKeyDown={handleSecurityKeyDown}>
            <h3 role="heading" aria-level="3">🛡️ 访问控制</h3>
            <p>严格的权限管理和访问控制机制，保护用户隐私</p>
          </div>
          <div className="security-item" data-testid="security-card" tabIndex="0" role="button" aria-label="安全审计功能" onKeyDown={handleSecurityKeyDown}>
            <h3 role="heading" aria-level="3">📝 安全审计</h3>
            <p>全程记录数据访问日志，定期安全审计</p>
          </div>
        </div>
      </section>

      <section className="certification-section" data-testid="certifications-section" role="region" aria-labelledby="cert-heading">
        <h2 id="cert-heading" role="heading" aria-level="2">平台认证</h2>
        <div className="certification-grid">
          <div className="certification-item" data-testid="certification-card" tabIndex="0" role="button" aria-label="医疗AI系统认证信息" onKeyDown={handleCertificationKeyDown}>
            <div className="certification-icon" aria-hidden="true">🏥</div>
            <h3 className="certification-title" role="heading" aria-level="3">医疗AI系统认证</h3>
            <p className="certification-description">
              通过国家医疗AI系统安全认证
            </p>
          </div>
          <div className="certification-item" data-testid="certification-card" tabIndex="0" role="button" aria-label="数据安全等级保护认证信息" onKeyDown={handleCertificationKeyDown}>
            <div className="certification-icon" aria-hidden="true">🔒</div>
            <h3 className="certification-title" role="heading" aria-level="3">数据安全等级保护</h3>
            <p className="certification-description">
              获得最高级别数据安全认证
            </p>
          </div>
          <div className="certification-item" data-testid="certification-card" tabIndex="0" role="button" aria-label="隐私保护认证信息" onKeyDown={handleCertificationKeyDown}>
            <div className="certification-icon" aria-hidden="true">📋</div>
            <h3 className="certification-title" role="heading" aria-level="3">隐私保护认证</h3>
            <p className="certification-description">
              符合国际隐私保护标准
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlatformOverviewComponent;
