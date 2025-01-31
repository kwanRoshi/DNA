import React from 'react';
import { render, screen, waitFor } from './utils/test-utils';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import HealthAssistantComponent from '../components/HealthAssistantComponent';
import { mockStore } from './setup';

const renderComponent = () => {
  return render(<HealthAssistantComponent />);
};

describe('HealthAssistantComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.setState({
      user: { id: '123', name: '张三' },
      healthData: null,
      analysisResult: null,
      loading: false,
      error: null
    });
  });

  test('renders health assistant interface', () => {
    const { findHealthMetrics } = renderComponent();
    
    expect(screen.getByText('AI健康助手')).toBeInTheDocument();
    expect(screen.getByText(/基于DeepSeek AI的智能健康分析系统/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始分析' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/请输入您的健康数据进行分析/)).toBeInTheDocument();
  });

  test('handles analysis form submission successfully', async () => {
    const { findAnalysisResult, findHealthMetrics, user } = renderComponent();
    
    const input = screen.getByTestId('analysis-input');
    const submitButton = screen.getByTestId('submit-analysis');

    await user.type(input, '最近经常感觉疲劳，睡眠质量差，食欲不振');
    await user.click(submitButton);

    mockStore.setState({
      loading: false,
      analysisResult: {
        summary: '根据AI分析，您可能存在以下健康问题：',
        metrics: {
          sleepQuality: '较差',
          appetite: '偏低',
          energyLevel: '偏低'
        },
        recommendations: ['改善作息时间', '增加运动量', '调整饮食结构'],
        riskFactors: ['睡眠不足', '营养不均衡']
      }
    });

    const result = await findAnalysisResult();
    expect(result).toBeInTheDocument();
    expect(screen.getByText(/根据AI分析/)).toBeInTheDocument();
    expect(screen.getByText('睡眠不足')).toBeInTheDocument();
    expect(screen.getByText('改善作息时间')).toBeInTheDocument();
  });

  test('displays analysis types and handles selection with comprehensive validation', async () => {
    const { findByTestId, user } = renderComponent();
    
    const select = screen.getByRole('combobox', { name: /分析类型/ });
    const options = screen.getAllByRole('option');
    
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('健康咨询');
    expect(options[1]).toHaveTextContent('基因测序');
    expect(options[2]).toHaveTextContent('早期筛查');

    // Test each analysis type
    const analysisTypes = {
      '健康咨询': {
        description: '智能症状分析和健康建议',
        placeholder: '请描述您的症状或健康问题'
      },
      '基因测序': {
        description: '专业的基因组测序分析',
        placeholder: '请上传基因测序数据文件'
      },
      '早期筛查': {
        description: '疾病早期风险评估',
        placeholder: '请输入体检指标数据'
      }
    };

    for (const [type, data] of Object.entries(analysisTypes)) {
      await user.selectOptions(select, type);
      
      const analysisSection = await findByTestId(`${type}-section`);
      expect(analysisSection).toBeInTheDocument();
      expect(screen.getByText(data.description)).toBeInTheDocument();
      
      const input = screen.getByPlaceholderText(data.placeholder);
      expect(input).toBeInTheDocument();
      
      // Test input validation
      await user.type(input, '测试数据');
      expect(input).toHaveValue('测试数据');
      
      // Clear input
      await user.clear(input);
      const submitButton = screen.getByRole('button', { name: '开始分析' });
      await user.click(submitButton);
      expect(screen.getByText(/请输入必要的分析数据/)).toBeInTheDocument();
    }

    // Test analysis type specific features
    fireEvent.change(select, { target: { value: '基因测序' } });
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    expect(screen.getByText(/支持的文件格式/)).toBeInTheDocument();

    fireEvent.change(select, { target: { value: '早期筛查' } });
    expect(screen.getByTestId('health-metrics-form')).toBeInTheDocument();
    expect(screen.getByText(/填写健康指标/)).toBeInTheDocument();
  });

  test('validates form error handling and state management', async () => {
    const { findErrorMessage, user, waitForStateUpdate } = renderComponent();
    
    // Test initial state
    expect(mockStore.getState().loading).toBe(false);
    expect(mockStore.getState().error).toBeNull();
    
    const submitButton = screen.getByRole('button', { name: '开始分析' });
    await user.click(submitButton);
    
    // Test error state
    await waitForStateUpdate(state => state.error === '请输入健康数据进行分析');

    // Verify error message display
    const errorMessage = await findErrorMessage();
    expect(errorMessage).toHaveTextContent('请输入健康数据进行分析');
    expect(errorMessage).toHaveAttribute('role', 'alert');
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    
    // Test error recovery flow
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '测试数据');
    await user.click(submitButton);
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock successful analysis
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '分析完成',
        metrics: { confidence: '高' },
        recommendations: [{ suggestion: '建议1', priority: '高', category: '生活方式' }]
      }
    });
    
    // Verify success state
    await waitForStateUpdate(state => !state.loading && state.analysisResult);
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('handles loading states, errors, and retries comprehensively', async () => {
    const { findLoadingState, findErrorMessage } = render(<HealthAssistantComponent />);
    
    const input = screen.getByPlaceholderText(/请输入您的健康数据进行分析/);
    const submitButton = screen.getByRole('button', { name: '开始分析' });

    // Test initial submission and loading state
    fireEvent.change(input, { target: { value: '头痛，发烧，咳嗽' } });
    fireEvent.click(submitButton);

    mockStore.setState({ loading: true });
    const loadingState = await findLoadingState();
    expect(loadingState).toHaveTextContent(/分析中/);

    // Test error state
    mockStore.setState({ loading: false, error: '分析服务暂时不可用' });
    const errorMessage = await findErrorMessage();
    expect(errorMessage).toHaveTextContent('分析服务暂时不可用');

    // Test retry functionality
    const retryButton = screen.getByRole('button', { name: /重试/ });
    fireEvent.click(retryButton);
    expect(mockStore.getState().error).toBeNull();

    // Test successful retry
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '重试分析成功',
        metrics: {
          confidence: '高',
          responseTime: '正常'
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      expect(screen.getByText('重试分析成功')).toBeInTheDocument();
    });

    // Test network timeout error
    mockStore.setState({ loading: false, error: '网络连接超时' });
    const timeoutError = await findErrorMessage();
    expect(timeoutError).toHaveTextContent('网络连接超时');

    // Test service unavailable error
    mockStore.setState({ loading: false, error: '服务暂时不可用，请稍后再试' });
    const serviceError = await findErrorMessage();
    expect(serviceError).toHaveTextContent('服务暂时不可用');
  });

  test('displays and validates comprehensive health metrics after analysis', async () => {
    const { findByTestId } = render(<HealthAssistantComponent />);
    
    const input = screen.getByTestId('analysis-input');
    const submitButton = screen.getByTestId('submit-analysis');

    fireEvent.change(input, { target: { value: '最近出现头晕、心悸、血压偏高的症状' } });
    fireEvent.click(submitButton);

    mockStore.setState({
      loading: false,
      analysisResult: {
        summary: '根据AI分析，建议进行以下健康干预：',
        metrics: {
          bloodPressure: '140/90 mmHg',
          heartRate: '88次/分',
          stressLevel: '偏高',
          sleepQuality: '一般',
          bmi: '24.5',
          exerciseFrequency: '偏低'
        },
        recommendations: [
          '控制饮食盐分',
          '规律运动，每周至少3次有氧运动',
          '保持心情舒畅，避免过度紧张',
          '保证充足睡眠，建议每天7-8小时',
          '定期监测血压，保持记录'
        ],
        riskFactors: [
          '高血压风险',
          '心血管疾病风险',
          '亚健康状态',
          '运动不足'
        ]
      }
    });

    const metrics = await findByTestId('health-metrics');
    const risks = await findByTestId('risk-factors');
    const recommendations = await findByTestId('recommendations');

    expect(metrics).toBeInTheDocument();
    expect(risks).toBeInTheDocument();
    expect(recommendations).toBeInTheDocument();

    // Validate all metrics
    Object.entries(mockStore.getState().analysisResult.metrics).forEach(([key, value]) => {
      expect(screen.getByTestId(`metric-${key}`)).toHaveTextContent(value);
    });

    // Validate all risk factors
    mockStore.getState().analysisResult.riskFactors.forEach(risk => {
      expect(screen.getByTestId('risk-factors')).toHaveTextContent(risk);
    });

    // Validate all recommendations
    mockStore.getState().analysisResult.recommendations.forEach(rec => {
      expect(screen.getByTestId('recommendations')).toHaveTextContent(rec);
    });

    // Test metric updates
    mockStore.setState({
      analysisResult: {
        ...mockStore.getState().analysisResult,
        metrics: {
          ...mockStore.getState().analysisResult.metrics,
          bloodPressure: '135/85 mmHg',
          heartRate: '82次/分'
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('metric-bloodPressure')).toHaveTextContent('135/85 mmHg');
      expect(screen.getByTestId('metric-heartRate')).toHaveTextContent('82次/分');
    });
  });

  test('handles file upload, validation, and analysis comprehensively', async () => {
    const { findAnalysisResult, findLoadingState, findErrorMessage } = render(<HealthAssistantComponent />);
    
    const fileInput = screen.getByTestId('file-upload');

    // Test invalid file type
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    Object.defineProperty(fileInput, 'files', { value: [invalidFile] });
    fireEvent.change(fileInput);
    
    const typeError = await findErrorMessage();
    expect(typeError).toHaveTextContent('不支持的文件类型');

    // Test file size limit
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', { value: [largeFile] });
    fireEvent.change(fileInput);
    
    const sizeError = await findErrorMessage();
    expect(sizeError).toHaveTextContent('文件大小超出限制');

    // Test valid file upload and analysis
    const validFiles = [
      new File(['健康数据1'], 'health_data1.txt', { type: 'text/plain' }),
      new File(['健康数据2'], 'health_data2.pdf', { type: 'application/pdf' })
    ];

    for (const file of validFiles) {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);

      mockStore.setState({ loading: true });
      const loadingState = await findLoadingState();
      expect(loadingState).toHaveTextContent(/分析中/);

      mockStore.setState({
        loading: false,
        analysisResult: {
          summary: '文件分析完成，健康数据评估如下：',
          fileType: file.type,
          fileName: file.name,
          metrics: {
            dataQuality: '良好',
            analysisConfidence: '高',
            processingTime: '2秒',
            dataPoints: '128',
            accuracy: '98%'
          },
          recommendations: [
            '建议进行进一步检查',
            '定期监测相关指标',
            '保持良好的生活习惯'
          ]
        }
      });

      const result = await findAnalysisResult();
      expect(result).toBeInTheDocument();
      expect(screen.getByText(/文件分析完成/)).toBeInTheDocument();
      expect(screen.getByTestId('file-name')).toHaveTextContent(file.name);
      expect(screen.getByTestId('data-quality')).toHaveTextContent('良好');
      expect(screen.getByTestId('analysis-confidence')).toHaveTextContent('高');
    }

    // Test upload cancellation
    const cancelButton = screen.getByTestId('cancel-upload');
    fireEvent.click(cancelButton);
    expect(mockStore.getState().loading).toBe(false);

    // Test retry functionality
    const retryButton = screen.getByTestId('retry-upload');
    fireEvent.click(retryButton);
    expect(screen.getByTestId('file-upload')).toBeEnabled();
  });

  test('handles network errors and service interruptions comprehensively', async () => {
    const { findByTestId } = render(<HealthAssistantComponent />);
    
    const input = screen.getByTestId('analysis-input');
    const submitButton = screen.getByTestId('submit-analysis');

    // Test network timeout
    fireEvent.change(input, { target: { value: '测试网络错误处理' } });
    fireEvent.click(submitButton);
    
    mockStore.setState({ loading: true });
    const loadingState = await findLoadingState();
    expect(loadingState).toHaveTextContent(/处理中/);

    mockStore.setState({
      loading: false,
      error: '请求超时，请检查网络连接'
    });
    let errorElement = await findErrorMessage();
    expect(errorElement).toHaveTextContent('请求超时');

    // Test service unavailable
    fireEvent.change(input, { target: { value: '测试服务中断' } });
    fireEvent.click(submitButton);
    
    mockStore.setState({
      loading: false,
      error: 'AI服务暂时不可用，请稍后重试'
    });
    errorElement = await findErrorMessage();
    expect(errorElement).toHaveTextContent(/AI服务暂时不可用/);

    // Test invalid response format
    fireEvent.change(input, { target: { value: '测试数据格式错误' } });
    fireEvent.click(submitButton);
    
    mockStore.setState({
      loading: false,
      error: '服务响应格式错误，请联系技术支持'
    });
    errorElement = await findErrorMessage();
    expect(errorElement).toHaveTextContent(/服务响应格式错误/);

    // Test retry functionality with success
    const retryButton = screen.getByRole('button', { name: /重试/ });
    fireEvent.click(retryButton);
    expect(mockStore.getState().error).toBeNull();

    mockStore.setState({
      loading: false,
      analysisResult: {
        summary: '重试分析成功',
        metrics: {
          confidence: '高',
          responseTime: '正常'
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      expect(screen.getByText('重试分析成功')).toBeInTheDocument();
    });

    // Test concurrent request handling
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    expect(screen.getByText(/请等待当前分析完成/)).toBeInTheDocument();
  });

  test('validates analysis result caching and history management', async () => {
    const { findAnalysisResult, findHistoryItems } = render(<HealthAssistantComponent />);
    
    // Test initial cache state
    const cachedResult = {
      summary: '历史分析结果',
      timestamp: new Date().toISOString(),
      metrics: {
        status: '已缓存',
        lastUpdated: '刚刚',
        confidence: '高',
        accuracy: '95%'
      },
      history: [
        { id: 1, date: '2024-01-15', type: '症状分析', summary: '感冒症状分析' },
        { id: 2, date: '2024-01-14', type: '基因检测', summary: '基因风险评估' }
      ]
    };

    mockStore.setState({
      analysisResult: cachedResult,
      loading: false
    });

    const result = await findAnalysisResult();
    expect(result).toBeInTheDocument();
    expect(screen.getByText(/历史分析结果/)).toBeInTheDocument();
    expect(screen.getByText(/已缓存/)).toBeInTheDocument();
    expect(screen.getByText(/confidence: 高/)).toBeInTheDocument();

    // Test history display
    const historyItems = await findHistoryItems();
    expect(historyItems).toHaveLength(2);
    expect(screen.getByText('感冒症状分析')).toBeInTheDocument();
    expect(screen.getByText('基因风险评估')).toBeInTheDocument();

    // Test history item interaction
    fireEvent.click(screen.getByText('感冒症状分析'));
    await waitFor(() => {
      expect(screen.getByTestId('history-details')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });

    // Test cache update
    const updatedResult = {
      ...cachedResult,
      summary: '更新的分析结果',
      timestamp: new Date().toISOString(),
      metrics: {
        ...cachedResult.metrics,
        lastUpdated: '1分钟前',
        accuracy: '98%'
      }
    };

    mockStore.setState({
      analysisResult: updatedResult,
      loading: false
    });

    await waitFor(() => {
      expect(screen.getByText(/更新的分析结果/)).toBeInTheDocument();
      expect(screen.getByText(/1分钟前/)).toBeInTheDocument();
      expect(screen.getByText(/accuracy: 98%/)).toBeInTheDocument();
    });

    // Test cache clearing
    const clearButton = screen.getByTestId('clear-cache');
    fireEvent.click(clearButton);
    expect(mockStore.getState().analysisResult).toBeNull();
  });

  test('validates keyboard navigation with useKeyboardNavigation hook', async () => {
    const { user } = renderComponent();
    
    // Test keyboard navigation through form elements
    const analysisInput = screen.getByTestId('analysis-input');
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    const submitButton = screen.getByTestId('submit-analysis');
    
    // Initial focus
    await user.tab();
    expect(document.activeElement).toBe(analysisInput);
    
    // Forward navigation
    await user.tab();
    expect(document.activeElement).toBe(analysisTypeSelect);
    await user.tab();
    expect(document.activeElement).toBe(submitButton);
    
    // Backward navigation
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(analysisTypeSelect);
    
    // Test keyboard interaction with select
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(analysisTypeSelect).toHaveValue('gene');
    
    // Test form submission with keyboard
    await user.tab({ shift: true });
    await user.type(analysisInput, '测试键盘导航');
    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');
    
    // Verify loading state
    const loadingState = await screen.findByTestId('loading-state');
    expect(loadingState).toBeInTheDocument();
  });

  test('validates form validation and error handling', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test empty input validation
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    expect(screen.getByText('请输入健康数据进行分析')).toBeInTheDocument();
    
    // Test whitespace-only input
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '   ');
    await user.click(submitButton);
    expect(screen.getByText('请输入健康数据进行分析')).toBeInTheDocument();
    
    // Test input length validation
    const longInput = '测'.repeat(5000);
    await user.clear(input);
    await user.type(input, longInput);
    await user.click(submitButton);
    expect(screen.getByText('输入内容过长，请精简描述')).toBeInTheDocument();
    
    // Test network error handling
    await user.clear(input);
    await user.type(input, '测试网络错误处理');
    await user.click(submitButton);
    
    mockStore.setState({
      loading: false,
      error: '网络连接失败，请检查网络设置',
      analysisResult: null
    });
    
    const networkError = await screen.findByRole('alert');
    expect(networkError).toHaveTextContent('网络连接失败，请检查网络设置');
    
    // Test retry functionality
    const retryButton = screen.getByText('重试');
    await user.click(retryButton);
    
    // Verify loading state on retry
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Test server error handling
    mockStore.setState({
      loading: false,
      error: '服务器处理请求失败，错误代码：500',
      analysisResult: null
    });
    
    const serverError = await screen.findByRole('alert');
    expect(serverError).toHaveTextContent('服务器处理请求失败，错误代码：500');
    
    // Test successful submission after error
    await user.click(retryButton);
    
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '分析完成',
        metrics: { score: '85' }
      }
    });
    
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('分析完成')).toBeInTheDocument();
  });

  test('validates responsive design and mobile interactions', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Mock mobile viewport
    window.innerWidth = 375;
    window.innerHeight = 667;
    fireEvent(window, new Event('resize'));
    
    // Test mobile layout adjustments
    const container = screen.getByTestId('health-assistant');
    expect(container).toHaveStyle({ maxWidth: '100%' });
    
    // Test touch interactions
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '测试移动端交互');
    
    // Test mobile form submission
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    
    // Mock analysis response for mobile
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '移动端分析完成',
        metrics: {
          score: '88',
          status: '良好'
        },
        recommendations: [
          { suggestion: '建议1', priority: '高', category: '生活' },
          { suggestion: '建议2', priority: '中', category: '运动' }
        ]
      }
    });
    
    // Verify mobile results display
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(result).toHaveStyle({ padding: '1rem' });
    
    // Test mobile scroll behavior
    const resultContainer = screen.getByTestId('results-container');
    expect(resultContainer).toHaveStyle({ overflowY: 'auto' });
    
    // Test touch scroll
    fireEvent.touchStart(resultContainer, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(resultContainer, { touches: [{ clientY: -100 }] });
    fireEvent.touchEnd(resultContainer);
    
    // Test mobile metrics display
    const metrics = screen.getByTestId('health-metrics');
    expect(metrics).toHaveStyle({ display: 'grid', gridTemplateColumns: '1fr' });
    
    // Test mobile recommendations display
    const recommendations = screen.getAllByTestId(/recommendation-/);
    recommendations.forEach(rec => {
      expect(rec).toHaveStyle({ padding: '0.5rem' });
    });
    
    // Test mobile error display
    mockStore.setState({
      loading: false,
      error: '网络错误',
      analysisResult: null
    });
    
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveStyle({ fontSize: '0.875rem' });
    
    // Reset viewport
    window.innerWidth = 1024;
    window.innerHeight = 768;
    fireEvent(window, new Event('resize'));
  });

  test('validates health records management functionality', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Mock existing health records
    const healthRecords = {
      records: [
        {
          id: '1',
          date: '2024-01-15',
          type: '常规体检',
          data: {
            bloodPressure: '120/80',
            heartRate: '75',
            bloodSugar: '5.5',
            bmi: '22.5'
          },
          analysis: {
            summary: '整体健康状况良好',
            recommendations: [
              { suggestion: '保持运动习惯', priority: '中' },
              { suggestion: '定期复查', priority: '高' }
            ]
          }
        },
        {
          id: '2',
          date: '2024-01-01',
          type: '专项检查',
          data: {
            bloodPressure: '118/78',
            heartRate: '72',
            bloodSugar: '5.3',
            bmi: '22.3'
          },
          analysis: {
            summary: '各项指标正常',
            recommendations: [
              { suggestion: '增加运动强度', priority: '中' }
            ]
          }
        }
      ],
      trends: {
        bloodPressure: '稳定',
        heartRate: '改善',
        bloodSugar: '稳定',
        bmi: '改善'
      }
    };
    
    mockStore.setState({
      healthRecords,
      loading: false,
      error: null
    });
    
    // Test records display
    const records = screen.getAllByTestId(/health-record-/);
    expect(records).toHaveLength(2);
    
    // Test record details
    expect(screen.getByText('120/80')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('5.5')).toBeInTheDocument();
    expect(screen.getByText('22.5')).toBeInTheDocument();
    
    // Test trend analysis
    const trends = screen.getAllByTestId(/trend-/);
    expect(trends[0]).toHaveTextContent('稳定');
    expect(trends[1]).toHaveTextContent('改善');
    
    // Test record filtering
    const filterSelect = screen.getByTestId('record-filter');
    await user.selectOptions(filterSelect, '专项检查');
    
    // Verify filtered results
    const filteredRecords = screen.getAllByTestId(/health-record-/);
    expect(filteredRecords).toHaveLength(1);
    expect(filteredRecords[0]).toHaveTextContent('专项检查');
    
    // Test record comparison
    const compareButton = screen.getByText('对比分析');
    await user.click(compareButton);
    
    const comparison = screen.getByTestId('records-comparison');
    expect(comparison).toBeInTheDocument();
    expect(comparison).toHaveTextContent('血压变化：-2/-2');
    expect(comparison).toHaveTextContent('心率变化：-3');
    
    // Test recommendations based on trends
    const recommendations = screen.getAllByTestId(/trend-recommendation-/);
    expect(recommendations[0]).toHaveTextContent('保持当前生活方式');
    expect(recommendations[1]).toHaveTextContent('继续保持良好的运动习惯');
  });

  test('validates DeepSeek model integration and response handling', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Select analysis type and input data
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'health');
    
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '请分析我的健康状况，包括基因和生活方式评估');
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock DeepSeek model response
    const deepseekResponse = {
      summary: 'DeepSeek模型分析完成',
      modelInfo: {
        version: 'v3',
        confidence: '95%',
        analysisTime: '2.3s',
        parameters: {
          temperature: 0.7,
          maxTokens: 2048
        }
      },
      analysis: {
        healthScore: 85,
        riskLevel: '低',
        geneticFactors: ['基因型AA', '基因型BB'],
        lifestyleFactors: ['作息规律', '饮食均衡'],
        environmentalFactors: ['室内空气质量良好', '工作压力适中']
      },
      recommendations: [
        { suggestion: '保持当前生活方式', priority: '中', category: '生活建议', confidence: '90%' },
        { suggestion: '定期体检', priority: '高', category: '健康管理', confidence: '95%' }
      ]
    };
    
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: deepseekResponse
    });
    
    // Verify DeepSeek model info display
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('DeepSeek模型分析完成')).toBeInTheDocument();
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('2.3s')).toBeInTheDocument();
    
    // Test analysis results display
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('低')).toBeInTheDocument();
    
    // Verify genetic factors
    deepseekResponse.analysis.geneticFactors.forEach(factor => {
      expect(screen.getByText(factor)).toBeInTheDocument();
    });
    
    // Verify lifestyle factors
    deepseekResponse.analysis.lifestyleFactors.forEach(factor => {
      expect(screen.getByText(factor)).toBeInTheDocument();
    });
    
    // Verify environmental factors
    deepseekResponse.analysis.environmentalFactors.forEach(factor => {
      expect(screen.getByText(factor)).toBeInTheDocument();
    });
    
    // Test recommendations with confidence scores
    const recommendations = screen.getAllByTestId(/recommendation-/);
    expect(recommendations[0]).toHaveTextContent('定期体检');
    expect(recommendations[0]).toHaveTextContent('95%');
    expect(recommendations[1]).toHaveTextContent('保持当前生活方式');
    expect(recommendations[1]).toHaveTextContent('90%');
  });

  test('validates gene sequencing analysis functionality', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Select gene sequencing analysis type
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'gene');
    
    // Input gene sequence data
    const input = screen.getByTestId('analysis-input');
    await user.type(input, 'ATCG序列分析请求，包含遗传风险评估');
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock gene sequencing response
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '基因序列分析完成',
        metrics: {
          sequenceLength: '1024',
          coverage: '99.8%',
          quality: '高',
          confidence: '95%',
          variantCount: '3',
          pathogenicity: '低风险'
        },
        variants: [
          { position: '145', change: 'A>T', significance: '良性', confidence: '高' },
          { position: '367', change: 'G>C', significance: '未知', confidence: '中' },
          { position: '892', change: 'T>A', significance: '可能良性', confidence: '高' }
        ],
        inheritancePatterns: [
          { pattern: '常染色体显性', probability: '低' },
          { pattern: '常染色体隐性', probability: '中' }
        ],
        recommendations: [
          { suggestion: '建议进行家族史调查', priority: '高', category: '遗传咨询' },
          { suggestion: '定期进行相关检查', priority: '中', category: '健康监测' }
        ]
      }
    });
    
    // Verify gene sequencing results
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    
    // Test sequence metrics
    expect(screen.getByText('1024')).toBeInTheDocument();
    expect(screen.getByText('99.8%')).toBeInTheDocument();
    expect(screen.getByText('高')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('低风险')).toBeInTheDocument();
    
    // Test variant display
    const variants = screen.getAllByTestId(/variant-/);
    expect(variants[0]).toHaveTextContent('A>T');
    expect(variants[0]).toHaveTextContent('良性');
    expect(variants[1]).toHaveTextContent('G>C');
    expect(variants[1]).toHaveTextContent('未知');
    expect(variants[2]).toHaveTextContent('T>A');
    expect(variants[2]).toHaveTextContent('可能良性');
    
    // Test inheritance patterns
    expect(screen.getByText('常染色体显性')).toBeInTheDocument();
    expect(screen.getByText('常染色体隐性')).toBeInTheDocument();
    
    // Test recommendations
    const recommendations = screen.getAllByTestId(/recommendation-/);
    expect(recommendations[0]).toHaveTextContent('建议进行家族史调查');
    expect(recommendations[1]).toHaveTextContent('定期进行相关检查');
  });

  test('validates early screening analysis functionality', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Select early screening analysis type
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'early_screening');
    
    // Input screening data
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '早期筛查数据分析，包含多项指标评估');
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock screening response
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '早期筛查分析完成',
        riskLevel: '低风险',
        confidence: '92%',
        screeningMetrics: {
          bloodPressure: { value: '120/80', status: '正常', trend: '稳定' },
          bloodSugar: { value: '5.2', status: '正常', trend: '稳定' },
          cholesterol: { value: '4.8', status: '正常', trend: '改善' },
          bmi: { value: '22.5', status: '正常', trend: '稳定' }
        },
        symptoms: [
          { name: '轻度疲劳', severity: '轻微', duration: '2周', frequency: '偶尔' },
          { name: '睡眠质量波动', severity: '轻微', duration: '1月', frequency: '经常' }
        ],
        recommendations: [
          { suggestion: '保持规律作息', priority: '高', category: '生活方式' },
          { suggestion: '定期体检', priority: '中', category: '健康管理' }
        ]
      }
    });
    
    // Verify screening results
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('早期筛查分析完成')).toBeInTheDocument();
    expect(screen.getByText('低风险')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    
    // Test metrics display
    const metrics = screen.getByTestId('screening-metrics');
    expect(metrics).toBeInTheDocument();
    expect(metrics).toHaveTextContent('120/80');
    expect(metrics).toHaveTextContent('5.2');
    expect(metrics).toHaveTextContent('4.8');
    expect(metrics).toHaveTextContent('22.5');
    
    // Test status indicators
    const statusIndicators = screen.getAllByTestId(/status-/);
    statusIndicators.forEach(indicator => {
      expect(indicator).toHaveTextContent('正常');
    });
    
    // Test trend indicators
    const trendIndicators = screen.getAllByTestId(/trend-/);
    expect(trendIndicators[0]).toHaveTextContent('稳定');
    expect(trendIndicators[2]).toHaveTextContent('改善');
    
    // Test symptoms display
    const symptoms = screen.getAllByTestId(/symptom-/);
    expect(symptoms[0]).toHaveTextContent('轻度疲劳');
    expect(symptoms[0]).toHaveTextContent('轻微');
    expect(symptoms[1]).toHaveTextContent('睡眠质量波动');
    expect(symptoms[1]).toHaveTextContent('经常');
    
    // Test recommendations
    const recommendations = screen.getAllByTestId(/recommendation-/);
    expect(recommendations[0]).toHaveTextContent('保持规律作息');
    expect(recommendations[0]).toHaveTextContent('高');
    expect(recommendations[1]).toHaveTextContent('定期体检');
    expect(recommendations[1]).toHaveTextContent('中');
  });

  test('validates Chinese language support and internationalization', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test Chinese interface elements
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI健康助手');
    expect(screen.getByText(/基于DeepSeek AI的智能健康分析系统/)).toBeInTheDocument();
    
    // Test Chinese form labels and placeholders
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    expect(screen.getByLabelText('分析类型')).toBe(analysisTypeSelect);
    expect(screen.getByPlaceholderText(/请输入您的健康数据/)).toBeInTheDocument();
    
    // Test Chinese analysis types
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('健康咨询');
    expect(options[1]).toHaveTextContent('基因测序');
    expect(options[2]).toHaveTextContent('早期筛查');
    
    // Test Chinese input handling
    const analysisInput = screen.getByTestId('analysis-input');
    await user.type(analysisInput, '最近感觉疲劳，睡眠质量差，请分析可能的健康问题');
    expect(analysisInput).toHaveValue('最近感觉疲劳，睡眠质量差，请分析可能的健康问题');
    
    // Test Chinese analysis submission
    await user.click(screen.getByRole('button', { name: '开始分析' }));
    const loadingIndicator = await screen.findByTestId('loading-state');
    expect(loadingIndicator).toHaveTextContent('分析中...');
    
    // Test Chinese analysis results
    mockStore.setState({
      loading: false,
      analysisResult: {
        summary: '基于您的症状分析，您可能存在以下健康问题：',
        metrics: {
          healthScore: '85',
          sleepQuality: '较差',
          fatigueLevel: '中度',
          stressLevel: '偏高'
        },
        recommendations: [
          { suggestion: '改善作息时间', priority: '高', category: '生活方式' },
          { suggestion: '增加运动量', priority: '中', category: '运动建议' },
          { suggestion: '调整饮食结构', priority: '中', category: '饮食建议' }
        ],
        riskFactors: [
          { description: '睡眠不足', severity: '中度', type: '生活习惯' },
          { description: '压力过大', severity: '中度', type: '心理健康' }
        ]
      }
    });
    
    // Verify Chinese results display
    const analysisResult = await screen.findByTestId('analysis-result');
    expect(analysisResult).toBeInTheDocument();
    expect(screen.getByText(/基于您的症状分析/)).toBeInTheDocument();
    
    // Verify Chinese metrics
    expect(screen.getByText('较差')).toBeInTheDocument();
    expect(screen.getByText('中度')).toBeInTheDocument();
    expect(screen.getByText('偏高')).toBeInTheDocument();
    
    // Verify Chinese recommendations
    expect(screen.getByText('改善作息时间')).toBeInTheDocument();
    expect(screen.getByText('增加运动量')).toBeInTheDocument();
    expect(screen.getByText('调整饮食结构')).toBeInTheDocument();
    
    // Verify Chinese risk factors
    expect(screen.getByText('睡眠不足')).toBeInTheDocument();
    expect(screen.getByText('压力过大')).toBeInTheDocument();
    
    // Test Chinese error handling
    mockStore.setState({
      loading: false,
      error: '网络连接失败，请稍后重试',
      analysisResult: null
    });
    
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('网络连接失败，请稍后重试');
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
  });

  test('validates concurrent analysis requests and rate limiting', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test concurrent analysis requests
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '测试并发请求');
    
    // Submit multiple requests in quick succession
    const submitButton = screen.getByTestId('submit-analysis');
    await Promise.all([
      user.click(submitButton),
      user.click(submitButton),
      user.click(submitButton)
    ]);
    
    // Verify only one loading state is shown
    await waitForStateUpdate(state => state.loading === true);
    const loadingStates = await screen.findAllByTestId('loading-state');
    expect(loadingStates).toHaveLength(1);
    
    // Mock rate limit response
    mockStore.setState({
      loading: false,
      error: '请求过于频繁，请稍后再试',
      analysisResult: null,
      rateLimited: true
    });
    
    // Verify rate limit error display
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('请求过于频繁，请稍后再试');
    
    // Wait for rate limit to expire
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try new request after rate limit expires
    await user.click(submitButton);
    
    // Mock successful analysis after rate limit
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '分析完成',
        metrics: { score: '90' }
      },
      rateLimited: false
    });
    
    // Verify successful analysis after rate limit
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('分析完成')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  test('validates analysis caching and state management', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test initial cache state
    expect(mockStore.getState().cachedResults).toEqual({});
    
    // Submit first analysis
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '测试缓存功能');
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Mock first analysis response
    const firstAnalysis = {
      summary: '首次分析结果',
      metrics: { score: '80' },
      timestamp: Date.now()
    };
    
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: firstAnalysis,
      cachedResults: {
        '测试缓存功能': firstAnalysis
      }
    });
    
    // Verify first analysis result
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('首次分析结果')).toBeInTheDocument();
    
    // Clear input and submit same text again
    await user.clear(input);
    await user.type(input, '测试缓存功能');
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Verify cached result is used
    expect(screen.getByText('首次分析结果')).toBeInTheDocument();
    expect(mockStore.getState().cachedResults['测试缓存功能']).toBeDefined();
    
    // Test cache invalidation after timeout
    const expiredCache = {
      ...firstAnalysis,
      timestamp: Date.now() - 3600000 // 1 hour ago
    };
    
    mockStore.setState({
      cachedResults: {
        '测试缓存功能': expiredCache
      }
    });
    
    // Submit same analysis after cache expiration
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Mock new analysis response
    const newAnalysis = {
      summary: '更新后的分析结果',
      metrics: { score: '85' },
      timestamp: Date.now()
    };
    
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: newAnalysis,
      cachedResults: {
        '测试缓存功能': newAnalysis
      }
    });
    
    // Verify new result is displayed
    expect(await screen.findByText('更新后的分析结果')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  test('validates health records management functionality', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test health records input
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '请分析我的历史健康记录');
    
    // Select health consultation type
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'health');
    
    // Submit analysis request
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Mock health records analysis response
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '健康记录分析完成',
        metrics: {
          recordCount: '5',
          timeSpan: '6个月',
          completeness: '95%',
          lastUpdate: '2024-01-15'
        },
        healthTrends: [
          { metric: '血压', trend: '稳定', confidence: '高' },
          { metric: '体重', trend: '下降', confidence: '中' },
          { metric: '血糖', trend: '正常', confidence: '高' }
        ],
        recommendations: [
          { suggestion: '继续保持良好的监测频率', priority: '中', category: '健康管理' },
          { suggestion: '关注体重变化趋势', priority: '高', category: '体重管理' }
        ]
      }
    });
    
    // Verify health records display
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    
    // Test metrics display
    const metrics = await screen.findByTestId('health-metrics');
    expect(metrics).toHaveTextContent('5');
    expect(metrics).toHaveTextContent('6个月');
    expect(metrics).toHaveTextContent('95%');
    expect(metrics).toHaveTextContent('2024-01-15');
    
    // Test health trends display
    expect(screen.getByText('血压')).toBeInTheDocument();
    expect(screen.getByText('稳定')).toBeInTheDocument();
    expect(screen.getByText('体重')).toBeInTheDocument();
    expect(screen.getByText('下降')).toBeInTheDocument();
    expect(screen.getByText('血糖')).toBeInTheDocument();
    expect(screen.getByText('正常')).toBeInTheDocument();
    
    // Test recommendations based on records
    const recommendations = screen.getAllByTestId(/recommendation-/);
    expect(recommendations[0]).toHaveTextContent('关注体重变化趋势');
    expect(recommendations[1]).toHaveTextContent('继续保持良好的监测频率');
    
    // Verify confidence indicators
    expect(screen.getAllByText('高')).toHaveLength(2);
    expect(screen.getByText('中')).toBeInTheDocument();
  });

  test('validates Chinese language support and internationalization', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test Chinese placeholder text
    const input = screen.getByTestId('analysis-input');
    expect(input).toHaveAttribute('placeholder', '请输入您的健康数据进行分析...');
    
    // Test Chinese form labels
    expect(screen.getByText('分析类型')).toBeInTheDocument();
    expect(screen.getByText('健康数据')).toBeInTheDocument();
    
    // Test Chinese analysis types
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    const options = Array.from(analysisTypeSelect.options).map(opt => opt.text);
    expect(options).toContain('健康咨询');
    expect(options).toContain('基因测序');
    expect(options).toContain('早期筛查');
    
    // Test Chinese input handling
    await user.type(input, '我最近感觉非常疲劳，睡眠质量差，请分析可能的健康问题');
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Verify loading state in Chinese
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByText('分析中...')).toBeInTheDocument();
    
    // Mock Chinese analysis response
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '根据您的描述，您可能处于亚健康状态',
        metrics: {
          健康评分: '75',
          压力指数: '较高',
          睡眠质量: '欠佳',
          建议优先级: '需要及时改善'
        },
        recommendations: [
          { suggestion: '调整作息时间，保证充足睡眠', priority: '高', category: '生活方式' },
          { suggestion: '适当运动，缓解压力', priority: '中', category: '运动建议' }
        ],
        riskFactors: [
          { description: '睡眠不足导致的免疫力下降', severity: '中', type: '生活习惯' }
        ]
      }
    });
    
    // Verify Chinese result display
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('根据您的描述，您可能处于亚健康状态')).toBeInTheDocument();
    
    // Test Chinese metrics display
    expect(screen.getByText('健康评分')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('较高')).toBeInTheDocument();
    expect(screen.getByText('欠佳')).toBeInTheDocument();
    
    // Test Chinese recommendations display
    const recommendations = screen.getAllByTestId(/recommendation-/);
    expect(recommendations[0]).toHaveTextContent('调整作息时间，保证充足睡眠');
    expect(recommendations[1]).toHaveTextContent('适当运动，缓解压力');
    
    // Test Chinese risk factors display
    const riskFactors = screen.getAllByTestId(/risk-/);
    expect(riskFactors[0]).toHaveTextContent('睡眠不足导致的免疫力下降');
    
    // Test Chinese error handling
    mockStore.setState({
      loading: false,
      error: '网络连接错误，请稍后重试',
      analysisResult: null
    });
    
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('网络连接错误，请稍后重试');
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  test('validates early screening functionality and risk assessment', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Select early screening analysis type
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'early_screening');
    
    // Input symptoms for early screening
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '最近出现以下症状：头痛、疲劳、食欲下降');
    
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock early screening response
    const screeningResponse = {
      summary: '早期筛查分析完成',
      metrics: {
        riskLevel: '中等',
        confidence: '90%',
        urgency: '需要关注',
        symptoms: ['头痛', '疲劳', '食欲下降'],
        matchedConditions: 3,
        totalIndicators: 5
      },
      recommendations: [
        { suggestion: '建议进行全面体检', priority: '高', category: '预防保健' },
        { suggestion: '调整作息时间', priority: '中', category: '生活方式' },
        { suggestion: '注意营养均衡', priority: '中', category: '饮食建议' }
      ],
      riskFactors: [
        { description: '亚健康状态', severity: '中', type: '生活方式' },
        { description: '营养不均衡', severity: '中', type: '饮食习惯' }
      ]
    };
    
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: screeningResponse
    });
    
    // Verify early screening results display
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    
    // Test risk level display
    expect(screen.getByText('中等')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('需要关注')).toBeInTheDocument();
    
    // Verify matched symptoms
    const symptoms = screeningResponse.metrics.symptoms;
    symptoms.forEach(symptom => {
      expect(screen.getByText(symptom)).toBeInTheDocument();
    });
    
    // Test recommendations sorting and display
    const recommendations = screen.getAllByTestId(/recommendation-/);
    expect(recommendations[0]).toHaveTextContent('建议进行全面体检');
    expect(recommendations[1]).toHaveTextContent('调整作息时间');
    expect(recommendations[2]).toHaveTextContent('注意营养均衡');
    
    // Verify risk factors
    const riskFactors = screen.getAllByTestId(/risk-/);
    expect(riskFactors[0]).toHaveTextContent('亚健康状态');
    expect(riskFactors[1]).toHaveTextContent('营养不均衡');
    
    // Test indicator statistics
    expect(screen.getByText('3')).toBeInTheDocument(); // matchedConditions
    expect(screen.getByText('5')).toBeInTheDocument(); // totalIndicators
  });

  test('validates DeepSeek integration and response handling', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test DeepSeek analysis request
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '请分析我的基因序列：ATCG');
    
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'gene');
    
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    
    // Verify loading state during DeepSeek processing
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock DeepSeek analysis response
    const deepseekResponse = {
      summary: 'DeepSeek基因分析完成',
      metrics: {
        confidence: '95%',
        modelVersion: 'DeepSeek v3',
        processingTime: '2.5s',
        sequenceLength: '4bp',
        qualityScore: '高',
        mutationCount: '0'
      },
      recommendations: [
        { suggestion: '基因序列正常，无需特殊处理', priority: '低', category: '基因分析' }
      ],
      riskFactors: []
    };
    
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: deepseekResponse,
      provider: 'deepseek'
    });
    
    // Verify DeepSeek-specific result display
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('DeepSeek基因分析完成')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek v3')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    
    // Test model version display
    const metrics = await screen.findByTestId('health-metrics');
    expect(metrics).toHaveTextContent('DeepSeek v3');
    
    // Verify processing metadata
    expect(screen.getByText('2.5s')).toBeInTheDocument();
    expect(screen.getByText('4bp')).toBeInTheDocument();
    
    // Test quality indicators
    expect(screen.getByText('高')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('validates responsive design and mobile interactions', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test mobile viewport
    window.innerWidth = 375;
    window.innerHeight = 667;
    fireEvent(window, new Event('resize'));
    
    // Test touch interactions
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '测试移动端交互');
    
    // Test mobile form submission
    const submitButton = screen.getByTestId('submit-analysis');
    await user.pointer([
      { target: submitButton, keys: '[TouchA]' },
      { target: submitButton, keys: '[/TouchA]' }
    ]);
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock successful analysis
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '移动端分析完成',
        metrics: {
          healthScore: '88',
          confidence: '高'
        }
      }
    });
    
    // Test mobile result display
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(result).toHaveStyle({ maxWidth: '100%' });
    
    // Test touch scroll behavior
    const resultContainer = result.parentElement;
    fireEvent.touchStart(resultContainer, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(resultContainer, { touches: [{ clientY: -100 }] });
    fireEvent.touchEnd(resultContainer);
    
    // Verify mobile-specific UI elements
    const mobileElements = screen.getAllByRole('button');
    mobileElements.forEach(element => {
      expect(element).toHaveStyle({ minHeight: '44px' });
      expect(element).toHaveStyle({ minWidth: '44px' });
    });
  });

  test('validates metrics display and recommendations sorting', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Submit analysis request
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '需要全面健康评估');
    await user.click(screen.getByTestId('submit-analysis'));
    
    // Mock successful analysis with detailed metrics
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '健康评估完成',
        metrics: {
          healthScore: '85',
          stressLevel: '中等',
          sleepQuality: '良好',
          exerciseLevel: '需要改善',
          dietQuality: '良好',
          bmi: '正常',
          bloodPressure: '正常范围',
          confidenceScore: '95%'
        },
        recommendations: [
          { suggestion: '增加运动频率', priority: '高', category: '运动' },
          { suggestion: '保持良好作息', priority: '中', category: '生活方式' },
          { suggestion: '定期体检', priority: '高', category: '预防保健' }
        ].sort((a, b) => {
          const priorityMap = { '高': 3, '中': 2, '低': 1 };
          return priorityMap[b.priority] - priorityMap[a.priority];
        }),
        riskFactors: [
          { description: '运动不足风险', severity: '中', type: '生活方式' }
        ]
      }
    });
    
    // Verify metrics display
    const metrics = await screen.findByTestId('health-metrics');
    expect(metrics).toBeInTheDocument();
    
    // Verify all metric values are displayed
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('中等')).toBeInTheDocument();
    expect(screen.getByText('良好')).toBeInTheDocument();
    expect(screen.getByText('需要改善')).toBeInTheDocument();
    expect(screen.getByText('正常')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    
    // Verify recommendations are sorted by priority
    const recommendations = screen.getAllByTestId(/recommendation-/);
    expect(recommendations[0]).toHaveTextContent('增加运动频率');
    expect(recommendations[1]).toHaveTextContent('定期体检');
    expect(recommendations[2]).toHaveTextContent('保持良好作息');
    
    // Verify recommendation priority indicators
    recommendations.forEach(rec => {
      expect(rec).toHaveAttribute('aria-label', expect.stringMatching(/优先级:/));
    });
  });

  test('validates form validation and error handling', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test empty input validation
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    expect(screen.getByText('请输入健康数据进行分析')).toBeInTheDocument();
    
    // Test whitespace-only input
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '   ');
    await user.click(submitButton);
    expect(screen.getByText('请输入健康数据进行分析')).toBeInTheDocument();
    
    // Test API error handling
    await user.clear(input);
    await user.type(input, '测试错误处理');
    await user.click(submitButton);
    
    // Mock API error
    mockStore.setState({
      loading: false,
      error: '服务器错误，请稍后重试',
      analysisResult: null
    });
    
    // Verify error display
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('服务器错误，请稍后重试');
    
    // Test retry functionality
    const retryButton = screen.getByTestId('retry-button');
    await user.click(retryButton);
    
    // Verify loading state after retry
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock successful retry
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '分析完成',
        metrics: { healthScore: '90' }
      }
    });
    
    // Verify successful retry result
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('validates keyboard navigation and accessibility features', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test tab navigation through form elements
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    const input = screen.getByTestId('analysis-input');
    const submitButton = screen.getByTestId('submit-analysis');
    
    // Initial focus
    analysisTypeSelect.focus();
    expect(document.activeElement).toBe(analysisTypeSelect);
    
    // Tab to input
    await user.tab();
    expect(document.activeElement).toBe(input);
    
    // Tab to submit button
    await user.tab();
    expect(document.activeElement).toBe(submitButton);
    
    // Test keyboard input and submission
    await user.type(input, '最近感觉疲劳，需要健康建议');
    await user.keyboard('{Enter}');
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock successful analysis
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '分析完成',
        metrics: { healthScore: '85' }
      }
    });
    
    // Test results navigation
    const result = await screen.findByTestId('analysis-result');
    const metrics = await screen.findByTestId('health-metrics');
    
    // Verify ARIA attributes
    expect(result).toHaveAttribute('role', 'region');
    expect(result).toHaveAttribute('aria-label', '分析结果');
    expect(metrics).toHaveAttribute('role', 'list');
    
    // Test screen reader accessibility
    const headings = screen.getAllByRole('heading');
    headings.forEach(heading => {
      expect(heading).toHaveAttribute('aria-level');
    });
    
    const regions = screen.getAllByRole('region');
    regions.forEach(region => {
      expect(region).toHaveAttribute('aria-label');
    });
    
    // Test error state accessibility
    mockStore.setState({
      loading: false,
      error: '分析失败',
      analysisResult: null
    });
    
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toHaveAttribute('aria-label', '重试分析');
  });

  test('validates analysis result caching functionality', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test initial cache state
    expect(mockStore.getState().cachedResults).toEqual({});
    
    // Perform analysis
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '反复头痛，伴有视觉模糊');
    
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    
    // Mock successful analysis with cache
    const analysisResult = {
      summary: '分析完成，建议就医检查',
      metrics: {
        confidence: '高',
        severity: '中度',
        urgency: '建议一周内就医'
      },
      recommendations: [
        { suggestion: '及时就医检查', priority: '高', category: '就医建议' }
      ]
    };
    
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult,
      cachedResults: {
        '反复头痛，伴有视觉模糊': analysisResult
      }
    });
    
    // Verify cached result is displayed
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('分析完成，建议就医检查')).toBeInTheDocument();
    
    // Test cache hit on repeated analysis
    await user.clear(input);
    await user.type(input, '反复头痛，伴有视觉模糊');
    await user.click(submitButton);
    
    // Verify immediate result from cache
    expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    expect(screen.getByText('分析完成，建议就医检查')).toBeInTheDocument();
    
    // Test cache invalidation
    mockStore.setState({
      cachedResults: {}
    });
    
    await user.click(submitButton);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
  });

  test('validates health consultation functionality', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test health consultation selection
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'health');
    expect(analysisTypeSelect).toHaveValue('health');
    
    // Test health consultation input
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '近期食欲不振，睡眠质量差，经常感到疲劳');
    
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock successful health consultation analysis
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '健康咨询分析完成',
        metrics: {
          healthScore: '75',
          stressLevel: '偏高',
          sleepQuality: '较差',
          confidenceScore: '90%'
        },
        recommendations: [
          { suggestion: '调整作息时间，保证充足睡眠', priority: '高', category: '生活方式' },
          { suggestion: '进行适度运动，增强体质', priority: '中', category: '运动建议' },
          { suggestion: '注意营养均衡，规律进餐', priority: '高', category: '饮食建议' }
        ],
        riskFactors: [
          { description: '睡眠不足可能导致免疫力下降', severity: '中', type: '生理' },
          { description: '压力过大可能影响消化系统', severity: '中', type: '心理' }
        ]
      }
    });
    
    // Verify health consultation specific results
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('健康咨询分析完成')).toBeInTheDocument();
    expect(screen.getByText('调整作息时间，保证充足睡眠')).toBeInTheDocument();
    expect(screen.getByText(/睡眠不足可能导致免疫力下降/)).toBeInTheDocument();
    
    // Verify metrics display
    const metrics = await screen.findByTestId('health-metrics');
    expect(metrics).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('偏高')).toBeInTheDocument();
    expect(screen.getByText('较差')).toBeInTheDocument();
  });

  test('validates early screening analysis functionality', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test early screening selection
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'early_screening');
    expect(analysisTypeSelect).toHaveValue('early_screening');
    
    // Test symptom input for early screening
    const input = screen.getByTestId('analysis-input');
    await user.type(input, '最近一周出现持续性头痛，伴有轻微发热');
    
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock successful early screening analysis
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '早期筛查分析完成',
        metrics: {
          riskLevel: '中等',
          confidence: '高',
          urgencyLevel: '需要关注',
          recommendedTimeframe: '建议一周内就医'
        },
        recommendations: [
          { suggestion: '建议进行详细神经系统检查', priority: '高', category: '专科检查' },
          { suggestion: '记录症状发生频率和持续时间', priority: '中', category: '自我监测' }
        ],
        riskFactors: [
          { description: '持续性头痛可能预示神经系统问题', severity: '中', type: '神经' },
          { description: '轻微发热提示可能存在感染', severity: '低', type: '感染' }
        ]
      }
    });
    
    // Verify early screening specific results
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('早期筛查分析完成')).toBeInTheDocument();
    expect(screen.getByText('建议一周内就医')).toBeInTheDocument();
    expect(screen.getByText('建议进行详细神经系统检查')).toBeInTheDocument();
    expect(screen.getByText(/持续性头痛可能预示神经系统问题/)).toBeInTheDocument();
  });

  test('validates analysis type selection and input validation', async () => {
    const { user, waitForStateUpdate } = renderComponent();
    
    // Test analysis type selection
    const analysisTypeSelect = screen.getByTestId('analysis-type');
    await user.selectOptions(analysisTypeSelect, 'gene');
    expect(analysisTypeSelect).toHaveValue('gene');
    
    // Test input validation for gene sequence
    const input = screen.getByTestId('analysis-input');
    await user.type(input, 'ATCG');
    
    const submitButton = screen.getByTestId('submit-analysis');
    await user.click(submitButton);
    
    // Verify loading state
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock successful gene analysis
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '基因序列分析完成',
        metrics: { 
          confidence: '高',
          geneticRiskScore: '低',
          inheritancePattern: '常染色体显性'
        },
        recommendations: [
          { suggestion: '建议进行进一步基因检测', priority: '高', category: '基因筛查' }
        ],
        riskFactors: [
          { description: '基因变异风险', severity: '低', type: '遗传' }
        ]
      }
    });
    
    // Verify gene analysis specific results
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.getByText('基因序列分析完成')).toBeInTheDocument();
    expect(screen.getByText('常染色体显性')).toBeInTheDocument();
    expect(screen.getByText('建议进行进一步基因检测')).toBeInTheDocument();
  });

  test('handles network errors and retries gracefully', async () => {
    const { user, waitForStateUpdate, findErrorMessage } = renderComponent();
    
    // Mock network error
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: null
    });
    
    const input = screen.getByTestId('analysis-input');
    const submitButton = screen.getByTestId('submit-analysis');
    
    await user.type(input, '测试网络错误处理');
    await user.click(submitButton);
    
    // Simulate network error
    mockStore.setState({
      loading: false,
      error: '网络连接失败，请重试',
      analysisResult: null
    });
    
    // Verify error state
    const errorMessage = await findErrorMessage();
    expect(errorMessage).toHaveTextContent('网络连接失败，请重试');
    
    // Test retry functionality
    const retryButton = screen.getByTestId('retry-button');
    await user.click(retryButton);
    
    // Verify loading state after retry
    await waitForStateUpdate(state => state.loading === true);
    expect(await screen.findByTestId('loading-state')).toBeInTheDocument();
    
    // Mock successful retry
    mockStore.setState({
      loading: false,
      error: null,
      analysisResult: {
        summary: '重试成功',
        metrics: { confidence: '高' }
      }
    });
    
    // Verify successful retry
    const result = await screen.findByTestId('analysis-result');
    expect(result).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('validates basic accessibility features', async () => {
    const { container } = renderComponent();
    
    // Test skip link and main landmarks
    const skipLink = screen.getByText('跳转到主要内容');
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveClass('sr-only');
    
    const mainRegion = screen.getByRole('main');
    expect(mainRegion).toBeInTheDocument();
    
    // Test form accessibility
    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', '健康数据分析表单');
    
    const analysisTypeGroup = screen.getByRole('group', { name: /分析类型/ });
    expect(analysisTypeGroup).toHaveAttribute('aria-labelledby');
    
    const textInput = screen.getByRole('textbox');
    expect(textInput).toHaveAttribute('aria-required', 'true');
    expect(textInput).toHaveAttribute('aria-invalid', 'false');
    
    // Test heading hierarchy
    const headings = Array.from(container.querySelectorAll('[role="heading"]'));
    headings.forEach(heading => {
      expect(heading).toHaveAttribute('aria-level');
    });
    
    // Test interactive elements accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      const rect = button.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.width).toBeGreaterThanOrEqual(44);
    });
  });

  test('validates keyboard navigation and dynamic accessibility updates', async () => {
    const { user } = renderComponent();
    
    const formInput = screen.getByTestId('analysis-input');
    const typeSelect = screen.getByTestId('analysis-type');
    const submitBtn = screen.getByTestId('submit-analysis');
    
    // Test keyboard navigation
    await user.tab();
    expect(document.activeElement).toBe(formInput);
    
    await user.tab();
    expect(document.activeElement).toBe(typeSelect);
    
    await user.tab();
    expect(document.activeElement).toBe(submitBtn);
    
    // Test form interaction and loading states
    await user.type(formInput, '测试键盘导航');
    await user.click(submitBtn);
    
    const loadingIndicator = await screen.findByTestId('loading-state');
    expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
    
    // Test results accessibility
    mockStore.setState({
      loading: false,
      analysisResult: {
        summary: '键盘导航测试结果',
        metrics: { confidence: '高' },
        recommendations: [{ suggestion: '建议1', priority: '高', category: '生活方式' }],
        riskFactors: [{ description: '风险1', severity: '中', type: '健康' }]
      }
    });
    
    const analysisResult = await screen.findByTestId('analysis-result');
    expect(analysisResult).toHaveAttribute('role', 'region');
    expect(analysisResult).toHaveAttribute('aria-live', 'polite');
    
    const metricsList = await screen.findByTestId('health-metrics');
    expect(metricsList).toHaveAttribute('role', 'list');
    expect(metricsList.querySelectorAll('[role="listitem"]')).toHaveLength(1);
    
    const recommendationsList = await screen.findByTestId('recommendations');
    expect(recommendationsList).toHaveAttribute('role', 'list');
    expect(recommendationsList.querySelectorAll('[role="listitem"]')).toHaveLength(1);
    
    const riskList = await screen.findByTestId('risk-factors');
    expect(riskList).toHaveAttribute('role', 'list');
    expect(riskList.querySelectorAll('[role="listitem"]')).toHaveLength(1);
    
    // Test error message accessibility
    mockStore.setState({ error: '测试错误信息' });
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
  });
});
