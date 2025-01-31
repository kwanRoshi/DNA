import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import HealthRecordsComponent from '../components/HealthRecordsComponent';
import { renderWithProviders } from './utils/test-utils';
import store from '../utils/store';

describe('HealthRecordsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.setState({
      healthRecords: [
        {
          id: 1,
          type: '健康检查',
          date: '2024-01-15',
          summary: '年度体检报告显示各项指标正常',
          metrics: {
            '血压': '120/80 mmHg',
            '血糖': '5.2 mmol/L',
            '心率': '75 次/分',
            'BMI': '22.5'
          },
          recommendations: ['保持良好的生活习惯', '定期复查'],
          riskFactors: []
        },
        {
          id: 2,
          type: '基因检测',
          date: '2024-01-10',
          summary: '基因测序分析完成，未发现高风险遗传标记',
          metrics: {
            '基因风险评分': '低风险',
            '遗传特征': '正常',
            '代谢类型': 'A型',
            '药物敏感性': '中等'
          },
          recommendations: ['定期进行基因筛查', '关注家族病史'],
          riskFactors: ['药物代谢异常风险']
        },
        {
          id: 3,
          type: 'AI诊断',
          date: '2024-01-05',
          summary: 'AI健康助手完成健康状况评估',
          metrics: {
            '健康评分': '92/100',
            '生活方式': '良好',
            '压力指数': '中等',
            '睡眠质量': '优'
          },
          recommendations: ['保持规律作息', '适度运动'],
          riskFactors: ['轻度压力']
        }
      ],
      loading: false,
      error: null,
      filters: {
        type: 'all',
        dateRange: 'all',
        sortBy: 'date'
      }
    });
  });

  test('renders health records interface with complete information', () => {
    const { container } = renderWithProviders(<HealthRecordsComponent />);
    
    expect(screen.getByText('健康档案')).toBeInTheDocument();
    expect(screen.getByText(/全面的健康记录管理/)).toBeInTheDocument();
    expect(container.querySelector('[data-testid="health-records"]')).toBeInTheDocument();
  });

  test('displays and interacts with health record cards', async () => {
    const { findHealthMetrics, findTextWithin } = renderWithProviders(<HealthRecordsComponent />);
    
    const recordCards = screen.getAllByTestId('record-card');
    expect(recordCards).toHaveLength(3);
    
    const firstRecord = recordCards[0];
    const viewButton = within(firstRecord).getByRole('button', { name: /查看详情/ });
    fireEvent.click(viewButton);
    
    const recordDetails = await screen.findByTestId('record-details');
    expect(recordDetails).toBeInTheDocument();
    
    const metrics = await findHealthMetrics();
    expect(metrics).toBeInTheDocument();
    
    const bloodPressure = await findTextWithin(recordDetails, '血压: 120/80 mmHg');
    expect(bloodPressure).toBeInTheDocument();
    
    const recommendation = await findTextWithin(recordDetails, '保持良好的生活习惯');
    expect(recommendation).toBeInTheDocument();
  });

  test('validates record metrics display and interaction', async () => {
    const { findHealthMetrics, findTextWithin } = renderWithProviders(<HealthRecordsComponent />);
    
    const recordCards = screen.getAllByTestId('record-card');
    
    for (const card of recordCards) {
      const viewButton = within(card).getByRole('button', { name: /查看详情/ });
      fireEvent.click(viewButton);
      
      const metrics = await findHealthMetrics();
      expect(metrics).toBeInTheDocument();
      
      const type = within(card).getByRole('heading').textContent;
      const record = store.getState().healthRecords.find(r => r.type === type);
      
      const recordDetails = await screen.findByTestId('record-details');
      
      for (const [key, value] of Object.entries(record.metrics)) {
        const metricText = await findTextWithin(recordDetails, `${key}: ${value}`);
        expect(metricText).toBeInTheDocument();
      }

      for (const recommendation of record.recommendations) {
        const recText = await findTextWithin(recordDetails, recommendation);
        expect(recText).toBeInTheDocument();
      }
      
      // Close details to prepare for next card
      const closeButton = screen.getByRole('button', { name: /关闭/ });
      fireEvent.click(closeButton);
    }
  });

  test('handles record sharing functionality', async () => {
    renderWithProviders(<HealthRecordsComponent />);
    
    const shareButtons = screen.getAllByText('分享记录');
    fireEvent.click(shareButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('share-modal')).toBeInTheDocument();
      expect(screen.getByText('选择分享方式')).toBeInTheDocument();
      expect(screen.getByText('医生咨询')).toBeInTheDocument();
      expect(screen.getByText('家庭成员')).toBeInTheDocument();
    });

    const doctorShare = screen.getByText('医生咨询');
    fireEvent.click(doctorShare);
    expect(screen.getByTestId('doctor-share-form')).toBeInTheDocument();
  });

  test('validates timeline display and navigation', async () => {
    const { container } = renderWithProviders(<HealthRecordsComponent />);
    
    const timeline = screen.getByTestId('timeline');
    expect(timeline).toBeInTheDocument();
    
    const timelineItems = container.querySelectorAll('.timeline-item');
    expect(timelineItems).toHaveLength(3);
    
    for (const item of timelineItems) {
      fireEvent.click(item);
      await waitFor(() => {
        expect(screen.getByTestId('record-details')).toBeInTheDocument();
      });
    }
  });

  test('handles record filtering and sorting', async () => {
    renderWithProviders(<HealthRecordsComponent />);
    
    const filterSelect = screen.getByTestId('record-filter');
    const sortSelect = screen.getByTestId('record-sort');
    
    fireEvent.change(filterSelect, { target: { value: '基因检测' } });
    await waitFor(() => {
      const visibleCards = screen.getAllByTestId('record-card');
      expect(visibleCards).toHaveLength(1);
      expect(visibleCards[0]).toHaveTextContent('基因测序分析完成');
      expect(visibleCards[0]).toHaveTextContent('药物代谢异常风险');
    });
    
    fireEvent.change(sortSelect, { target: { value: 'date-desc' } });
    const dates = screen.getAllByTestId('record-date');
    expect(dates[0]).toHaveTextContent('2024-01-15');
  });

  test('validates record details modal functionality', async () => {
    renderWithProviders(<HealthRecordsComponent />);
    
    const viewButtons = screen.getAllByText('查看详情');
    fireEvent.click(viewButtons[0]);
    
    await waitFor(() => {
      const modal = screen.getByTestId('record-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent('年度体检报告');
      expect(modal).toHaveTextContent('血压: 120/80 mmHg');
      expect(modal).toHaveTextContent('保持良好的生活习惯');
    });
    
    const closeButton = screen.getByTestId('modal-close');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('record-modal')).not.toBeInTheDocument();
    });
  });

  test('handles loading and error states', async () => {
    const { findLoadingState, findErrorMessage, waitForLoading } = renderWithProviders(<HealthRecordsComponent />);
    
    store.setState({ loading: true, healthRecords: [] });
    const loadingState = await findLoadingState();
    expect(loadingState).toBeInTheDocument();
    
    await waitForLoading();

    store.setState({ 
      loading: false,
      error: '健康记录加载失败，请稍后重试',
      healthRecords: []
    });
    
    const errorMessage = await findErrorMessage();
    expect(errorMessage).toHaveTextContent('健康记录加载失败');

    const retryButton = await screen.findByRole('button', { name: /重试/ });
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(store.getState().error).toBeNull();
      expect(store.getState().loading).toBe(true);
    });
  });

  test('validates record export functionality and keyboard navigation', async () => {
    renderWithProviders(<HealthRecordsComponent />);
    
    const exportButton = screen.getByText('导出记录');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      const exportModal = screen.getByTestId('export-modal');
      expect(exportModal).toBeInTheDocument();
      expect(exportModal).toHaveAttribute('role', 'dialog');
      expect(exportModal).toHaveAttribute('aria-labelledby', 'export-title');
    });

    // Test keyboard navigation
    const modalButtons = screen.getAllByRole('button');
    const firstButton = modalButtons[0];
    const lastButton = modalButtons[modalButtons.length - 1];

    firstButton.focus();
    fireEvent.keyDown(firstButton, { key: 'Tab' });
    expect(document.activeElement).toBe(modalButtons[1]);

    lastButton.focus();
    fireEvent.keyDown(lastButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(modalButtons[modalButtons.length - 2]);

    // Test keyboard selection
    const pdfButton = screen.getByText('PDF');
    pdfButton.focus();
    fireEvent.keyDown(pdfButton, { key: 'Enter' });
    expect(screen.getByTestId('export-progress')).toBeInTheDocument();

    // Test escape key closes modal
    fireEvent.keyDown(exportModal, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument();
    });
  });

  test('validates responsive layout and mobile interactions', async () => {
    const { container } = renderWithProviders(<HealthRecordsComponent />);

    // Test desktop layout
    const recordsGrid = screen.getByTestId('records-grid');
    expect(recordsGrid).toHaveStyle({ display: 'grid' });

    // Test mobile layout
    Object.defineProperty(window, 'innerWidth', { value: 480 });
    window.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      expect(recordsGrid).toHaveStyle({ gridTemplateColumns: '1fr' });
      expect(screen.getByTestId('timeline')).toHaveStyle({ padding: '1rem' });
    });

    // Test touch interactions
    const recordCard = screen.getAllByTestId('record-card')[0];
    fireEvent.touchStart(recordCard);
    fireEvent.touchEnd(recordCard);
    
    await waitFor(() => {
      expect(screen.getByTestId('record-modal')).toBeInTheDocument();
    });

    // Test accessibility on mobile
    const interactiveElements = container.querySelectorAll('button, [role="button"], a');
    interactiveElements.forEach(el => {
      expect(el).toHaveAttribute('aria-label');
      expect(el.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
      expect(el.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    });
  });
});
