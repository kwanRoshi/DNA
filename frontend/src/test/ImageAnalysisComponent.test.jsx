import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from './utils/test-utils';
import ImageAnalysisComponent from '../components/ImageAnalysisComponent';
import store from '../utils/store';

describe('ImageAnalysisComponent', () => {
  beforeEach(() => {
    store.setState({
      imageData: null,
      analysisResult: null,
      isLoading: false,
      error: null
    });
    vi.clearAllMocks();
  });

  it('renders image upload interface with Chinese labels', async () => {
    renderWithProviders(<ImageAnalysisComponent />);
    
    const fileInput = screen.getByLabelText('选择医疗影像文件：');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.jpg,.jpeg,.png,.dicom');
    
    const submitButton = screen.getByRole('button', { name: '开始分析' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles successful image upload and analysis', async () => {
    renderWithProviders(<ImageAnalysisComponent />);
    
    const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('选择医疗影像文件：');
    
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [imageFile] } });
    });

    const submitButton = screen.getByRole('button', { name: '开始分析' });
    expect(submitButton).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(submitButton);
      store.setState({
        imageData: { file: imageFile },
        analysisResult: {
          diagnosis: '根据影像分析显示：',
          findings: ['肺部组织正常', '未发现异常阴影'],
          recommendations: ['建议定期复查', '保持良好生活习惯'],
          confidence: 0.95
        },
        isLoading: false
      });
    });

    const results = screen.getByTestId('analysis-results');
    expect(results).toBeInTheDocument();
    expect(results).toHaveTextContent('肺部组织正常');
    expect(results).toHaveTextContent('未发现异常阴影');
    expect(results).toHaveTextContent('建议定期复查');
  });

  it('validates image file types and sizes', async () => {
    renderWithProviders(<ImageAnalysisComponent />);
    
    // Test invalid file type
    const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('选择医疗影像文件：');
    
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });
    
    expect(screen.getByRole('alert')).toHaveTextContent('请上传正确的医疗影像格式');
    
    // Test file size limit
    const largeFile = new File([''.padStart(11 * 1024 * 1024, '0')], 'large.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [largeFile] } });
    });
    
    expect(screen.getByRole('alert')).toHaveTextContent('文件大小不能超过10MB');
  });

  it('handles analysis errors with retry functionality', async () => {
    renderWithProviders(<ImageAnalysisComponent />);
    
    const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('选择医疗影像文件：');
    
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [imageFile] } });
      store.setState({ error: 'AI分析服务暂时不可用' });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('AI分析服务暂时不可用');
    
    const retryButton = screen.getByRole('button', { name: '重试' });
    await act(async () => {
      fireEvent.click(retryButton);
    });
    
    expect(store.getState().error).toBeNull();
    expect(store.getState().isLoading).toBe(true);
  });

  it('validates accessibility features', () => {
    renderWithProviders(<ImageAnalysisComponent />);
    
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-label', '医疗影像分析');
    
    const sections = screen.getAllByRole('region');
    sections.forEach(section => {
      expect(section).toHaveAttribute('aria-labelledby');
    });
  });

  it('handles keyboard navigation', async () => {
    renderWithProviders(<ImageAnalysisComponent />);
    
    const fileInput = screen.getByLabelText('选择医疗影像文件：');
    const submitButton = screen.getByRole('button', { name: '开始分析' });
    
    fileInput.focus();
    expect(document.activeElement).toBe(fileInput);
    
    fireEvent.keyDown(fileInput, { key: 'Tab' });
    expect(document.activeElement).toBe(submitButton);
    
    fireEvent.keyDown(submitButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(fileInput);
  });
});
