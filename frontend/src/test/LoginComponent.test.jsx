import { describe, it, expect, vi } from 'vitest';
import { render, act } from './utils/test-utils';
import LoginComponent from '../components/LoginComponent';
import { mockStore, mockNavigate } from './setup';

describe('LoginComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await mockStore.reset();
  });

  it('renders welcome message and login button', () => {
    const { getByText, getByTestId } = render(<LoginComponent />);
    expect(getByText('AI健康检测平台')).toBeInTheDocument();
    expect(getByText('欢迎使用智能健康检测系统')).toBeInTheDocument();
    expect(getByTestId('login-button')).toHaveTextContent('开始使用');
  });

  it('handles successful login', async () => {
    const { getByTestId } = render(<LoginComponent />);
    const button = getByTestId('login-button');
    
    await act(async () => {
      await mockStore.setState({ token: null });
      await button.click();
    });
    
    expect(mockStore.login).toHaveBeenCalledWith({
      token: 'dummy-token',
      userId: 'guest-user',
      userInfo: { name: 'Guest User' }
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading state during login', async () => {
    const { getByTestId } = render(<LoginComponent />);
    const button = getByTestId('login-button');
    
    let loadingState;
    await act(async () => {
      await mockStore.setState({ token: null });
      await button.click();
      loadingState = getByTestId('loading-state');
    });
    
    expect(loadingState).toBeInTheDocument();
  });

  it('handles login error', async () => {
    mockStore.login.mockRejectedValueOnce(new Error('登录失败'));
    const { getByTestId } = render(<LoginComponent />);
    const button = getByTestId('login-button');
    
    await act(async () => {
      await mockStore.setState({ token: null });
      await button.click();
    });
    
    expect(getByTestId('error-message')).toHaveTextContent('登录失败');
  });
});
