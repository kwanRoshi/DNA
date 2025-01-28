import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TaskSystemComponent from '../components/TaskSystemComponent';
import { tasks } from '../services/api';

vi.mock('../services/api', () => ({
  tasks: {
    getAll: vi.fn(),
    create: vi.fn(),
    updateResult: vi.fn(),
  }
}));

const mockTasks = [
  {
    _id: '1',
    fileName: 'test.txt',
    fileType: 'dna',
    status: 'completed',
    createdAt: new Date().toISOString(),
    analysisResult: {
      summary: '测试DNA序列分析',
      recommendations: [
        { text: '建议1', priority: 'high' },
        { text: '建议2', priority: 'medium' }
      ],
      risks: [
        { text: '风险1', severity: 'high' },
        { text: '风险2', severity: 'low' }
      ]
    }
  },
  {
    _id: '2',
    fileName: 'pending.txt',
    fileType: 'dna',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

describe('TaskSystemComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tasks.getAll.mockResolvedValue({ data: mockTasks });
  });

  it('renders task list and handles loading state', async () => {
    render(<TaskSystemComponent />);
    
    expect(screen.getByText('数据分析任务')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(screen.getByText('pending.txt')).toBeInTheDocument();
    });
  });

  it('displays task details correctly', async () => {
    render(<TaskSystemComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('测试DNA序列分析')).toBeInTheDocument();
      expect(screen.getByText('建议1')).toBeInTheDocument();
      expect(screen.getByText('风险1')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    tasks.getAll.mockRejectedValue(new Error('加载失败'));
    render(<TaskSystemComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('加载任务列表失败')).toBeInTheDocument();
    });
  });
});
