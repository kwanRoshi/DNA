import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

// 自定义渲染器
const AllProviders = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (ui, options = {}) => {
  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });
  
  return {
    user,
    ...render(ui, { 
      wrapper: AllProviders,
      ...options,
    })
  };
};

// 导出所有testing-library的工具
export * from '@testing-library/react';

// 覆盖render方法
export { customRender as render };

// 测试工具函数
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    length: Object.keys(store).length,
    key: vi.fn((index) => Object.keys(store)[index]),
  };
};

// 测试工具常量
export const TEST_IDS = {
  loginButton: 'login-button',
  fileInput: 'file-input',
  submitButton: 'submit-button',
  analysisResult: 'analysis-result',
  errorMessage: 'error-message',
  loadingMessage: 'loading-message',
};
