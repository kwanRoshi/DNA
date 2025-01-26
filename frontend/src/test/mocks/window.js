import { vi } from 'vitest';

export const mockWindow = {
  alert: vi.fn(),
  ethereum: {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  location: {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
  },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
};

export const mockEthers = {
  providers: {
    Web3Provider: vi.fn().mockImplementation(() => ({
      getSigner: vi.fn().mockReturnValue({
        getAddress: vi.fn().mockResolvedValue('0x123'),
      }),
    })),
  },
  Contract: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    functions: {},
  })),
};
