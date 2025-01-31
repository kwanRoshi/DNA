import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import DataUploadComponent from '../components/DataUploadComponent';

const mockFile = new File(['ATCGATCGATCGTAGCTACG'], 'test.txt', { type: 'text/plain' });

describe('File Upload Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          analysis: `### 序列分析：
- **序列类型**：DNA序列
- **长度**：20个碱基对
- **组成**：AT含量50%, GC含量50%

### 健康评估：
该序列显示正常的基因组特征。`,
          model: "ollama-deepseek-r1:1.5b",
          provider: "ollama"
        }),
      })
    );
  });

  it('handles file upload correctly', async () => {
    const handleAnalysisComplete = vi.fn();
    render(<DataUploadComponent onAnalysisComplete={handleAnalysisComplete} />);

    const fileInput = screen.getByLabelText(/上传序列文件/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const submitButton = screen.getByText(/开始分析/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(handleAnalysisComplete).toHaveBeenCalledWith(expect.objectContaining({
        analysis: expect.stringContaining('序列分析'),
        model: expect.stringContaining('deepseek'),
        provider: 'ollama'
      }));
    });
  });

  it('validates API endpoint configuration', async () => {
    const originalEnv = process.env;
    process.env.VITE_API_URL = 'http://test-api:8000';
    
    render(<DataUploadComponent onAnalysisComplete={() => {}} />);
    const textarea = screen.getByPlaceholderText(/paste your sequence/i);
    fireEvent.change(textarea, { target: { value: 'ATCG' } });
    
    const submitButton = screen.getByText(/开始分析/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api:8000/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sequence: 'ATCG' })
        })
      );
    }, { timeout: 3000 });

    process.env = originalEnv;
  });

  it('displays error message for invalid file type', async () => {
    const invalidFile = new File(['invalid'], 'test.pdf', { type: 'application/pdf' });
    render(<DataUploadComponent onAnalysisComplete={() => {}} />);

    const fileInput = screen.getByLabelText(/上传序列文件/i);
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(screen.getByText(/不支持的文件类型/i)).toBeInTheDocument();
  });
});
