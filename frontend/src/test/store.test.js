import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockStore } from './setup';

const initialState = {
  token: null,
  userId: null,
  userInfo: null,
  walletAddress: null,
  healthData: null,
  analysisResult: null,
  isLoading: false,
  error: null
};

describe('Store', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  afterEach(() => {
    mockStore.reset();
  });

  it('should initialize with default values', () => {
    const state = mockStore.getState();
    expect(state).toEqual(initialState);
  });

  it('should set wallet address', () => {
    mockStore.setWalletAddress('0x123');
    const state = mockStore.getState();
    expect(state.walletAddress).toBe('0x123');
    expect(state.error).toBeNull();
  });

  it('should set health data', () => {
    const data = { test: 'data' };
    mockStore.setState({ healthData: data, isLoading: true });
    let state = mockStore.getState();
    expect(state.isLoading).toBe(true);

    mockStore.setState({ healthData: data, isLoading: false });
    state = mockStore.getState();
    expect(state.healthData).toEqual(data);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set analysis result', () => {
    const result = { summary: '健康状况良好' };
    mockStore.setAnalysisResult(result);
    const state = mockStore.getState();
    expect(state.analysisResult).toEqual(result);
    expect(state.error).toBeNull();
  });

  it('should handle login action', () => {
    const payload = {
      token: 'test-token',
      userId: '123',
      userInfo: { name: '张三' }
    };
    mockStore.login(payload);
    const state = mockStore.getState();
    expect(state.token).toBe(payload.token);
    expect(state.userId).toBe(payload.userId);
    expect(state.userInfo).toEqual(payload.userInfo);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle logout action', () => {
    const loginData = {
      token: 'test-token',
      userId: '123',
      userInfo: { name: '张三' }
    };
    mockStore.login(loginData);
    mockStore.logout();
    const state = mockStore.getState();
    expect(state).toEqual(initialState);
  });

  it('should reset state', () => {
    mockStore.setState({
      token: 'test-token',
      userId: '123',
      userInfo: { name: '张三' },
      walletAddress: '0x123',
      healthData: { test: 'data' },
      analysisResult: { summary: 'test' }
    });
    
    mockStore.reset();
    const state = mockStore.getState();
    expect(state).toEqual(initialState);
  });
});
