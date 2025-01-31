import { useCallback } from 'react';

export const useKeyboardNavigation = (selector, options = {}) => {
  const { maintainFocus = false, enableArrowKeys = true } = options;

  return useCallback((e) => {
    const elements = Array.from(document.querySelectorAll(selector));
    if (!elements.length) return;

    const currentIndex = elements.indexOf(e.target);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % elements.length;
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      nextIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
    } else if (enableArrowKeys) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % elements.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
      }
    }

    if (nextIndex !== currentIndex) {
      if (maintainFocus && nextIndex === 0 && currentIndex === elements.length - 1) {
        elements[0].focus();
      } else {
        elements[nextIndex].focus();
      }
    }
  }, [selector, maintainFocus, enableArrowKeys]);
};
