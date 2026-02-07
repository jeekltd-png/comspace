'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          We encountered an error while loading this page. Please try again.
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-block px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
