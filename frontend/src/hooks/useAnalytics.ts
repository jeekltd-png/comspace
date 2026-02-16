'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import apiClient from '@/lib/api';

type EventCategory = 'auth' | 'navigation' | 'product' | 'cart' | 'order' | 'review' | 'search' | 'form' | 'admin' | 'system';

interface TrackEventPayload {
  action: string;
  category: EventCategory;
  metadata?: Record<string, any>;
  page?: string;
  duration?: number;
}

// Generate a session ID that persists across page navigations
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('_cs_sid');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem('_cs_sid', sessionId);
  }
  return sessionId;
}

const EVENT_BUFFER: TrackEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents() {
  if (EVENT_BUFFER.length === 0) return;
  const events = EVENT_BUFFER.splice(0, EVENT_BUFFER.length);
  try {
    await apiClient.post('/analytics/track/batch', {
      events: events.map(e => ({ ...e, sessionId: getSessionId() })),
    });
  } catch {
    // Silently fail — analytics should never break UX
  }
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushEvents, 3000);
}

/**
 * Hook for tracking user activity events.
 * Buffers events and sends them in batches to minimize network requests.
 *
 * Usage:
 *   const { trackEvent, trackPageView, trackFormProgress } = useAnalytics();
 *   trackEvent({ action: 'add_to_cart', category: 'cart', metadata: { productId } });
 *   trackPageView('/products');
 *   trackFormProgress('checkout', 2, 3);
 */
export function useAnalytics() {
  const { user } = useAppSelector(state => state.auth);
  const pageEntryTime = useRef(Date.now());

  // Track page view on mount
  useEffect(() => {
    pageEntryTime.current = Date.now();

    // Flush remaining events on page unload
    const handleUnload = () => flushEvents();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const trackEvent = useCallback((payload: TrackEventPayload) => {
    // Respect GDPR cookie consent — only track if user accepted cookies
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('comspace_cookie_consent');
      if (consent !== 'accepted') return;
    }

    EVENT_BUFFER.push(payload);
    // Flush immediately if buffer is large
    if (EVENT_BUFFER.length >= 10) {
      flushEvents();
    } else {
      scheduleFlush();
    }
  }, []);

  const trackPageView = useCallback((page: string, metadata?: Record<string, any>) => {
    trackEvent({
      action: 'page_view',
      category: 'navigation',
      page,
      metadata,
    });
  }, [trackEvent]);

  const trackProductView = useCallback((productId: string, productName: string) => {
    trackEvent({
      action: 'product_view',
      category: 'product',
      metadata: { productId, productName },
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultCount?: number) => {
    trackEvent({
      action: 'search',
      category: 'search',
      metadata: { query, resultCount },
    });
  }, [trackEvent]);

  const trackAddToCart = useCallback((productId: string, productName: string, quantity: number) => {
    trackEvent({
      action: 'add_to_cart',
      category: 'cart',
      metadata: { productId, productName, quantity },
    });
  }, [trackEvent]);

  const trackFormProgress = useCallback((formName: string, currentStep: number, totalSteps: number, stepName?: string) => {
    trackEvent({
      action: currentStep === 1 ? 'form_start' : currentStep >= totalSteps ? 'form_complete' : 'form_step',
      category: 'form',
      metadata: { formName, currentStep, totalSteps, stepName },
    });
  }, [trackEvent]);

  const trackFormAbandon = useCallback((formName: string, lastStep: number, totalSteps: number) => {
    const duration = Date.now() - pageEntryTime.current;
    trackEvent({
      action: 'form_abandon',
      category: 'form',
      metadata: { formName, lastStep, totalSteps },
      duration,
    });
  }, [trackEvent]);

  const trackCheckout = useCallback((action: 'checkout_start' | 'checkout_complete', metadata?: Record<string, any>) => {
    trackEvent({
      action,
      category: 'order',
      metadata,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackProductView,
    trackSearch,
    trackAddToCart,
    trackFormProgress,
    trackFormAbandon,
    trackCheckout,
  };
}
