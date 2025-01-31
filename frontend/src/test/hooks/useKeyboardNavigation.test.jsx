import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

const TestComponent = ({ selector, options }) => {
  const handleKeyDown = useKeyboardNavigation(selector, options);
  
  return (
    <div role="navigation">
      <button data-testid="item-1" tabIndex={0} onKeyDown={handleKeyDown}>Item 1</button>
      <button data-testid="item-2" tabIndex={0} onKeyDown={handleKeyDown}>Item 2</button>
      <button data-testid="item-3" tabIndex={0} onKeyDown={handleKeyDown}>Item 3</button>
    </div>
  );
};

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('cycles focus forward with Tab key', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'Tab' });
    expect(document.activeElement).toBe(items[1]);
    
    fireEvent.keyDown(items[1], { key: 'Tab' });
    expect(document.activeElement).toBe(items[2]);
    
    fireEvent.keyDown(items[2], { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('cycles focus backward with Shift+Tab', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(items[2]);
    
    fireEvent.keyDown(items[2], { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(items[1]);
  });

  test('navigates with arrow keys when enabled', () => {
    render(<TestComponent selector="[data-testid^='item']" options={{ enableArrowKeys: true }} />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    
    fireEvent.keyDown(items[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(items[1]);
    
    fireEvent.keyDown(items[1], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('maintains focus at start when maintainFocus is true', () => {
    render(<TestComponent selector="[data-testid^='item']" options={{ maintainFocus: true }} />);
    const items = screen.getAllByRole('button');
    
    items[2].focus();
    fireEvent.keyDown(items[2], { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('ignores arrow keys when disabled', () => {
    render(<TestComponent selector="[data-testid^='item']" options={{ enableArrowKeys: false }} />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('handles empty selector gracefully', () => {
    render(<TestComponent selector="" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('handles non-existent elements gracefully', () => {
    render(<TestComponent selector="[data-testid^='non-existent']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('handles elements not in navigation group', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    const outsideElement = document.createElement('button');
    outsideElement.setAttribute('data-testid', 'outside-element');
    document.body.appendChild(outsideElement);
    
    outsideElement.focus();
    fireEvent.keyDown(outsideElement, { key: 'Tab' });
    expect(document.activeElement).toBe(outsideElement);
    
    document.body.removeChild(outsideElement);
  });

  test('handles modifier keys correctly', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Control' });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'Alt' });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'Meta' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('handles multiple key combinations', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Tab', ctrlKey: true });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'ArrowDown', altKey: true });
    expect(document.activeElement).toBe(items[0]);
  });

  test('handles rapid key presses', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Tab' });
    fireEvent.keyDown(items[1], { key: 'Tab' });
    fireEvent.keyDown(items[2], { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('maintains focus within group with mixed selectors', () => {
    render(<TestComponent selector="[data-testid^='item'], .nav-item" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Tab' });
    expect(document.activeElement).toBe(items[1]);
    
    fireEvent.keyDown(items[1], { key: 'Tab' });
    expect(document.activeElement).toBe(items[2]);
  });

  test('handles focus with dynamic element updates', () => {
    const { rerender } = render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Tab' });
    expect(document.activeElement).toBe(items[1]);
    
    rerender(<TestComponent selector="[data-testid^='item']" options={{ maintainFocus: true }} />);
    fireEvent.keyDown(items[1], { key: 'Tab' });
    expect(document.activeElement).toBe(items[2]);
  });

  test('handles invalid key events', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: undefined });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: null });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], {});
    expect(document.activeElement).toBe(items[0]);
  });

  test('handles focus with removed elements', () => {
    const { rerender } = render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    items[0].remove();
    fireEvent.keyDown(document.body, { key: 'Tab' });
    expect(document.activeElement).not.toBe(items[0]);
  });

  test('supports ARIA keyboard navigation', () => {
    render(<TestComponent selector="[role='button']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    expect(document.activeElement).toBe(items[0]);
    expect(items[0]).toHaveAttribute('tabIndex', '0');
    
    fireEvent.keyDown(items[0], { key: 'Tab' });
    expect(document.activeElement).toBe(items[1]);
    expect(items[1]).toHaveAttribute('tabIndex', '0');
  });

  test('handles Chinese input method events', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Process' });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'Tab', isComposing: true });
    expect(document.activeElement).toBe(items[0]);
  });

  test('maintains focus during dynamic content updates', () => {
    const { rerender } = render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[1].focus();
    expect(document.activeElement).toBe(items[1]);
    
    const newButton = document.createElement('button');
    newButton.setAttribute('data-testid', 'item-4');
    items[0].parentNode.insertBefore(newButton, items[0]);
    
    fireEvent.keyDown(items[1], { key: 'Tab' });
    expect(document.activeElement).toBe(items[2]);
    
    newButton.remove();
  });

  test('handles Chinese IME composition events', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.compositionStart(items[0]);
    fireEvent.keyDown(items[0], { key: 'Tab', isComposing: true });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.compositionEnd(items[0]);
    fireEvent.keyDown(items[0], { key: 'Tab' });
    expect(document.activeElement).toBe(items[1]);
  });

  test('supports screen reader navigation', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items.forEach(item => {
      expect(item).toHaveAttribute('role', 'button');
      expect(item).toHaveAttribute('tabIndex', '0');
    });
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Enter' });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: ' ' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('maintains focus order with dynamic attribute changes', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[1].focus();
    items[1].setAttribute('disabled', 'true');
    
    fireEvent.keyDown(items[1], { key: 'Tab' });
    expect(document.activeElement).toBe(items[2]);
    
    items[1].removeAttribute('disabled');
  });

  test('handles Chinese keyboard shortcuts', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Process', code: 'ControlLeft', ctrlKey: true });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'Tab', isComposing: true, ctrlKey: true });
    expect(document.activeElement).toBe(items[0]);
  });

  test('supports ARIA keyboard shortcuts', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByRole('button');
    
    items.forEach(item => {
      expect(item).toHaveAttribute('aria-keyshortcuts', 'Tab');
    });
    
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'Enter' });
    expect(document.activeElement).toBe(items[0]);
    
    fireEvent.keyDown(items[0], { key: 'Space' });
    expect(document.activeElement).toBe(items[0]);
  });

  test('handles focus with hidden elements', () => {
    render(<TestComponent selector="[data-testid^='item']" />);
    const items = screen.getAllByTestId(/^item/);
    
    items[1].style.display = 'none';
    items[0].focus();
    
    const handleKeyDown = useKeyboardNavigation('[data-testid^="item"]');
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    handleKeyDown(event);
    
    expect(document.activeElement).toBe(items[2]);
    
    items[1].style.display = '';
  });
});
