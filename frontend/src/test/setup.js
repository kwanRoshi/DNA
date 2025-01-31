import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';
import { cleanup, act } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { JSDOM } from 'jsdom';
import React from 'react';
import '@testing-library/jest-dom';

expect.extend(matchers);

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;
global.IntersectionObserver = IntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const env = {
  VITE_API_URL: 'http://localhost:8000',
  VITE_DEEPSEEK_API_URL: 'http://localhost:8300'
};

Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:8000',
    VITE_DEEPSEEK_API_URL: 'http://localhost:8300'
  }
});

// Remove Vite plugin mock as we're handling env directly

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: 'node.js' };
global.alert = vi.fn();

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
});

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn()
};

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

const initialState = {
  token: 'test-token',
  userId: '123',
  userInfo: {
    id: '123',
    name: '测试用户',
    level: 3,
    experience: 75,
    consultationCount: 28,
    geneAnalysisCount: 3,
    healthScore: 92,
    healthProfile: {
      age: 30,
      gender: '男',
      height: 175,
      weight: 70
    }
  },
  healthData: {
    symptoms: '头痛，发烧，咳嗽',
    uploadedFiles: ['health_record.pdf'],
    lastUpdate: '2024-01-15'
  },
  analysisResult: {
    summary: '根据AI分析，您的整体健康状况良好。建议继续保持良好的生活习惯，适当增加运动量。',
    recommendations: [
      '每天进行30分钟中等强度运动',
      '保持规律作息，确保7-8小时优质睡眠',
      '注意饮食均衡，增加蔬果摄入',
      '适当进行压力管理和放松'
    ],
    riskFactors: [
      '工作压力偏大，需要注意心理健康',
      '运动量不足，可能影响心血管健康',
      '作息时间不规律'
    ],
    metrics: {
      healthIndex: 85,
      sleepQuality: '良好',
      stressLevel: '中等',
      exerciseFrequency: '需要提高'
    }
  },
  platformInfo: {
    features: ['AI智能诊断', '基因测序', '健康档案'],
    certifications: ['医疗AI系统认证', '数据安全等级保护', '隐私保护认证'],
    securityMeasures: [
      { title: '加密存储', desc: '采用军事级别的AES-256加密算法' },
      { title: '区块链技术', desc: '利用区块链不可篡改特性' },
      { title: '访问控制', desc: '严格的权限管理和访问控制机制' }
    ]
  },
  features: {
    unlocked: ['智能诊断', '基因解读', '健康追踪'],
    locked: ['专家咨询'],
    requirements: {
      '专家咨询': 4
    }
  },
  isLoading: false,
  error: null,
  isAuthenticated: true,
  healthRecords: [
    {
      id: 1,
      type: '健康检查',
      date: '2024-01-15',
      summary: '年度体检报告显示各项指标正常',
      details: {
        bloodPressure: '120/80 mmHg',
        bloodSugar: '5.2 mmol/L',
        heartRate: '75 次/分',
        bmi: '22.5'
      }
    },
    {
      id: 2,
      type: '基因检测',
      date: '2024-01-10',
      summary: '基因测序分析完成，未发现高风险遗传标记',
      details: {
        geneticRisk: '低风险',
        traits: '正常',
        metabolism: 'A型',
        drugSensitivity: '中等'
      }
    }
  ],
  aiAssistantLevel: 3,
  experience: 75,
  consultationCount: 28,
  geneAnalysisCount: 3,
  healthScore: 92
};

const listeners = new Set();
const notifyListeners = () => listeners.forEach(listener => listener());

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/', search: '', hash: '', state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({}),
    Navigate: ({ to }) => `Redirected to ${to}`,
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    MemoryRouter: ({ children }) => React.createElement('div', { 'data-testid': 'memory-router' }, children),
    Routes: ({ children }) => React.createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ path, element }) => React.createElement('div', { 'data-testid': `route-${path}` }, element),
    Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }, 'Outlet Content')
  };
});

const createStore = () => {
  let state = { ...initialState };
  const listeners = new Set();

  const store = {
    getState: () => ({ ...state }),
    setState: (newState) => {
      if (typeof newState === 'function') {
        state = { ...state, ...newState(state) };
      } else {
        state = { ...state, ...newState };
      }
      listeners.forEach(listener => listener(state));
      return state;
    },
    setWalletAddress: (address) => {
      store.setState({ walletAddress: address, error: null });
      return state;
    },
    setHealthData: (data) => {
      store.setState({ healthData: data, isLoading: false, error: null });
      return state;
    },
    setAnalysisResult: (result) => {
      store.setState({ analysisResult: result, error: null });
      return state;
    },
    login: (payload) => {
      store.setState({
        ...payload,
        isLoading: false,
        error: null
      });
      return state;
    },
    logout: () => {
      store.setState(initialState);
      return state;
    },
    reset: () => {
      store.setState(initialState);
      return state;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    }
  };

  return store;
};

