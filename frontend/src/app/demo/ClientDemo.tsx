'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ClientDemo() {
  const searchParams = useSearchParams();
  const tenant = searchParams?.get('tenant') || 'demo-company-2026';

  const [config, setConfig] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const wlResp = await fetch(`${apiBase}/white-label/config`, { headers: { 'X-Tenant-ID': tenant } });
        const wlJson = await wlResp.json();
        if (mounted) setConfig(wlJson.config || wlJson);

        const prodResp = await fetch(`${apiBase}/products`, { headers: { 'X-Tenant-ID': tenant } });
        const prodJson = await prodResp.json();
        if (mounted) setProducts(prodJson.data || prodJson || []);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message || 'Failed to load demo data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, [tenant]);

  if (loading) return <div className="p-6">Loading demo...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  const branding = config?.branding || {};
  const logo = branding?.assets?.logo?.url || branding?.logo;
  const hero = branding?.assets?.heroImage?.url;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {logo ? <img src={logo} alt="logo" className="h-14" /> : <div className="h-14 w-40 bg-gray-200 flex items-center justify-center">No Logo</div>}
          <div>
            <h1 className="text-2xl font-bold">{config?.name || 'Demo Company'}</h1>
            <div className="text-sm text-gray-600">{config?.contact?.email || 'support@demo-company.local'}</div>
          </div>
        </div>
        <div>
          <a href={`/admin/white-label`} className="text-sm text-brand-600">Admin: White Label</a>
        </div>
      </header>

      {hero && (
        <div className="mb-6">
          <img src={hero} alt="hero" className="w-full rounded shadow" />
        </div>
      )}

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.length === 0 && <div className="text-gray-600">No products found for this tenant.</div>}
          {products.map((p: any) => (
            <div key={p._id} className="border rounded p-4 flex gap-4">
              <img src={p.images?.[0]?.url} alt={p.images?.[0]?.alt || p.name} className="w-28 h-20 object-cover rounded" />
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-gray-600">{p.shortDescription}</div>
                <div className="mt-2 font-bold">{p.currency || '$'}{p.basePrice}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Promo video</h2>
        <div className="aspect-video">
          <video controls src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" className="w-full rounded" />
        </div>
      </section>
    </div>
  );
}
