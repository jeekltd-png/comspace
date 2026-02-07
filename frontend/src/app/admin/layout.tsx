import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Client-side protection will be handled by middleware
  // This is just a layout wrapper
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const user = await response.json();
    
    // Check if user has admin role
    const adminRoles = ['admin', 'superadmin', 'admin1', 'admin2'];
    return adminRoles.includes(user.role);
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return false;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Store
            </a>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
