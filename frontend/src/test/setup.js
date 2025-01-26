import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { mockWindow, mockEthers } from './mocks/window';
import { mockLocalStorage } from './utils/test-utils';
import { JSDOM } from 'jsdom';

// 添加DOM断言
expect.extend(matchers);

// 全局设置
beforeAll(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;

  // 模拟剪贴板
  const mockClipboard = {
    writeText: vi.fn(),
    readText: vi.fn(),
  };

  // 模拟DataTransfer
  class MockDataTransfer {
    constructor() {
      this.data = {};
      this.dropEffect = 'none';
      this.effectAllowed = 'all';
      this.files = [];
      this.items = [];
      this.types = [];
    }

    setData(format, data) {
      this.data[format] = data;
      this.types.push(format);
    }

    getData(format) {
      return this.data[format] || '';
    }

    clearData(format) {
      if (format) {
        delete this.data[format];
        this.types = this.types.filter(type => type !== format);
      } else {
        this.data = {};
        this.types = [];
      }
    }
  }

  // 扩展window对象
  Object.defineProperties(window, {
    ...mockWindow,
    navigator: {
      value: {
        ...window.navigator,
        clipboard: mockClipboard,
      },
      writable: true,
    },
    DataTransfer: {
      value: MockDataTransfer,
      writable: true,
    },
    DragEvent: {
      value: class DragEvent extends window.Event {
        constructor(type, options = {}) {
          super(type, { bubbles: true, cancelable: true, ...options });
          this.dataTransfer = new MockDataTransfer();
        }
      },
      writable: true,
    },
  });

  // 模拟alert
  global.alert = mockWindow.alert;

  // 模拟ethers
  vi.mock('ethers', () => ({
    ethers: mockEthers
  }));

  // 模拟fetch
  global.fetch = vi.fn();
  global.Headers = vi.fn();
  global.Request = vi.fn();
  global.Response = vi.fn();

  // 模拟localStorage
  const storage = mockLocalStorage();
  Object.defineProperty(global, 'localStorage', {
    value: storage,
    writable: true,
    configurable: true
  });

  // 模拟ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // 模拟IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // 模拟matchMedia
  global.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  // 设置测试环境
  vi.useFakeTimers();
});

// 每个测试后清理
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
  localStorage.clear();
  document.body.innerHTML = '';
});

// 所有测试完成后清理
afterAll(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
