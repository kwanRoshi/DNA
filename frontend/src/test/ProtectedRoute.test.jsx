import { describe, it, expect, vi } from 'vitest';
import { render } from './utils/test-utils';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../utils/ProtectedRoute';
import { mockStore } from './setup';

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;
const LoginPage = () => <div data-testid="login-page">Login Page</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.reset();
  });

  it('redirects to login when not authenticated', () => {
    mockStore.getState.mockReturnValue({ token: null });
    const { getByTestId } = render(
      <Routes>
        <Route path="/" element={<ProtectedRoute><TestComponent /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
    expect(getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    mockStore.getState.mockReturnValue({ token: 'test-token' });
    const { getByTestId } = render(
      <Routes>
        <Route path="/" element={<ProtectedRoute><TestComponent /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
    expect(getByTestId('protected-content')).toBeInTheDocument();
  });
});
