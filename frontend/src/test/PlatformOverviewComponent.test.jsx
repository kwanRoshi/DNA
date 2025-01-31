import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import PlatformOverviewComponent from '../components/PlatformOverviewComponent';
import { render } from './utils/test-utils';

describe('PlatformOverviewComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders platform overview with complete information', () => {
    const { container } = render(<PlatformOverviewComponent />);
    
    expect(screen.getByText('AI健康检测平台')).toBeInTheDocument();
    expect(screen.getByText(/基于先进AI技术的智能健康管理系统/)).toBeInTheDocument();
    expect(container.querySelector('[data-testid="platform-overview"]')).toBeInTheDocument();
  });

  test('displays and interacts with core features', () => {
    render(<PlatformOverviewComponent />);
    
    const features = screen.getAllByTestId('feature-card');
    expect(features).toHaveLength(3);
    
    const aiDiagnostics = screen.getByText('AI智能诊断').closest('div');
    expect(aiDiagnostics).toHaveAttribute('role', 'listitem');
    expect(aiDiagnostics).toHaveAttribute('aria-label', 'AI智能诊断功能');
    
    expect(screen.getByText('智能症状分析')).toBeInTheDocument();
    expect(screen.getByText('个性化健康建议')).toBeInTheDocument();
    expect(screen.getByText('实时健康监测')).toBeInTheDocument();
  });

  test('validates security measures section', () => {
    render(<PlatformOverviewComponent />);
    
    const securitySection = screen.getByTestId('security-section');
    expect(securitySection).toBeInTheDocument();
    expect(securitySection).toHaveAttribute('role', 'region');
    expect(securitySection).toHaveAttribute('aria-labelledby', 'security-heading');
    
    const securityCards = screen.getAllByTestId('security-card');
    expect(securityCards).toHaveLength(4);
    
    expect(screen.getByText('🔐 加密存储')).toBeInTheDocument();
    expect(screen.getByText('⛓️ 区块链技术')).toBeInTheDocument();
    expect(screen.getByText('🛡️ 访问控制')).toBeInTheDocument();
    expect(screen.getByText('📝 安全审计')).toBeInTheDocument();
  });

  test('verifies platform certifications display', () => {
    render(<PlatformOverviewComponent />);
    
    const certSection = screen.getByTestId('certifications-section');
    expect(certSection).toBeInTheDocument();
    expect(certSection).toHaveAttribute('role', 'region');
    expect(certSection).toHaveAttribute('aria-labelledby', 'cert-heading');
    
    expect(screen.getByText('医疗AI系统认证')).toBeInTheDocument();
    expect(screen.getByText('数据安全等级保护')).toBeInTheDocument();
    expect(screen.getByText('隐私保护认证')).toBeInTheDocument();
  });

  test('validates feature descriptions', () => {
    render(<PlatformOverviewComponent />);
    
    expect(screen.getByText(/采用DeepSeek AI模型/)).toBeInTheDocument();
    expect(screen.getByText(/采用区块链技术和高级加密算法/)).toBeInTheDocument();
    expect(screen.getByText(/全面的健康数据管理和分析系统/)).toBeInTheDocument();
    
    expect(screen.getByText('电子健康档案')).toBeInTheDocument();
    expect(screen.getByText('检测报告管理')).toBeInTheDocument();
    expect(screen.getByText('健康趋势分析')).toBeInTheDocument();
    expect(screen.getByText('家族病史追踪')).toBeInTheDocument();
  });

  test('validates accessibility features', () => {
    const { container } = render(<PlatformOverviewComponent />);
    
    // Test skip link
    const skipLink = screen.getByText('跳转到主要内容');
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveClass('sr-only');
    
    // Test heading hierarchy
    const headings = container.querySelectorAll('[role="heading"]');
    headings.forEach(heading => {
      expect(heading).toHaveAttribute('aria-level');
    });
    
    // Test interactive elements
    const interactiveElements = container.querySelectorAll('[role="listitem"]');
    interactiveElements.forEach(element => {
      expect(element).toHaveAttribute('tabindex', '0');
      expect(element).toHaveAttribute('aria-label');
    });
    
    // Test regions
    const regions = container.querySelectorAll('[role="region"]');
    regions.forEach(region => {
      expect(region).toHaveAttribute('aria-labelledby');
    });
  });

  test('validates keyboard navigation with useKeyboardNavigation hook', async () => {
    render(<PlatformOverviewComponent />);
    
    const featureCards = screen.getAllByTestId('feature-card');
    const securityCards = screen.getAllByTestId('security-card');
    const certificationCards = screen.getAllByTestId('certification-card');
    
    // Test feature cards keyboard navigation
    featureCards[0].focus();
    expect(document.activeElement).toBe(featureCards[0]);
    
    // Test Tab navigation
    fireEvent.keyDown(featureCards[0], { key: 'Tab' });
    expect(document.activeElement).toBe(featureCards[1]);
    
    // Test arrow key navigation
    fireEvent.keyDown(featureCards[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(featureCards[2]);
    
    fireEvent.keyDown(featureCards[2], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(featureCards[1]);
    
    // Test IME composition state
    fireEvent.compositionStart(featureCards[1]);
    fireEvent.keyDown(featureCards[1], { key: 'ArrowRight', isComposing: true });
    expect(document.activeElement).toBe(featureCards[1]);
    fireEvent.compositionEnd(featureCards[1]);
    
    // Test security cards keyboard navigation
    securityCards[0].focus();
    expect(document.activeElement).toBe(securityCards[0]);
    
    // Test Tab + Shift navigation
    fireEvent.keyDown(securityCards[0], { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(securityCards[3]);
    
    // Test arrow key navigation
    fireEvent.keyDown(securityCards[3], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(securityCards[0]);
    
    // Test certification cards keyboard navigation
    certificationCards[0].focus();
    expect(document.activeElement).toBe(certificationCards[0]);
    
    // Test Enter key (should not change focus)
    fireEvent.keyDown(certificationCards[0], { key: 'Enter' });
    expect(document.activeElement).toBe(certificationCards[0]);
    
    // Test Space key (should not change focus)
    fireEvent.keyDown(certificationCards[0], { key: ' ' });
    expect(document.activeElement).toBe(certificationCards[0]);
  });

  test('handles Chinese IME input correctly', async () => {
    render(<PlatformOverviewComponent />);
    
    const featureCards = screen.getAllByTestId('feature-card');
    const securityCards = screen.getAllByTestId('security-card');
    
    // Test IME composition events
    featureCards[0].focus();
    fireEvent.compositionStart(featureCards[0]);
    fireEvent.input(featureCards[0], { target: { value: '健' }, isComposing: true });
    expect(document.activeElement).toBe(featureCards[0]);
    
    // Test IME composition with arrow keys
    fireEvent.keyDown(featureCards[0], { key: 'ArrowRight', isComposing: true });
    expect(document.activeElement).toBe(featureCards[0]);
    
    // Test IME composition with Tab
    fireEvent.keyDown(featureCards[0], { key: 'Tab', isComposing: true });
    expect(document.activeElement).toBe(featureCards[0]);
    
    // Test IME composition end
    fireEvent.compositionEnd(featureCards[0], { data: '健康' });
    fireEvent.input(featureCards[0], { target: { value: '健康' }, isComposing: false });
    
    // Test navigation after IME
    fireEvent.keyDown(featureCards[0], { key: 'Tab' });
    expect(document.activeElement).toBe(featureCards[1]);
    
    // Test Chinese text input during IME composition
    const featureDescription = screen.getByText(/采用DeepSeek AI模型/).closest('p');
    featureDescription.focus();
    fireEvent.compositionStart(featureDescription);
    fireEvent.input(featureDescription, { target: { textContent: '健' }, isComposing: true });
    fireEvent.input(featureDescription, { target: { textContent: '健康' }, isComposing: true });
    fireEvent.input(featureDescription, { target: { textContent: '健康检' }, isComposing: true });
    fireEvent.compositionEnd(featureDescription, { data: '健康检测' });
    fireEvent.input(featureDescription, { target: { textContent: '健康检测' }, isComposing: false });
    expect(featureDescription.textContent).toContain('健康检测');
  });

  test('validates Chinese text content', () => {
    render(<PlatformOverviewComponent />);
    
    // Test main headings
    expect(screen.getByText('AI健康检测平台')).toBeInTheDocument();
    expect(screen.getByText(/基于先进AI技术的智能健康管理系统/)).toBeInTheDocument();
    
    // Test feature cards
    expect(screen.getByText('智能症状分析')).toBeInTheDocument();
    expect(screen.getByText('个性化健康建议')).toBeInTheDocument();
    expect(screen.getByText('实时健康监测')).toBeInTheDocument();
    expect(screen.getByText('风险预警提示')).toBeInTheDocument();
    
    // Test security measures
    expect(screen.getByText('🔐 加密存储')).toBeInTheDocument();
    expect(screen.getByText(/采用军事级别的AES-256加密算法/)).toBeInTheDocument();
    expect(screen.getByText('⛓️ 区块链技术')).toBeInTheDocument();
    expect(screen.getByText(/利用区块链不可篡改特性/)).toBeInTheDocument();
    
    // Test certifications
    expect(screen.getByText('医疗AI系统认证')).toBeInTheDocument();
    expect(screen.getByText('数据安全等级保护')).toBeInTheDocument();
    expect(screen.getByText('隐私保护认证')).toBeInTheDocument();
  });

  test('validates screen reader accessibility', () => {
    const { container } = render(<PlatformOverviewComponent />);
    
    // Test skip link
    const skipLink = screen.getByText('跳转到主要内容');
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveClass('sr-only');
    
    // Test heading hierarchy
    const headings = container.querySelectorAll('[role="heading"]');
    const headingLevels = Array.from(headings).map(h => h.getAttribute('aria-level'));
    expect(headingLevels).toContain('1');
    expect(headingLevels).toContain('2');
    expect(headingLevels).toContain('3');
    
    // Test ARIA regions
    const regions = container.querySelectorAll('[role="region"]');
    regions.forEach(region => {
      expect(region).toHaveAttribute('aria-labelledby');
      const labelId = region.getAttribute('aria-labelledby');
      const label = container.querySelector(`#${labelId}`);
      expect(label).toBeInTheDocument();
    });
    
    // Test interactive elements
    const interactiveElements = container.querySelectorAll('[role="listitem"]');
    interactiveElements.forEach(element => {
      expect(element).toHaveAttribute('tabindex', '0');
      expect(element).toHaveAttribute('aria-label');
    });
  });
});
