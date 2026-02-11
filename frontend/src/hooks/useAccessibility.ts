'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';

/**
 * Traps keyboard focus within a container element.
 * Used for modals, drawers, and other overlays to meet WCAG 2.1 requirement 2.1.2.
 *
 * @param isActive Whether the trap is currently active
 * @param containerRef Ref to the container element
 *
 * @example
 *   const ref = useRef<HTMLDivElement>(null);
 *   useFocusTrap(isOpen, ref);
 *   return isOpen ? <div ref={ref}>…modal content…</div> : null;
 */
export function useFocusTrap(isActive: boolean, containerRef: RefObject<HTMLElement | null>) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(elements).filter(
      el => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }, [containerRef]);

  useEffect(() => {
    if (!isActive) return;

    // Save current focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element inside the container
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      // Small delay to let the DOM render
      requestAnimationFrame(() => focusable[0]?.focus());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstEl = elements[0];
      const lastEl = elements[elements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus when trap deactivates
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, getFocusableElements]);
}

/**
 * Announce a message to screen readers via an ARIA live region.
 * Call this when dynamic content changes (e.g., "3 items added to cart").
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  let region = document.getElementById('sr-announcer');
  if (!region) {
    region = document.createElement('div');
    region.id = 'sr-announcer';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
  }
  region.setAttribute('aria-live', priority);
  // Clear and re-set to force re-announce
  region.textContent = '';
  requestAnimationFrame(() => {
    region!.textContent = message;
  });
}
