import React from 'react';
import { render as rtlRender, waitFor, within, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { mockStore } from '../setup';

export const createTestFile = (name = 'test.txt', type = 'text/plain', content = 'test content') => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

const DEFAULT_TIMEOUT = 30000;

const customRender = (ui, options = {}) => {
  const user = userEvent.setup({ delay: null });
  
  const Wrapper = ({ children }) => {
    const [state, setState] = React.useState(mockStore.getState());
    
    React.useEffect(() => {
      const unsubscribe = mockStore.subscribe((newState) => {
        setState(newState);
      });
      return () => unsubscribe();
    }, []);

    return (
      <MemoryRouter initialEntries={[options.route || '/']}>
        <div data-testid="app-wrapper" data-state={JSON.stringify(state)}>
          {children}
        </div>
      </MemoryRouter>
    );
  };
  
  const result = rtlRender(ui, {
    wrapper: ({ children }) => (
      <Wrapper>
        {children}
      </Wrapper>
    ),
    ...options
  });

  return {
    user,
    ...result,
    ...customQueries,
    findElement,
    waitForElement,
    waitForElementToBeRemoved,
    screen,
    container: result.container,
    mockStore
  };
};

const findElement = async (getElement, { timeout = DEFAULT_TIMEOUT, interval = 25 } = {}) => {
  const startTime = Date.now();
  let attempts = 0;
  let lastError = null;
  let lastElement = null;

  const checkElement = async () => {
    try {
      const element = getElement();
      lastElement = element;
      if (!element) {
        lastError = new Error('Element not found in DOM');
        return null;
      }
      return element;
    } catch (err) {
      lastError = err;
      return null;
    }
  };

  while (Date.now() - startTime < timeout) {
    attempts++;
    const element = await checkElement();
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  const timeElapsed = Date.now() - startTime;
  const elementType = getElement.toString().match(/queryBy\w+/)?.[0] || 'element';
  const state = document.body.innerHTML;
  
  throw new Error(
    `${elementType} not found after ${timeElapsed}ms (${attempts} attempts)\n` +
    `Last error: ${lastError?.message || 'Unknown error'}\n` +
    `Last element: ${lastElement?.outerHTML || 'N/A'}\n` +
    `Component state:\n${state}`
  );
};

const customQueries = {
  findLoadingState: async (timeout = DEFAULT_TIMEOUT) => 
    findElement(() => screen.queryByTestId('loading-state') || screen.queryByText(/正在生成分析报告|正在处理|加载中|请稍候/), { timeout }),
  findErrorMessage: async (timeout = DEFAULT_TIMEOUT) => 
    findElement(() => screen.queryByTestId('error-message') || screen.queryByText(/错误|失败|请重试|操作未完成/), { timeout }),
  findSuccessMessage: async (timeout = DEFAULT_TIMEOUT) => 
    findElement(() => screen.queryByTestId('success-message') || screen.queryByText(/分析成功|上传成功|操作成功|完成/), { timeout }),
  findAnalysisResult: async (timeout = DEFAULT_TIMEOUT) => 
    findElement(() => screen.queryByTestId('analysis-result') || screen.queryByText(/根据AI分析|健康评估|诊断结果|分析报告/), { timeout }),
  findAnalysisContent: async (timeout = DEFAULT_TIMEOUT) => 
    findElement(() => screen.queryByTestId('analysis-content') || screen.queryByText(/健康建议|风险因素|生活方式|注意事项/), { timeout }),
  findNoDataMessage: async (timeout = DEFAULT_TIMEOUT) => 
    findElement(() => screen.queryByTestId('no-data-message') || screen.queryByText(/请先上传健康数据文件|暂无健康数据|未找到相关记录/), { timeout }),
  findHealthMetrics: async (timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId('health-metrics') || screen.queryByText(/健康指标|健康评分/), { timeout }),
  findRiskFactors: async (timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId('risk-factors') || screen.queryByText(/风险因素|注意事项/), { timeout }),
  findRecommendations: async (timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId('recommendations') || screen.queryByText(/建议|生活方式/), { timeout }),
  findAIAssistant: async (timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId('ai-assistant') || screen.queryByText(/专属AI助手|AI等级/), { timeout }),
  findHealthRecords: async (timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId('health-records') || screen.queryByText(/健康档案|体检记录/), { timeout }),
  findPlatformStats: async (timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId('platform-stats') || screen.queryByText(/平台数据|用户数量/), { timeout }),
  findCertifications: async (timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId('certifications') || screen.queryByText(/资质认证|医疗器械/), { timeout }),
  findConsultationHistory: async (timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId('consultation-history') || screen.queryByText(/咨询记录|历史记录/), { timeout }),
  findFeatureCard: async (feature, timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId(`feature-${feature}`) || screen.queryByText(feature), { timeout }),
  findMetricValue: async (metric, timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByTestId(`metric-${metric}`) || screen.queryByText(new RegExp(metric)), { timeout }),
  findNavigationElement: async (text, timeout = DEFAULT_TIMEOUT) =>
    findElement(() => screen.queryByRole('link', { name: text }) || screen.queryByText(text), { timeout }),
  findFileInput: async (timeout = DEFAULT_TIMEOUT) => 
    findElement(() => screen.queryByTestId('file-input') || screen.queryByLabelText('选择健康数据文件：'), { timeout }),
  findSubmitButton: async (timeout = DEFAULT_TIMEOUT) => 
    findElement(() => screen.queryByTestId('submit-button') || screen.queryByText('开始分析'), { timeout }),
  findTextWithin: async (container, text) => {
    const element = await findElement(() => within(container).queryByText(text));
    if (!element) throw new Error(`Text "${text}" not found within container`);
    return element;
  },
  uploadFile: async (file) => {
    const input = await findElement(() => 
      screen.queryByTestId('file-input') || 
      screen.queryByLabelText('选择健康数据文件：')
    );
    if (!input) throw new Error('文件上传输入框未找到');
    
    await act(async () => {
      await userEvent.upload(input, file);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const submitButton = await findElement(() => 
      screen.queryByTestId('submit-button') || 
      screen.queryByText('开始分析')
    );
    if (!submitButton) throw new Error('提交按钮未找到');

    return { input, submitButton };
  },
  submitForm: async () => {
    const submitButton = await findElement(() => screen.queryByTestId('submit-button'));
    if (!submitButton) throw new Error('Submit button not found');
    
    await act(async () => {
      await userEvent.click(submitButton);
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    return submitButton;
  },
  waitForStateUpdate: async (predicate, { timeout = 10000, interval = 100 } = {}) => {
    const startTime = Date.now();
    let lastState = null;
    
    while (Date.now() - startTime < timeout) {
      const currentState = mockStore.getState();
      if (predicate(currentState)) return true;
      lastState = currentState;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(
      `State update timeout after ${timeout}ms.\n` +
      `Last state: ${JSON.stringify(lastState, null, 2)}`
    );
  }
};

const waitForElement = async (getElement, { timeout = DEFAULT_TIMEOUT, interval = 25 } = {}) => {
  const startTime = Date.now();
  let attempts = 0;
  let lastError = null;

  while (Date.now() - startTime < timeout) {
    attempts++;
    try {
      const element = getElement();
      if (element) return element;
    } catch (err) {
      lastError = err;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(
    `Element not found after ${timeout}ms (${attempts} attempts)\n` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
};

const waitForElementToBeRemoved = async (getElement, { timeout = DEFAULT_TIMEOUT, interval = 25 } = {}) => {
  const startTime = Date.now();
  let attempts = 0;
  let lastElement = null;

  while (Date.now() - startTime < timeout) {
    attempts++;
    try {
      const element = getElement();
      if (!element) return true;
      lastElement = element;
    } catch (err) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(
    `Element still present after ${timeout}ms (${attempts} attempts)\n` +
    `Last element: ${lastElement?.outerHTML || 'N/A'}`
  );
};

const renderWithProviders = (ui, options = {}) => {
  const user = userEvent.setup({ delay: null });
  
  const Wrapper = ({ children }) => {
    const [state, setState] = React.useState(mockStore.getState());
    
    React.useEffect(() => {
      const unsubscribe = mockStore.subscribe((newState) => {
        setState(newState);
      });
      return () => unsubscribe();
    }, []);

    return (
      <MemoryRouter initialEntries={[options.route || '/']}>
        <div data-testid="app-wrapper" data-state={JSON.stringify(state)}>
          {children}
        </div>
      </MemoryRouter>
    );
  };
  
  const result = rtlRender(ui, {
    wrapper: Wrapper,
    ...options
  });

  return {
    user,
    ...result,
    ...customQueries,
    findElement,
    waitForElement,
    waitForElementToBeRemoved,
    screen,
    container: result.container,
    mockStore
  };
};

export { customRender as render, renderWithProviders, waitFor, act, within, screen, mockStore };
