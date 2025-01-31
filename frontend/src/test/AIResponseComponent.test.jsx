import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from './utils/test-utils';
import AIResponseComponent from '../components/AIResponseComponent';
import store from '../utils/store';

describe('AIResponseComponent', () => {
  beforeEach(() => {
    store.setState({
      healthData: null,
      analysisResult: null,
      isLoading: false,
      error: null,
      metrics: {},
      recommendations: [],
      riskFactors: []
    });
    vi.clearAllMocks();
  });

  it('renders loading state when analysis is in progress', async () => {
    renderWithProviders(<AIResponseComponent />);
    
    await act(async () => {
      store.setState({
        healthData: { data: '最近经常感觉疲劳，睡眠质量差' },
        isLoading: true
      });
    });
    
    expect(screen.getByText('正在生成分析报告...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders analysis result with complete metrics and recommendations', async () => {
    renderWithProviders(<AIResponseComponent />);

    await act(async () => {
      store.setState({
        healthData: { data: '最近经常感觉疲劳，睡眠质量差' },
        analysisResult: {
          summary: '根据AI分析，您可能存在以下健康问题：',
          metrics: {
            healthIndex: 75,
            sleepQuality: '较差',
            stressLevel: '偏高',
            energyLevel: '偏低',
            exerciseFrequency: '不足',
            dietBalance: '一般'
          },
          recommendations: [
            '改善作息时间，保证充足睡眠',
            '增加适度运动，每周至少3次',
            '注意饮食均衡，增加蛋白质摄入',
            '适当放松，减轻压力'
          ],
          riskFactors: [
            '睡眠不足导致的免疫力下降',
            '压力过大可能影响身心健康',
            '运动量不足影响代谢功能'
          ]
        },
        isLoading: false
      });
    });

    const result = screen.getByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    
    // Verify metrics display
    const metrics = screen.getByTestId('health-metrics');
    expect(metrics).toBeInTheDocument();
    expect(metrics).toHaveTextContent('健康指数：75');
    expect(metrics).toHaveTextContent('睡眠质量：较差');
    expect(metrics).toHaveTextContent('压力水平：偏高');
    
    // Verify recommendations
    const recommendations = screen.getByTestId('recommendations');
    expect(recommendations).toBeInTheDocument();
    expect(recommendations).toHaveTextContent('改善作息时间');
    expect(recommendations).toHaveTextContent('增加适度运动');
    
    // Verify risk factors
    const risks = screen.getByTestId('risk-factors');
    expect(risks).toBeInTheDocument();
    expect(risks).toHaveTextContent('睡眠不足导致的免疫力下降');
    expect(risks).toHaveTextContent('压力过大可能影响身心健康');
  });

  it('handles various error states and retry functionality', async () => {
    renderWithProviders(<AIResponseComponent />);

    // Test network error
    await act(async () => {
      store.setState({
        healthData: { data: '测试数据' },
        error: '网络连接失败，请检查网络设置',
        isLoading: false
      });
    });

    expect(screen.getByText('网络连接失败，请检查网络设置')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /重试/ });
    expect(retryButton).toBeInTheDocument();

    // Test retry action
    await act(async () => {
      fireEvent.click(retryButton);
    });

    expect(store.getState().error).toBeNull();
    expect(store.getState().isLoading).toBe(true);

    // Test service error
    await act(async () => {
      store.setState({
        error: 'AI服务暂时不可用，请稍后再试',
        isLoading: false
      });
    });

    expect(screen.getByText('AI服务暂时不可用，请稍后再试')).toBeInTheDocument();
  });

  it('handles empty states and data validation', async () => {
    renderWithProviders(<AIResponseComponent />);

    // Test no data state
    expect(screen.getByText('请先上传健康数据文件')).toBeInTheDocument();

    // Test invalid data format
    await act(async () => {
      store.setState({
        healthData: { data: '' },
        error: '无效的健康数据格式'
      });
    });
    expect(screen.getByText('无效的健康数据格式')).toBeInTheDocument();

    // Test incomplete analysis result
    await act(async () => {
      store.setState({
        healthData: { data: '测试数据' },
        analysisResult: {
          summary: '分析结果不完整',
          metrics: {},
          recommendations: [],
          riskFactors: []
        }
      });
    });
    expect(screen.getByText('分析结果不完整')).toBeInTheDocument();
  });

  it('validates accessibility features', () => {
    renderWithProviders(<AIResponseComponent />);
    
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-label', 'AI分析结果');
    
    const sections = screen.getAllByRole('region');
    sections.forEach(section => {
      expect(section).toHaveAttribute('aria-labelledby');
    });
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('handles keyboard navigation', async () => {
    renderWithProviders(<AIResponseComponent />);
    
    await act(async () => {
      store.setState({
        healthData: { data: '测试数据' },
        analysisResult: {
          summary: '分析完成',
          recommendations: ['建议1', '建议2'],
          riskFactors: ['风险1']
        }
      });
    });

    const sections = screen.getAllByRole('region');
    sections[0].focus();
    expect(document.activeElement).toBe(sections[0]);
    
    fireEvent.keyDown(sections[0], { key: 'Tab' });
    expect(document.activeElement).toBe(sections[1]);
    
    fireEvent.keyDown(sections[1], { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(sections[0]);
  });

  it('handles analysis history loading', async () => {
    const mockHistory = [
      {
        date: '2024-01-15',
        summary: '年度体检报告显示各项指标正常',
        recommendations: ['保持良好作息', '定期运动'],
        riskFactors: ['需要增加运动量']
      }
    ];

    renderWithProviders(<AIResponseComponent />);

    await act(async () => {
      store.setState({
        healthData: { data: 'test data', history: mockHistory },
        isLoading: false
      });
    });

    await waitFor(() => {
      expect(screen.getByText('历史分析记录')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('年度体检报告显示各项指标正常')).toBeInTheDocument();
      expect(screen.getByText('保持良好作息')).toBeInTheDocument();
      expect(screen.getByText('需要增加运动量')).toBeInTheDocument();
    });
  });
});
