export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
      <div className="bg-white dark:bg-surface-900 border-b border-gray-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <a href="/" className="text-brand-600 dark:text-brand-400 hover:underline text-sm">
              ← Back to Store
            </a>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
