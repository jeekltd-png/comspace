import Link from 'next/link';

const adminCards = [
  {
    href: '/admin/analytics',
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Real-time metrics, user activity, revenue, conversion funnels & ratings',
    color: 'from-brand-500/10 to-purple-500/10 border-brand-200 dark:border-brand-800',
  },
  {
    href: '/admin/orders',
    icon: '📦',
    title: 'Orders',
    description: 'View, track & manage all customer orders and fulfillment',
    color: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800',
  },
  {
    href: '/admin/products',
    icon: '🛍️',
    title: 'Products',
    description: 'Manage product catalog, inventory & pricing',
    color: 'from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800',
  },
  {
    href: '/admin/tenants',
    icon: '🏢',
    title: 'Tenant Management',
    description: 'View & manage all tenants (individual, business, association)',
    color: 'from-amber-500/10 to-yellow-500/10 border-amber-200 dark:border-amber-800',
  },
  {
    href: '/admin/members',
    icon: '👥',
    title: 'Members',
    description: 'Manage members, roles & user accounts',
    color: 'from-indigo-500/10 to-violet-500/10 border-indigo-200 dark:border-indigo-800',
  },
  {
    href: '/admin/dues',
    icon: '💰',
    title: 'Dues & Billing',
    description: 'Track member dues, payments & overdue balances',
    color: 'from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800',
  },
  {
    href: '/admin/pages',
    icon: '📄',
    title: 'Pages',
    description: 'Manage CMS pages & content',
    color: 'from-gray-500/10 to-slate-500/10 border-gray-200 dark:border-gray-700',
  },
  {
    href: '/admin/white-label',
    icon: '🏷️',
    title: 'White Label',
    description: 'Manage branding & assets per tenant',
    color: 'from-teal-500/10 to-cyan-500/10 border-teal-200 dark:border-teal-800',
  },
  {
    href: '/admin/vendors',
    icon: '🏪',
    title: 'Vendor Management',
    description: 'Review, approve & manage marketplace vendors',
    color: 'from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800',
  },
  {
    href: '/admin/theme',
    icon: '🎨',
    title: 'Theme Editor',
    description: 'Colors, fonts, logo & live preview',
    color: 'from-fuchsia-500/10 to-purple-500/10 border-fuchsia-200 dark:border-fuchsia-800',
  },
];

export default function AdminIndex() {
  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Admin Panel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your platform, monitor activity, and track performance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`p-5 border rounded-2xl bg-gradient-to-br ${card.color} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{card.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}