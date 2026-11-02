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
      const navItems = Array.from(
        document.querySelectorAll<HTMLElement>('[data-nav-item="true"]:not([disabled])')
      ).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      });

      if (!navItems.length) return;

      // If nothing relevant focused, focus first or default
      if (!current || !navItems.includes(current)) {
        e.preventDefault();
        focusDefault();
        return;
      }

      const curRect = current.getBoundingClientRect();
      const curCenterX = curRect.left + curRect.width / 2;
      const curCenterY = curRect.top + curRect.height / 2;

      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const item of navItems) {
        if (item === current) continue;
        const rect = item.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = centerX - curCenterX;
        const dy = centerY - curCenterY;

        let isValid = false;

        if (key === 'ArrowRight' && dx > 10) {
          isValid = true;
        } else if (key === 'ArrowLeft' && dx < -10) {
          isValid = true;
        } else if (key === 'ArrowDown' && dy > 10) {
          isValid = true;
        } else if (key === 'ArrowUp' && dy < -10) {
          isValid = true;
        }

        if (isValid) {
          // Weight perpendicular distance more heavily to keep in same row/col
          const isHorizontal = key === 'ArrowLeft' || key === 'ArrowRight';
          const primaryDist = Math.abs(isHorizontal ? dx : dy);
          const secondaryDist = Math.abs(isHorizontal ? dy : dx);
          
          // Cost function: penalize off-axis candidates
          const distance = primaryDist + secondaryDist * 2.5;

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
