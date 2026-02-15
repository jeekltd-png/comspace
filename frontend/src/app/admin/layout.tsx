'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { usePathname } from 'next/navigation';

// Role-based navigation: each link specifies which roles can see it
const allNavLinks = [
  { href: '/admin', label: 'Overview', roles: ['superadmin', 'admin', 'admin1', 'admin2', 'merchant'] },
  { href: '/admin/analytics', label: '📊 Analytics', roles: ['superadmin', 'admin', 'admin1', 'admin2'] },
  { href: '/admin/users', label: '👤 Users', roles: ['superadmin', 'admin', 'admin1', 'admin2'] },
  { href: '/admin/tenants', label: '🏢 Tenants', roles: ['superadmin'] },
  { href: '/admin/vendors', label: '🏪 Vendors', roles: ['superadmin', 'admin', 'admin1', 'admin2'] },
  { href: '/admin/members', label: 'Members', roles: ['superadmin', 'admin', 'admin1', 'admin2'] },
  { href: '/admin/dues', label: 'Dues', roles: ['superadmin', 'admin', 'admin1', 'admin2'] },
  { href: '/admin/products', label: '🛍️ Products', roles: ['superadmin', 'admin', 'admin1', 'admin2', 'merchant'] },
  { href: '/admin/orders', label: '📦 Orders', roles: ['superadmin', 'admin', 'admin1', 'admin2', 'merchant'] },
  { href: '/admin/audit-log', label: '📋 Audit Log', roles: ['superadmin', 'admin', 'admin1'] },
  { href: '/admin/login-history', label: '🔐 Logins', roles: ['superadmin', 'admin', 'admin1'] },
  { href: '/admin/merchant', label: '🛒 My Store', roles: ['merchant'] },
];

const ADMIN_ROLES = ['superadmin', 'admin', 'admin1', 'admin2', 'merchant'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent mx-auto mb-3"></div>
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Block non-admin users
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="bg-white dark:bg-surface-900 p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You don&apos;t have permission to access the admin panel.</p>
          <a href="/" className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
            Go to Store
          </a>
        </div>
      </div>
    );
  }

  // Filter nav links based on user role
  const navLinks = allNavLinks.filter(link => link.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
      <div className="bg-white dark:bg-surface-900 border-b border-gray-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {user.firstName} {user.lastName} — <span className="capitalize">{user.role}</span>
              </p>
            </div>
            <a href="/" className="text-brand-600 dark:text-brand-400 hover:underline text-sm">
              ← Back to Store
            </a>
          </div>
          <nav className="flex items-center gap-1 mt-3 -mb-3 overflow-x-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/admin' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 border-brand-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 border-transparent hover:border-brand-500'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
