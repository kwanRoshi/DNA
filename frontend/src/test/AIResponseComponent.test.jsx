import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render, TEST_IDS } from './utils/test-utils';
import AIResponseComponent from '../components/AIResponseComponent';
import useStore from '../utils/store';

vi.mock('../utils/store');

describe('AIResponseComponent', () => {
  beforeEach(() => {
    useStore.mockImplementation(() => ({
      analysisResult: null,
      healthData: { data: 'test data' },
    }));
    vi.clearAllMocks();
  });

  it('renders loading state when no analysis result', async () => {
    useStore.mockImplementation(() => ({
      analysisResult: null,
      healthData: { data: 'test data' },
    }));

    render(<AIResponseComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('正在生成分析报告...')).toBeInTheDocument();
    });
  });

  it('renders analysis result when available', async () => {
    const mockAnalysis = {
      summary: '根据健康数据分析，整体状况良好',
      recommendations: ['多运动', '均衡饮食'],
      riskFactors: ['压力过大'],
      metrics: {
        healthScore: 85,
        stressLevel: 'medium',
        sleepQuality: 'fair'
      }
    };

    useStore.mockImplementation(() => ({
      analysisResult: { analysis: mockAnalysis },
      healthData: { data: 'test data' },
    }));

    render(<AIResponseComponent />);

    await waitFor(() => {
      expect(screen.getByText(/根据健康数据分析，整体状况良好/)).toBeInTheDocument();
      expect(screen.getByText(/多运动/)).toBeInTheDocument();
      expect(screen.getByText(/均衡饮食/)).toBeInTheDocument();
      expect(screen.getByText(/压力过大/)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    useStore.mockImplementation(() => ({
      analysisResult: { error: 'AI分析失败' },
      healthData: { data: 'test data' },
    }));

    render(<AIResponseComponent />);

    await waitFor(() => {
      expect(screen.getByText('AI分析失败')).toBeInTheDocument();
    });
  });

  it('renders no data message when health data is missing', async () => {
    useStore.mockImplementation(() => ({
      analysisResult: null,
      healthData: null,
    }));

    render(<AIResponseComponent />);

    await waitFor(() => {
      expect(screen.getByText('请先上传健康数据文件')).toBeInTheDocument();
    });
  });
});
