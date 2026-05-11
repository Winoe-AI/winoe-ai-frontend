'use client';

import { useEffect } from 'react';

export function useSidebarShortcut(onToggle: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          const tagName = activeElement.tagName.toLowerCase();
          const isInput =
            tagName === 'input' ||
            tagName === 'textarea' ||
            tagName === 'select' ||
            activeElement.isContentEditable ||
            activeElement.closest('[data-command-palette-search]');
          if (isInput) return;
        }
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);
}
