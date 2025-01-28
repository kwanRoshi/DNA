import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ImageAnalysisComponent from '../components/ImageAnalysisComponent';
import { imageAnalysis } from '../services/api';

vi.mock('../services/api', () => ({
  imageAnalysis: {
    analyze: vi.fn(),
    getHistory: vi.fn(),
    updateNote: vi.fn()
  }
}));

describe('ImageAnalysisComponent', () => {
  const mockAnalysis = {
    _id: '1',
    imageUrl: 'test.jpg',
    analysis: {
      findings: ['发现1', '发现2'],
      recommendations: ['建议1', '建议2']
    },
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    imageAnalysis.analyze.mockResolvedValue(mockAnalysis);
    imageAnalysis.getHistory.mockResolvedValue([mockAnalysis]);
  });

  it('handles image upload and displays analysis results', async () => {
    render(<ImageAnalysisComponent />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/上传图片/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('发现1')).toBeInTheDocument();
      expect(screen.getByText('建议1')).toBeInTheDocument();
    });
  });

  it('displays analysis history', async () => {
    render(<ImageAnalysisComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('发现1')).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  it('handles upload errors', async () => {
    imageAnalysis.analyze.mockRejectedValue(new Error('上传失败'));
    render(<ImageAnalysisComponent />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/上传图片/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/上传失败/i)).toBeInTheDocument();
    });
  });
});
