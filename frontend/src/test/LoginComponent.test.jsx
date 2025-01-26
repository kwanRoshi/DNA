import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, TEST_IDS } from './utils/test-utils';
import LoginComponent from '../components/LoginComponent';
import useStore from '../utils/store';
import * as api from '../services/api';

vi.mock('../services/api');
vi.mock('../utils/store');
vi.mock('ethers');

describe('LoginComponent', () => {
  beforeEach(() => {
    useStore.mockImplementation(() => ({
      setWalletAddress: vi.fn(),
      walletAddress: null
    }));
    vi.clearAllMocks();
  });

  it('renders connect wallet button', async () => {
    render(<LoginComponent />);
    await waitFor(() => {
      expect(screen.getByText('连接钱包')).toBeInTheDocument();
    });
  });

  it('handles wallet connection success', async () => {
    const mockAddress = '0x123';
    const mockToken = 'test_token';
    const setWalletAddress = vi.fn();
    
    window.ethereum.request.mockResolvedValueOnce([mockAddress]);
    useStore.mockImplementation(() => ({
      setWalletAddress,
      walletAddress: null
    }));
    api.loginWithWallet.mockResolvedValueOnce({ token: mockToken });

    render(<LoginComponent />);

    const connectButton = screen.getByText('连接钱包');
    await fireEvent.click(connectButton);

    await waitFor(() => {
      expect(window.ethereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts'
      });
      expect(api.loginWithWallet).toHaveBeenCalledWith(mockAddress);
      expect(setWalletAddress).toHaveBeenCalledWith(mockAddress);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    });
  });

  it('handles wallet connection error', async () => {
    window.ethereum.request.mockRejectedValueOnce(new Error('User rejected'));

    render(<LoginComponent />);

    const connectButton = screen.getByText('连接钱包');
    await fireEvent.click(connectButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('连接失败: User rejected');
    });
  });

  it('handles no metamask installed', async () => {
    const originalEthereum = window.ethereum;
    window.ethereum = undefined;

    render(<LoginComponent />);

    await waitFor(() => {
      expect(screen.getByText('请先安装OKX钱包')).toBeInTheDocument();
    });

    window.ethereum = originalEthereum;
  });
});
