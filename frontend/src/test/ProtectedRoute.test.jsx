import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from './utils/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../utils/ProtectedRoute';
import useStore from '../utils/store';

vi.mock('../utils/store');

const TestComponent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

const renderWithRouter = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('redirects to login when no wallet address', async () => {
    useStore.mockImplementation(() => ({
      walletAddress: null,
    }));

    renderWithRouter(null, { route: '/protected' });

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('redirects to login when no token', async () => {
    useStore.mockImplementation(() => ({
      walletAddress: '0x123',
    }));

    renderWithRouter(null, { route: '/protected' });

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders protected content when authenticated', async () => {
    useStore.mockImplementation(() => ({
      walletAddress: '0x123',
    }));
    localStorage.setItem('token', 'valid_token');

    renderWithRouter(null, { route: '/protected' });

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
