import React from 'react';
import { render, screen, fireEvent, waitFor, within } from './utils/test-utils';
import { describe, test, expect, beforeEach } from 'vitest';
import PersonalAIAssistantComponent from '../components/PersonalAIAssistantComponent';
import { mockStore } from './setup';

const featureDescriptions = {
  '智能诊断': '基于DeepSeek AI的智能症状分析和健康建议',
  '基因解读': '专业的基因测序数据分析和健康风险评估',
  '健康追踪': '全面的健康数据追踪和趋势分析',
  '个性化建议': '基于AI分析的个性化健康和生活方式建议',
  '深度分析': '多维度健康数据的深度分析和预测',
  '专家咨询': '与AI专家系统进行深度健康咨询'
};

describe('PersonalAIAssistantComponent', () => {
  beforeEach(() => {
    mockStore.setState({
      user: {
        id: '123',
        name: '张三',
        aiAssistantLevel: 3,
        experience: 2800,
        consultationCount: 28,
        geneAnalysisCount: 3,
        healthScore: 92
      },
      features: {
        unlocked: [
          '智能诊断',
          '基因解读',
          '健康追踪',
          '个性化建议',
          '深度分析'
        ],
        locked: ['专家咨询'],
        requirements: {
          '专家咨询': 4
        }
      },
      consultationHistory: [
        {
          id: 1,
          type: '健康咨询',
          date: '2024-01-15',
          summary: '日常健康状况评估'
        },
        {
          id: 2,
          type: '基因解读',
          date: '2024-01-10',
          summary: '遗传风险分析'
        }
      ]
    });
  });

  test('renders personal AI assistant interface with complete information', () => {
    const { container } = render(<PersonalAIAssistantComponent />);
    
    expect(screen.getByText('我的AI助手')).toBeInTheDocument();
    expect(screen.getByText(/您的个性化健康管理专家/)).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ai-assistant"]')).toBeInTheDocument();
  });

  test('displays and validates user profile statistics', async () => {
    const { findTextWithin } = render(<PersonalAIAssistantComponent />);
    
    const stats = [
      { label: '健康咨询', value: mockStore.getState().user.consultationCount + '次' },
      { label: '基因分析', value: mockStore.getState().user.geneAnalysisCount + '次' },
      { label: '健康评分', value: mockStore.getState().user.healthScore + '分' },
      { label: 'AI助手等级', value: mockStore.getState().user.aiAssistantLevel + '级' }
    ];

    for (const stat of stats) {
      const statElement = screen.getByTestId(`stat-${stat.label}`);
      expect(statElement).toBeInTheDocument();
      expect(statElement).toHaveTextContent(stat.value);
    }
  });

  test('handles AI level progress and experience display', async () => {
    render(<PersonalAIAssistantComponent />);
    
    const levelSection = screen.getByTestId('level-progress');
    expect(levelSection).toBeInTheDocument();
    
    expect(screen.getByText('当前等级: 3')).toBeInTheDocument();
    expect(screen.getByText('下一等级: 4')).toBeInTheDocument();
    
    const progressBar = screen.getByTestId('experience-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '2800');
    expect(progressBar).toHaveAttribute('aria-valuemax', '3000');
  });

  test('validates feature cards and unlock status', async () => {
    const { findTextWithin } = render(<PersonalAIAssistantComponent />);
    
    const featureCards = screen.getAllByTestId('feature-card');
    const totalFeatures = mockStore.getState().features.unlocked.length + mockStore.getState().features.locked.length;
    expect(featureCards).toHaveLength(totalFeatures);
    
    // Test unlocked features
    for (const feature of mockStore.getState().features.unlocked) {
      const card = screen.getByText(feature).closest('[data-testid="feature-card"]');
      expect(card).toHaveAttribute('data-unlocked', 'true');
      
      fireEvent.click(card);
      const details = await screen.findByTestId('feature-details');
      expect(details).toBeVisible();
      expect(details).toHaveTextContent(feature);
      expect(details).toHaveTextContent(featureDescriptions[feature]);
      
      const closeButton = screen.getByTestId('close-details');
      fireEvent.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByTestId('feature-details')).not.toBeInTheDocument();
      });
    }
    
    // Test locked features
    for (const feature of mockStore.getState().features.locked) {
      const card = screen.getByText(feature).closest('[data-testid="feature-card"]');
      expect(card).toHaveAttribute('data-unlocked', 'false');
      expect(card).toHaveTextContent(`达到${mockStore.getState().features.requirements[feature]}级解锁此功能`);
      
      fireEvent.click(card);
      await waitFor(() => {
        expect(screen.queryByTestId('feature-details')).not.toBeInTheDocument();
      });
    }
  });

  test('displays and interacts with consultation history', async () => {
    render(<PersonalAIAssistantComponent />);
    
    const historySection = screen.getByTestId('consultation-history');
    expect(historySection).toBeInTheDocument();
    
    const historyItems = screen.getAllByTestId('history-item');
    expect(historyItems).toHaveLength(2);
    
    fireEvent.click(historyItems[0]);
    await waitFor(() => {
      expect(screen.getByTestId('consultation-details')).toBeInTheDocument();
      expect(screen.getByText('日常健康状况评估')).toBeInTheDocument();
    });
  });

  test('handles feature interaction and feedback', async () => {
    const { findTextWithin } = render(<PersonalAIAssistantComponent />);
    
    const features = {
      '智能诊断': '基于DeepSeek AI的智能症状分析和健康建议',
      '基因解读': '专业的基因测序数据分析和健康风险评估',
      '健康追踪': '全面的健康数据追踪和趋势分析',
      '个性化建议': '基于AI分析的个性化健康和生活方式建议',
      '深度分析': '多维度健康数据的深度分析和预测'
    };

    for (const [feature, description] of Object.entries(features)) {
      const card = screen.getByText(feature).closest('[data-testid="feature-card"]');
      fireEvent.click(card);
      
      const details = await screen.findByTestId('feature-details');
      expect(details).toBeVisible();
      
      const desc = await findTextWithin(details, description);
      expect(desc).toBeInTheDocument();
      
      const closeButton = screen.getByTestId('close-details');
      fireEvent.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByTestId('feature-details')).not.toBeInTheDocument();
      });
    }
  });

  test('validates responsive layout and mobile view', async () => {
    const { container } = render(<PersonalAIAssistantComponent />);
    
    const mainContent = screen.getByTestId('ai-assistant');
    expect(mainContent).toBeInTheDocument();
    
    const featureGrid = screen.getByTestId('feature-grid');
    expect(featureGrid).toBeInTheDocument();
    
    // Test mobile view
    Object.defineProperty(window, 'innerWidth', { value: 480 });
    window.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      const computedStyle = getComputedStyle(featureGrid);
      expect(computedStyle.gridTemplateColumns).toMatch(/1fr/);
      expect(computedStyle.gap).toBe('1rem');
    });
  });

  test('handles loading and error states with retry functionality', async () => {
    const { findLoadingState, findErrorMessage } = render(<PersonalAIAssistantComponent />);
    
    // Test loading state
    mockStore.setState({ loading: true });
    const loadingElement = await findLoadingState();
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveTextContent('加载中');
    
    // Test error state
    mockStore.setState({ loading: false, error: '网络连接错误，请稍后重试' });
    const errorElement = await findErrorMessage();
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('网络连接错误');
    
    // Test retry functionality
    const retryButton = screen.getByRole('button', { name: /重试/ });
    await act(async () => {
      fireEvent.click(retryButton);
    });
    
    await waitFor(() => {
      expect(mockStore.getState().error).toBeNull();
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  test('validates AI assistant experience progression and feature unlocking', async () => {
    const { findTextWithin } = render(<PersonalAIAssistantComponent />);
    
    const initialExperience = mockStore.getState().user.experience;
    const initialLevel = mockStore.getState().user.aiAssistantLevel;
    
    // Test experience gain
    mockStore.setState({
      user: {
        ...mockStore.getState().user,
        experience: initialExperience + 300,
        aiAssistantLevel: initialLevel + 1
      },
      features: {
        ...mockStore.getState().features,
        unlocked: [...mockStore.getState().features.unlocked, '专家咨询'],
        locked: mockStore.getState().features.locked.filter(f => f !== '专家咨询')
      }
    });

    await waitFor(() => {
      const levelDisplay = screen.getByTestId('level-display');
      expect(levelDisplay).toHaveTextContent(`当前等级: ${initialLevel + 1}`);
      expect(screen.getByTestId('experience-display')).toHaveTextContent(`${initialExperience + 300}`);
    });

    // Test newly unlocked feature
    const expertConsultCard = screen.getByText('专家咨询').closest('[data-testid="feature-card"]');
    expect(expertConsultCard).toHaveAttribute('data-unlocked', 'true');
    
    fireEvent.click(expertConsultCard);
    const details = await screen.findByTestId('feature-details');
    expect(details).toBeVisible();
    expect(details).toHaveTextContent('专家咨询');
    expect(details).toHaveTextContent('与AI专家系统进行深度健康咨询');
  });

  test('handles feature interactions and state updates comprehensively', async () => {
    const { findTextWithin } = render(<PersonalAIAssistantComponent />);
    
    // Test unlocked feature interaction
    const unlockedFeature = mockStore.getState().features.unlocked[0];
    const featureCard = screen.getByText(unlockedFeature).closest('[data-testid="feature-card"]');
    
    fireEvent.click(featureCard);
    const details = await screen.findByTestId('feature-details');
    expect(details).toBeVisible();
    expect(details).toHaveTextContent(unlockedFeature);
    expect(details).toHaveTextContent(featureDescriptions[unlockedFeature]);
    
    // Test feature details close
    const closeButton = screen.getByTestId('close-details');
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByTestId('feature-details')).not.toBeInTheDocument();
    });
    
    // Test locked feature interaction
    const lockedFeature = mockStore.getState().features.locked[0];
    const lockedCard = screen.getByText(lockedFeature).closest('[data-testid="feature-card"]');
    fireEvent.click(lockedCard);
    expect(screen.queryByTestId('feature-details')).not.toBeInTheDocument();
    
    // Test feature unlock
    mockStore.setState({
      features: {
        ...mockStore.getState().features,
        unlocked: [...mockStore.getState().features.unlocked, lockedFeature],
        locked: []
      }
    });
    
    const newlyUnlockedCard = screen.getByText(lockedFeature).closest('[data-testid="feature-card"]');
    expect(newlyUnlockedCard).toHaveAttribute('data-unlocked', 'true');
  });

  test('validates consultation history interaction and updates', async () => {
    render(<PersonalAIAssistantComponent />);
    
    const mockHistory = mockStore.getState().consultationHistory;
    const historyItems = screen.getAllByTestId('history-item');
    expect(historyItems).toHaveLength(mockHistory.length);
    
    // Test existing history items
    for (const [index, item] of mockHistory.entries()) {
      const historyElement = historyItems[index];
      expect(historyElement).toHaveTextContent(item.date);
      expect(historyElement).toHaveTextContent(item.type);
      expect(historyElement).toHaveTextContent(item.summary);
      
      fireEvent.click(historyElement);
      await waitFor(() => {
        const details = screen.getByTestId('consultation-details');
        expect(details).toBeInTheDocument();
        expect(details).toHaveTextContent(item.summary);
      });
    }
    
    // Test history update
    const newConsultation = {
      id: 3,
      type: '健康评估',
      date: '2024-01-20',
      summary: '新的健康评估记录'
    };
    
    mockStore.setState({
      consultationHistory: [...mockHistory, newConsultation]
    });
    
    await waitFor(() => {
      const updatedHistoryItems = screen.getAllByTestId('history-item');
      expect(updatedHistoryItems).toHaveLength(mockHistory.length + 1);
      expect(updatedHistoryItems[mockHistory.length]).toHaveTextContent(newConsultation.summary);
    });
  });

  test('validates responsive layout and mobile view with style changes', async () => {
    const { container } = render(<PersonalAIAssistantComponent />);
    
    const mainContent = screen.getByTestId('ai-assistant');
    const featureGrid = screen.getByTestId('feature-grid');
    const consultationHistory = screen.getByTestId('consultation-history');
    
    expect(mainContent).toBeInTheDocument();
    expect(featureGrid).toBeInTheDocument();
    expect(consultationHistory).toBeInTheDocument();
    
    // Test mobile layout
    Object.defineProperty(window, 'innerWidth', { value: 480 });
    window.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      const computedStyle = getComputedStyle(featureGrid);
      expect(computedStyle.gridTemplateColumns).toMatch(/1fr/);
      expect(computedStyle.gap).toBe('1rem');
      
      const historyStyle = getComputedStyle(consultationHistory);
      expect(historyStyle.padding).toBe('1rem');
    });
  });
});
