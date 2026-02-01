import Link from 'next/link';

export default function AdminIndex() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/product/create" className="p-4 border rounded hover:bg-gray-50">
          <h2 className="font-semibold">Create Product</h2>
          <p className="text-sm text-gray-600">Add new products to the store</p>
        </Link>

        <Link href="/admin/pages" className="p-4 border rounded hover:bg-gray-50">
          <h2 className="font-semibold">Pages</h2>
          <p className="text-sm text-gray-600">Manage CMS pages</p>
        </Link>

        <Link href="/admin/white-label" className="p-4 border rounded hover:bg-gray-50">
          <h2 className="font-semibold">White Label</h2>
          <p className="text-sm text-gray-600">Manage branding & assets</p>
        </Link>
      </div>
    </main>
  );
}