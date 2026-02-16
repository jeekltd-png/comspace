'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';

export interface TooltipProps {
  /** The content to display inside the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Position relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing (ms) */
  delay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Additional className for the tooltip bubble */
  className?: string;
  /** Max width of the tooltip */
  maxWidth?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  disabled = false,
  className = '',
  maxWidth = 260,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [disabled, delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  // Adjust position if tooltip overflows viewport
  useEffect(() => {
    if (!visible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current.getBoundingClientRect();
    const trigger = triggerRef.current.getBoundingClientRect();
    let newPosition = position;

    if (position === 'top' && trigger.top - tooltip.height < 8) {
      newPosition = 'bottom';
    } else if (position === 'bottom' && trigger.bottom + tooltip.height > window.innerHeight - 8) {
      newPosition = 'top';
    } else if (position === 'left' && trigger.left - tooltip.width < 8) {
      newPosition = 'right';
    } else if (position === 'right' && trigger.right + tooltip.width > window.innerWidth - 8) {
      newPosition = 'left';
    }

    if (newPosition !== adjustedPosition) {
      setAdjustedPosition(newPosition);
    }
  }, [visible, position, adjustedPosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const positionStyles: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-surface-700 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-surface-700 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-surface-700 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-surface-700 border-y-transparent border-l-transparent',
  };

  const tooltipId = useId();

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      ref={triggerRef}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          style={{ maxWidth }}
          className={`absolute z-[200] ${positionStyles[adjustedPosition]} pointer-events-none animate-fade-in`}
        >
          <div
            className={`bg-gray-900 dark:bg-surface-700 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-xl leading-relaxed ${className}`}
          >
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-[5px] ${arrowStyles[adjustedPosition]}`}
          />
        </div>
      )}
    </div>
  );
}

export default Tooltip;
