import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import DataUploadComponent from '../components/DataUploadComponent';
import AnalysisResultComponent from '../components/AnalysisResultComponent';

const mockAnalysisResponse = {
  analysis: `### 健康见解：
- **基因表达控制**：该序列是由人类基因控制的正常基因表达。
- **代谢活动**：这些DNA序列通常代表细胞内的代谢和生长过程。
- **健康状态**：作为正常的DNA单链序列，表明遗传信息正常。

### 结论：
该DNA序列属于正常范围，并没有明显的健康异常。`,
  model: "ollama-deepseek-r1:1.5b",
  provider: "ollama"
};

describe('DNA Analysis Integration Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAnalysisResponse),
      })
    );
  });

  it('displays analysis results in Chinese', async () => {
    const { container } = render(
      <>
        <DataUploadComponent onAnalysisComplete={(result) => {
          render(<AnalysisResultComponent analysis={result} />, { container });
        }} />
      </>
    );

    const textarea = screen.getByPlaceholderText(/paste your sequence/i);
    fireEvent.change(textarea, { target: { value: 'ATCGATCGATCGTAGCTACG' } });
    
    const submitButton = screen.getByText(/开始分析/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/健康见解/i)).toBeInTheDocument();
      expect(screen.getByText(/基因表达控制/i)).toBeInTheDocument();
      expect(screen.getByText(/结论/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: '分析失败，请重试' }),
      })
    );

    render(<DataUploadComponent onAnalysisComplete={() => {}} />);

    const textarea = screen.getByPlaceholderText(/paste your sequence/i);
    fireEvent.change(textarea, { target: { value: 'ATCGATCGATCGTAGCTACG' } });
    
    const submitButton = screen.getByText(/开始分析/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/分析失败，请重试/i)).toBeInTheDocument();
    });
  });
});
