import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from './utils/test-utils';
import ImageAnalysisHistory from '../components/ImageAnalysisHistory';
import { imageAnalysis } from '../services/api';

vi.mock('../services/api', () => ({
  imageAnalysis: {
    getHistory: vi.fn(),
    deleteAnalysis: vi.fn(),
    updateNote: vi.fn()
  }
}));

describe('ImageAnalysisHistory', () => {
  const mockAnalysisResults = [
    {
      _id: '1',
      timestamp: new Date('2024-01-01T10:00:00').getTime(),
      imageInfo: {
        fileName: 'test1.jpg'
      },
      analysisType: '医疗分析',
      result: '正常，未发现异常',
      note: '定期复查'
    },
    {
      _id: '2',
      timestamp: new Date('2024-01-02T11:00:00').getTime(),
      imageInfo: {
        fileName: 'test2.jpg'
      },
      analysisType: '病理分析',
      result: {
        diagnosis: '轻微炎症',
        confidence: '90%'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    imageAnalysis.getHistory.mockResolvedValue({ history: mockAnalysisResults });
  });

  it('renders loading state initially', () => {
    render(<ImageAnalysisHistory />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('displays analysis history after loading', async () => {
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('test1.jpg')).toBeInTheDocument();
    expect(screen.getByText('医疗分析')).toBeInTheDocument();
    expect(screen.getByText('正常，未发现异常')).toBeInTheDocument();
    expect(screen.getByText('定期复查')).toBeInTheDocument();
  });

  it('handles empty analysis history', async () => {
    imageAnalysis.getHistory.mockResolvedValueOnce({ history: [] });
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('暂无分析记录')).toBeInTheDocument();
    });
  });

  it('handles loading error', async () => {
    imageAnalysis.getHistory.mockRejectedValueOnce(new Error('加载失败'));
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('加载分析历史失败')).toBeInTheDocument();
    });
  });

  it('handles note editing', async () => {
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('定期复查')).toBeInTheDocument();
    });

    const editButton = screen.getByText('编辑备注');
    fireEvent.click(editButton);

    const textarea = screen.getByPlaceholderText('添加备注...');
    fireEvent.change(textarea, { target: { value: '新的备注内容' } });

    const saveButton = screen.getByText('保存');
    imageAnalysis.updateNote.mockResolvedValueOnce({});
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(imageAnalysis.updateNote).toHaveBeenCalledWith('1', '新的备注内容');
    });
  });

  it('handles note editing cancellation', async () => {
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('定期复查')).toBeInTheDocument();
    });

    const editButton = screen.getByText('编辑备注');
    fireEvent.click(editButton);

    const textarea = screen.getByPlaceholderText('添加备注...');
    fireEvent.change(textarea, { target: { value: '新的备注内容' } });

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(screen.queryByPlaceholderText('添加备注...')).not.toBeInTheDocument();
    expect(screen.getByText('定期复查')).toBeInTheDocument();
  });

  it('handles analysis deletion', async () => {
    window.confirm = vi.fn(() => true);
    imageAnalysis.deleteAnalysis.mockResolvedValueOnce({});
    
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      expect(screen.getAllByText('删除')[0]).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByText('删除')[0];
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('确定要删除这条分析记录吗？');
    await waitFor(() => {
      expect(imageAnalysis.deleteAnalysis).toHaveBeenCalledWith('1');
    });
  });

  it('handles new analysis results from events', async () => {
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('test1.jpg')).toBeInTheDocument();
    });

    const newAnalysis = {
      _id: '3',
      timestamp: new Date().getTime(),
      imageInfo: {
        fileName: 'new.jpg'
      },
      analysisType: '通用分析',
      result: '分析完成'
    };

    window.dispatchEvent(new CustomEvent('imageAnalysisComplete', {
      detail: newAnalysis
    }));

    await waitFor(() => {
      expect(screen.getByText('new.jpg')).toBeInTheDocument();
    });
  });

  it('formats dates in Chinese locale', async () => {
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      const dateText = screen.getByText(/2024\/01\/01/);
      expect(dateText).toBeInTheDocument();
    });
  });

  it('handles object-type analysis results', async () => {
    render(<ImageAnalysisHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('diagnosis:')).toBeInTheDocument();
      expect(screen.getByText('轻微炎症')).toBeInTheDocument();
      expect(screen.getByText('confidence:')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });
});
