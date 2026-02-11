'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

interface Props {
  children: ReactNode;
  /** Optional fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary — catches render-time errors in the component tree
 * and shows a graceful fallback UI instead of a white screen.
 *
 * Wrap around sections of UI that should be independently recoverable:
 *   <ErrorBoundary>
 *     <ProductGrid />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log to console in dev, and to any error reporting service
    console.error('[ErrorBoundary]', error, errorInfo);

    // If Sentry or similar is available, report via global hub
    if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
      try {
        const hub = (window as any).__SENTRY__.hub;
        if (hub?.captureException) {
          hub.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
        }
      } catch (_) {}
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[40vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
              <FiAlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              An unexpected error occurred while rendering this section.
              Try refreshing, or go back to the home page.
            </p>

            {/* Error details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 font-medium">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs text-red-800 dark:text-red-300 overflow-auto max-h-48 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <a href="/" className="btn-primary text-sm flex items-center gap-2">
                <FiHome className="w-4 h-4" />
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
