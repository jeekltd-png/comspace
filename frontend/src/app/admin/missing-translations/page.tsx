'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';

export default function MissingTranslationsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await apiClient.get('/__debug/missing-translations');
        setRows(resp.data.data || resp.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load');
      } finally { setLoading(false); }
    })();
  }, []);

  const exportCsv = () => {
    const csv = ['tenant,locale,keys,url,userAgent,createdAt'];
    for (const r of rows) {
      csv.push([r.tenant || '', r.locale || '', (r.keys||[]).join('|'), r.url || '', (r.userAgent||'').replace(/,/g,' '), r.createdAt || ''].map(v => `"${v}"`).join(','));
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'missing-translations.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Missing translation reports (dev)</h1>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div>
          <div className="mb-4">
            <button onClick={exportCsv} className="px-3 py-1 bg-brand-600 text-white rounded">Export CSV</button>
          </div>
          <div className="overflow-auto max-h-96 border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Tenant</th>
                  <th className="p-2 text-left">Locale</th>
                  <th className="p-2 text-left">Keys</th>
                  <th className="p-2 text-left">URL</th>
                  <th className="p-2 text-left">User Agent</th>
                  <th className="p-2 text-left">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2 align-top">{r.tenant}</td>
                    <td className="p-2 align-top">{r.locale}</td>
                    <td className="p-2 align-top"><pre className="whitespace-pre-wrap">{(r.keys||[]).join(', ')}</pre></td>
                    <td className="p-2 align-top">{r.url}</td>
                    <td className="p-2 align-top">{r.userAgent}</td>
                    <td className="p-2 align-top">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}