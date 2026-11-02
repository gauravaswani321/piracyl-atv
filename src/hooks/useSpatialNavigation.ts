import { useEffect, useCallback } from 'react';

interface SpatialNavOptions {
  active?: boolean;
  onBack?: () => void;
  containerSelector?: string;
  defaultFocusSelector?: string;
}

export const useSpatialNavigation = ({
  active = true,
  onBack,
  containerSelector = '[data-nav-container="true"]',
  defaultFocusSelector = '[data-nav-default="true"]'
}: SpatialNavOptions) => {

  const focusDefault = useCallback(() => {
    const defaultEl = document.querySelector<HTMLElement>(defaultFocusSelector);
    if (defaultEl) {
      defaultEl.focus();
      return;
    }
    const firstEl = document.querySelector<HTMLElement>('[data-nav-item="true"]:not([disabled])');
    if (firstEl) {
      firstEl.focus();
    }
  }, [defaultFocusSelector]);

  useEffect(() => {
    if (!active) return;

    // Set initial focus if nothing is focused or if body is focused
    if (!document.activeElement || document.activeElement === document.body) {
      setTimeout(focusDefault, 100);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Handle Back Button (Android TV Remote Back button emits 'Escape', 'Backspace', or keycode 4 / 27)
      if (key === 'Escape' || key === 'Backspace' || e.keyCode === 27 || e.keyCode === 4) {
        if (onBack) {
          e.preventDefault();
          e.stopPropagation();
          onBack();
          return;
        }
      }

      // Handle Arrow Keys
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
      if (!isArrow) return;

      const current = document.activeElement as HTMLElement;

      // Allow native text caret movement inside inputs when pressing Left or Right
      if (current && current.tagName === 'INPUT' && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        return;
      }

      // Check if an active modal dialog is present, and scope navigation to it
      const activeModal = document.querySelector<HTMLElement>('[data-nav-modal="true"], [role="dialog"]');
      const root = activeModal || document;

      const navItems = Array.from(
        root.querySelectorAll<HTMLElement>('[data-nav-item="true"]:not([disabled])')
      ).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      });

      if (!navItems.length) return;

      // If nothing relevant focused, focus first or default inside active root
      if (!current || !navItems.includes(current)) {
        e.preventDefault();
        const defaultInside = root.querySelector<HTMLElement>(defaultFocusSelector);
        if (defaultInside && navItems.includes(defaultInside)) {
          defaultInside.focus();
        } else if (navItems[0]) {
          navItems[0].focus();
        }
        return;
      }

      const curRect = current.getBoundingClientRect();
      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const item of navItems) {
        if (item === current) continue;
        const rect = item.getBoundingClientRect();

        let primaryDist = 0;
        let perpDist = 0;
        let isValid = false;

        if (key === 'ArrowDown') {
          // Candidate must be below current (center or top is lower)
          if (rect.top >= curRect.top + 4 || rect.bottom >= curRect.bottom + 4) {
            isValid = true;
            primaryDist = Math.max(0, rect.top - curRect.bottom);
            perpDist = Math.max(0, curRect.left - rect.right, rect.left - curRect.right);
          }
        } else if (key === 'ArrowUp') {
          // Candidate must be above current
          if (rect.bottom <= curRect.bottom - 4 || rect.top <= curRect.top - 4) {
            isValid = true;
            primaryDist = Math.max(0, curRect.top - rect.bottom);
            perpDist = Math.max(0, curRect.left - rect.right, rect.left - curRect.right);
          }
        } else if (key === 'ArrowRight') {
          // Candidate must be to the right
          if (rect.left >= curRect.left + 4 || rect.right >= curRect.right + 4) {
            isValid = true;
            primaryDist = Math.max(0, rect.left - curRect.right);
            perpDist = Math.max(0, curRect.top - rect.bottom, rect.top - curRect.bottom);
          }
        } else if (key === 'ArrowLeft') {
          // Candidate must be to the left
          if (rect.right <= curRect.right - 4 || rect.left <= curRect.left - 4) {
            isValid = true;
            primaryDist = Math.max(0, curRect.left - rect.right);
            perpDist = Math.max(0, curRect.top - rect.bottom, rect.top - curRect.bottom);
          }
        }

        if (isValid) {
          // Total distance with perpendicular penalty
          const distance = primaryDist + perpDist * 2.0;

          if (distance < minDistance) {
            minDistance = distance;
            bestCandidate = item;
          }
        }
      }

      if (bestCandidate) {
        e.preventDefault();
        bestCandidate.focus();
        bestCandidate.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [active, onBack, focusDefault]);

  return { focusDefault };
};

