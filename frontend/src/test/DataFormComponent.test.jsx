import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, TEST_IDS } from './utils/test-utils';
import DataFormComponent from '../components/DataFormComponent';
import useStore from '../utils/store';
import * as api from '../services/api';

vi.mock('../services/api');
vi.mock('../utils/store');

describe('DataFormComponent', () => {
  beforeEach(() => {
    useStore.mockImplementation(() => ({
      setHealthData: vi.fn(),
      walletAddress: '0x123',
      healthData: null
    }));
    vi.clearAllMocks();
  });

  it('renders file upload input', async () => {
    render(<DataFormComponent />);
    await waitFor(() => {
      expect(screen.getByText('选择健康数据文件：')).toBeInTheDocument();
    });
  });

  it('handles file upload success', async () => {
    const mockFile = new File(['test data'], 'test.txt', { type: 'text/plain' });
    const setHealthData = vi.fn();
    const mockResponse = { data: 'test data' };
    
    useStore.mockImplementation(() => ({
      setHealthData,
      walletAddress: '0x123',
      healthData: null
    }));

    api.uploadHealthData.mockResolvedValueOnce(mockResponse);

    render(<DataFormComponent />);

    const fileInput = screen.getByLabelText('选择健康数据文件：');
    await fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const submitButton = screen.getByText('开始分析');
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.uploadHealthData).toHaveBeenCalledWith(mockFile);
      expect(setHealthData).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('handles file upload error', async () => {
    const mockFile = new File(['test data'], 'test.txt', { type: 'text/plain' });
    api.uploadHealthData.mockRejectedValueOnce(new Error('Upload failed'));

    render(<DataFormComponent />);

    const fileInput = screen.getByLabelText('选择健康数据文件：');
    await fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const submitButton = screen.getByText('开始分析');
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('上传失败: Upload failed');
    });
  });

  it('validates file type', async () => {
    const mockFile = new File(['test data'], 'test.jpg', { type: 'image/jpeg' });

    render(<DataFormComponent />);

    const fileInput = screen.getByLabelText('选择健康数据文件：');
    await fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('请上传正确的文件格式');
    });
  });

  it('handles no file selected', async () => {
    render(<DataFormComponent />);

    const submitButton = screen.getByText('开始分析');
    expect(submitButton).toBeDisabled();
  });
});