export const mockStore = {
  ...createStore(),
  reset: async function() {
    const store = createStore();
    Object.assign(this, store);
    await this.setState(initialState);
    return this.getState();
  }
};

vi.mock('../services/api', () => {
  const mockResponses = {
    '/api/analyze': {
      data: {
        analysis: {
          summary: '根据AI分析，您的整体健康状况良好。建议继续保持良好的生活习惯，适当增加运动量。',
          recommendations: ['保持规律作息', '适量运动', '均衡饮食'],
          riskFactors: ['工作压力较大', '运动量不足'],
          metrics: {
            healthIndex: 85,
            sleepQuality: '良好',
            stressLevel: '中等'
          }
        }
      }
    },
    '/api/login': { data: { token: 'test-token', userId: '123' } },
    '/api/health-records': {
      data: {
        records: [
          {
            id: 1,
            type: '健康检查',
            date: '2024-01-15',
            summary: '年度体检报告显示各项指标正常',
            details: {
              bloodPressure: '120/80 mmHg',
              bloodSugar: '5.2 mmol/L',
              heartRate: '75 次/分',
              bmi: '22.5'
            }
          }
        ]
      }
    },
    '/api/ai-assistant': {
      data: {
        level: 3,
        experience: 2800,
        features: {
          unlocked: ['智能诊断', '基因解读', '健康追踪'],
          locked: ['专家咨询'],
          requirements: { '专家咨询': 4 }
        }
      }
    },
    '/api/user': {
      data: {
        id: '123',
        name: '测试用户',
        healthProfile: {
          age: 30,
          gender: '男',
          height: 175,
          weight: 70
        }
      }
    },
    '/api/platform/overview': {
      data: {
        features: ['AI智能诊断', '数据安全', '健康档案'],
        certifications: ['医疗AI系统认证', '数据安全等级保护', '隐私保护认证'],
        securityMeasures: [
          { title: '加密存储', desc: '采用军事级别的AES-256加密算法' },
          { title: '区块链技术', desc: '利用区块链不可篡改特性' },
          { title: '访问控制', desc: '严格的权限管理和访问控制机制' }
        ]
      }
    }
  };

  const handleRequest = async (method, url, data = null) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      return mockResponses[url] || { data: {} };
    } catch (error) {
      console.error(`Mock ${method.toUpperCase()} request failed:`, error);
      throw error;
    }
  };

  const mockApi = {
    post: vi.fn().mockImplementation((url, data) => handleRequest('post', url, data)),
    get: vi.fn().mockImplementation((url) => handleRequest('get', url)),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  };

  return {
    default: mockApi,
    healthData: {
      analyze: (data) => handleRequest('post', '/api/analyze', data),
      getHistory: () => handleRequest('get', '/api/analysis-history'),
      getRecords: () => handleRequest('get', '/api/health-records'),
      getAIAssistant: () => handleRequest('get', '/api/ai-assistant')
    },
    auth: {
      login: (data) => handleRequest('post', '/api/login', data),
      getUserData: () => handleRequest('get', '/api/user')
    },
    platform: {
      getOverview: () => handleRequest('get', '/api/platform/overview'),
      getFeatures: () => handleRequest('get', '/api/platform/features'),
      getCertifications: () => handleRequest('get', '/api/platform/certifications')
    }
  };
});

vi.mock('../utils/store', () => ({
  __esModule: true,
  default: () => ({
    getState: () => mockStore.getState(),
    setState: mockStore.setState,
    subscribe: mockStore.subscribe,
    destroy: mockStore.destroy,
    setWalletAddress: async (address) => mockStore.setState({ walletAddress: address }),
    setHealthData: async (data) => {
      await mockStore.setState({ isLoading: true });
      await mockStore.setState({ healthData: data, isLoading: false });
    },
    setAnalysisResult: async (result) => mockStore.setState({ analysisResult: result }),
    login: async (payload) => mockStore.setState({ ...payload }),
    logout: async () => mockStore.setState(initialState),
    reset: async () => mockStore.setState(initialState)
  })
}));

beforeAll(() => {
  vi.useFakeTimers();
});

beforeEach(async () => {
  cleanup();
  vi.resetAllMocks();
  await mockStore.reset();
  localStorage.clear();
  document.body.innerHTML = '';
  vi.clearAllTimers();
  
  // Mock DeepSeek service
  vi.mock('../services/deepseek', () => ({
    analyzeHealth: vi.fn().mockResolvedValue({
      summary: '根据AI分析，您的整体健康状况良好',
      recommendations: ['保持规律作息', '适量运动'],
      riskFactors: ['工作压力较大']
    }),
    analyzeGenes: vi.fn().mockResolvedValue({
      geneticRisk: '低风险',
      traits: '正常',
      metabolism: 'A型'
    })
  }));

  // Set default timeout for async operations
  vi.setConfig({
    testTimeout: 30000,
    hookTimeout: 30000
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.body.innerHTML = '';
  localStorage.clear();
  mockStore.reset();
  vi.clearAllTimers();
});

afterAll(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  global.fetch.mockReset();
  cleanup();
});
