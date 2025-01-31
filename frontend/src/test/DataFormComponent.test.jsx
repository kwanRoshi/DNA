import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from './utils/test-utils';
import DataFormComponent from '../components/DataFormComponent';
import mockStore from '../utils/store';

describe('DataFormComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    mockStore.setState({
      healthData: null,
      analysisResult: null,
      isLoading: false,
      error: null
    });
    vi.clearAllMocks();
  });

  it('renders file upload interface with Chinese labels', async () => {
    const { container } = renderWithProviders(<DataFormComponent />);
    
    const fileInput = screen.getByLabelText('选择健康数据文件：');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.txt');
    
    const submitButton = screen.getByRole('button', { name: '开始分析' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    const instructions = screen.getByText(/请上传您的健康数据文件/);
    expect(instructions).toBeInTheDocument();
  });

  it('handles successful file upload and analysis with Chinese content', async () => {
    const { container } = renderWithProviders(<DataFormComponent />);
    const testFile = new File(['最近感觉疲劳，睡眠质量差'], 'health_data.txt', { type: 'text/plain' });
    
    const fileInput = screen.getByLabelText('选择健康数据文件：');
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [testFile] } });
    });

    const submitButton = screen.getByRole('button', { name: '开始分析' });
    expect(submitButton).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(submitButton);
      mockStore.setState({
        healthData: { content: '最近感觉疲劳，睡眠质量差' },
        analysisResult: {
          summary: '根据您的描述，可能存在以下健康问题：',
          symptoms: ['疲劳', '睡眠质量差'],
          recommendations: ['改善作息时间', '保证充足睡眠'],
          riskLevel: '中等'
        },
        isLoading: false
      });
    });

    await waitFor(() => {
      expect(screen.getByText('分析完成')).toBeInTheDocument();
      const results = screen.getByTestId('analysis-results');
      expect(results).toBeInTheDocument();
      expect(results).toHaveTextContent('疲劳');
      expect(results).toHaveTextContent('睡眠质量差');
      expect(results).toHaveTextContent('改善作息时间');
    });
  });

  it('handles various error scenarios with proper Chinese messages', async () => {
    const { container } = renderWithProviders(<DataFormComponent />);
    const testFile = new File(['测试数据'], 'test.txt', { type: 'text/plain' });
    
    const fileInput = screen.getByLabelText('选择健康数据文件：');
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [testFile] } });
    });

    const submitButton = screen.getByRole('button', { name: '开始分析' });
    
    // Test network error
    await act(async () => {
      mockStore.setState({ error: '网络连接失败，请检查网络设置' });
      fireEvent.click(submitButton);
    });

    let alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('网络连接失败');
    
    // Test server error
    await act(async () => {
      mockStore.setState({ error: '服务器错误，请稍后重试' });
    });
    
    alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('服务器错误');
    
    // Test analysis error
    await act(async () => {
      mockStore.setState({ error: 'AI分析服务暂时不可用' });
    });
    
    alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('AI分析服务暂时不可用');
    
    // Test retry functionality
    const retryButton = screen.getByRole('button', { name: '重试' });
    await act(async () => {
      fireEvent.click(retryButton);
    });
    
    expect(mockStore.getState().error).toBeNull();
    expect(mockStore.getState().isLoading).toBe(true);
  });

  it('validates file types and provides Chinese error messages', async () => {
    const { container } = renderWithProviders(<DataFormComponent />);
    
    // Test invalid file type
    const invalidFile = new File(['test data'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('选择健康数据文件：');
    
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });
    
    expect(screen.getByRole('alert')).toHaveTextContent('请上传txt格式的文件');
    
    // Test empty file
    const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [emptyFile] } });
    });
    
    expect(screen.getByRole('alert')).toHaveTextContent('文件内容不能为空');
    
    // Test file with invalid content
    const invalidContentFile = new File(['123456'], 'invalid.txt', { type: 'text/plain' });
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [invalidContentFile] } });
    });
    
    expect(screen.getByRole('alert')).toHaveTextContent('请输入有效的健康描述');
  });

  it('validates file size', async () => {
    const { container } = renderWithProviders(<DataFormComponent />);
    const largeContent = 'x'.repeat(6 * 1024 * 1024);
    const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
    
    const fileInput = screen.getByLabelText('选择健康数据文件：');
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [largeFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText('文件大小不能超过5MB')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('文件大小不能超过5MB');
    });
  });

  it('handles no file selected', async () => {
    const { findByText } = renderWithProviders(<DataFormComponent />);
    const submitButton = await findByText('开始分析');
    expect(submitButton).toBeDisabled();
  });

  it('displays and validates analysis results', async () => {
    const { container } = renderWithProviders(<DataFormComponent />);
    const testFile = new File(['test data'], 'test.txt', { type: 'text/plain' });
    
    const fileInput = screen.getByLabelText('选择健康数据文件：');
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [testFile] } });
    });

    const submitButton = screen.getByText('开始分析');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('analysis-results')).toBeInTheDocument();
      expect(screen.getByText('基因序列分析')).toBeInTheDocument();
      expect(screen.getByText('健康建议')).toBeInTheDocument();
      expect(screen.getByText('风险因素')).toBeInTheDocument();
    });

    // Test keyboard navigation
    const sections = screen.getAllByRole('region');
    sections[0].focus();
    expect(document.activeElement).toBe(sections[0]);
    
    fireEvent.keyDown(sections[0], { key: 'Tab' });
    expect(document.activeElement).toBe(sections[1]);

    // Test Chinese IME input
    const notesInput = screen.getByTestId('analysis-notes');
    notesInput.focus();
    fireEvent.compositionStart(notesInput);
    fireEvent.keyDown(notesInput, { key: 'Process', isComposing: true, data: '分' });
    fireEvent.keyDown(notesInput, { key: 'Process', isComposing: true, data: '分析' });
    fireEvent.compositionEnd(notesInput, { data: '分析笔记' });
    expect(notesInput.value).toBe('分析笔记');

    // Test metrics display
    expect(screen.getByText('健康评分')).toBeInTheDocument();
    expect(screen.getByText('遗传风险')).toBeInTheDocument();
    expect(screen.getByText('生活方式建议')).toBeInTheDocument();
  });
});
