import React from 'react';

async function fetchProducts() {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${base}/products?limit=50`, { cache: 'no-store' });
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.data?.products ?? [];
  } catch (e) {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Products</h1>

      {products.length === 0 ? (
        <div className="text-gray-600">
          <p className="mb-4">No products found.</p>
          <p className="text-sm">
            Tip: populate sample data with <code>npm --prefix backend run seed:sample</code> or create products via the admin API.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((p: any) => (
            <li key={p._id} className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">{p.title}</h2>
              <p className="text-gray-700 mb-4">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold">${p.price?.toFixed?.(2) ?? p.price}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
