import { describe, it, expect, beforeEach } from 'vitest';
import useStore from '../utils/store';

describe('Store', () => {
  beforeEach(() => {
    useStore.setState({
      walletAddress: null,
      healthData: null,
      analysisResult: null,
    });
  });

  it('should set wallet address', () => {
    const mockAddress = '0x123';
    useStore.getState().setWalletAddress(mockAddress);
    expect(useStore.getState().walletAddress).toBe(mockAddress);
  });

  it('should set health data', () => {
    const mockData = { data: 'test data' };
    useStore.getState().setHealthData(mockData);
    expect(useStore.getState().healthData).toEqual(mockData);
  });

  it('should set analysis result', () => {
    const mockResult = {
      summary: '健康状况良好',
      recommendations: ['多运动'],
    };
    useStore.getState().setAnalysisResult(mockResult);
    expect(useStore.getState().analysisResult).toEqual(mockResult);
  });

  it('should reset all state', () => {
    // 先设置一些值
    const store = useStore.getState();
    store.setWalletAddress('0x123');
    store.setHealthData({ data: 'test' });
    store.setAnalysisResult({ summary: 'test' });

    // 重置状态
    store.reset();

    // 验证所有值都被重置
    expect(useStore.getState().walletAddress).toBeNull();
    expect(useStore.getState().healthData).toBeNull();
    expect(useStore.getState().analysisResult).toBeNull();
  });

  it('should maintain state immutability', () => {
    const initialState = useStore.getState();
    const mockData = { data: 'test' };
    
    useStore.getState().setHealthData(mockData);
    
    // 验证原始状态没有被修改
    expect(initialState.healthData).toBeNull();
    // 验证新状态已更新
    expect(useStore.getState().healthData).toEqual(mockData);
  });
});
