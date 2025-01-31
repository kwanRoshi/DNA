import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import MainLayout from '../components/MainLayout';
import { renderWithProviders } from './utils/test-utils';
import { mockStore } from './setup';

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.setState({
      user: {
        id: '123',
        name: '张三',
        aiAssistantLevel: 2
      },
      loading: false,
      error: null,
      currentSection: 'overview'
    });
  });

  test('renders main layout with navigation', () => {
    const { container } = renderWithProviders(<MainLayout />);
    
    expect(screen.getByText('AI健康检测平台')).toBeInTheDocument();
    expect(screen.getByTestId('main-nav')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="main-layout"]')).toBeInTheDocument();
  });

  test('handles navigation between sections', async () => {
    renderWithProviders(<MainLayout />);
    
    const navItems = [
      { text: '平台概览', id: 'overview' },
      { text: '健康助手', id: 'assistant' },
      { text: '健康档案', id: 'records' },
      { text: '个人AI助手', id: 'personal' }
    ];

    for (const item of navItems) {
      const navLink = screen.getByText(item.text);
      fireEvent.click(navLink);
      
      await waitFor(() => {
        expect(mockStore.getState().currentSection).toBe(item.id);
        expect(screen.getByTestId(`${item.id}-section`)).toBeInTheDocument();
      });
    }
  });

  test('displays user information and AI assistant level', async () => {
    renderWithProviders(<MainLayout />);
    
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText(/AI助手等级: 2/)).toBeInTheDocument();
    });
  });

  test('handles responsive layout and mobile menu', async () => {
    const { container } = renderWithProviders(<MainLayout />);
    
    const menuButton = screen.getByTestId('mobile-menu-button');
    expect(menuButton).toBeInTheDocument();
    
    fireEvent.click(menuButton);
    await waitFor(() => {
      expect(screen.getByTestId('mobile-menu')).toHaveClass('visible');
    });
    
    const mobileNavItems = container.querySelectorAll('[data-testid="mobile-nav-item"]');
    expect(mobileNavItems.length).toBeGreaterThan(0);
    
    fireEvent.click(mobileNavItems[0]);
    await waitFor(() => {
      expect(screen.getByTestId('mobile-menu')).not.toHaveClass('visible');
    });
  });

  test('validates section content loading', async () => {
    renderWithProviders(<MainLayout />);
    
    mockStore.setState({ loading: true });
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();

    mockStore.setState({ 
      loading: false,
      currentSection: 'assistant'
    });

    await waitFor(() => {
      expect(screen.getByTestId('assistant-section')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });
  });

  test('handles error states in layout', async () => {
    renderWithProviders(<MainLayout />);
    
    mockStore.setState({ 
      error: '加载失败，请刷新页面重试',
      currentSection: 'records'
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('加载失败');
    });
    
    const retryButton = screen.getByRole('button', { name: /重试/ });
    fireEvent.click(retryButton);
    expect(mockStore.getState().error).toBeNull();
  });

  test('validates accessibility features', () => {
    const { container } = renderWithProviders(<MainLayout />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', '主导航');
    
    const menuItems = container.querySelectorAll('[role="menuitem"]');
    menuItems.forEach(item => {
      expect(item).toHaveAttribute('aria-label');
    });
    
    const headings = container.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
      expect(heading).toHaveAttribute('role', 'heading');
    });
  });
});
