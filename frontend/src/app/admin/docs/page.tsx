'use client'

import React, { useEffect, useState } from 'react';

export default function AdminDocsPage() {
  const [docs, setDocs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/docs', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => setDocs(j.data || []))
      .catch((e) => setError(String(e)));
  }, []);

  const loadDoc = async (name: string) => {
    setSelected(name);
    const res = await fetch(`/api/admin/docs/${encodeURIComponent(name)}`, { credentials: 'include' });
    if (!res.ok) {
      setError('Unable to load document');
      return;
    }
    const j = await res.json();
    setContent(j.data?.content || '');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Docs</h1>
      {error && <div className="text-red-600">{error}</div>}
      <div className="flex gap-6">
        <div className="w-1/4">
          <ul>
            {docs.map((d) => (
              <li key={d}>
                <button className="text-left w-full py-1" onClick={() => loadDoc(d)}>
                  {d}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-3/4">
          {selected ? (
            <div>
              <h2 className="text-xl font-medium mb-2">{selected}</h2>
              <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">{content}</pre>
            </div>
          ) : (
            <div>Select a document to view</div>
          )}
        </div>
      </div>
    </div>
  );
}
