export const dynamic = 'force-dynamic';

import Link from 'next/link';

const navLinks = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/dues', label: 'Dues' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
];

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
          <nav className="flex items-center gap-1 mt-3 -mb-3 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 border-b-2 border-transparent hover:border-brand-500 transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
