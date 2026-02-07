import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have
          been moved or no longer exists.
        </p>
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go Home
          </Link>
          <Link
            href="/products"
            className="inline-block px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
