import { vi } from 'vitest';

export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    },
    defaults: {
      baseURL: '',
      headers: {
        common: {},
        get: {},
        post: {},
        put: {},
        delete: {}
      }
    }
  })),
  defaults: {
    baseURL: '',
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      delete: {}
    }
  },
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() }
  }
};

vi.mock('axios', () => ({
  default: mockAxios,
  ...mockAxios
}));
