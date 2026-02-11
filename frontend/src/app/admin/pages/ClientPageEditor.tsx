'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

export default function ClientPageEditor({ page }: { page?: any }) {
  const [title, setTitle] = useState(page?.title || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [body, setBody] = useState(page?.body || '');
  const [published, setPublished] = useState(page?.published || false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (page?.id) {
        await apiClient.put(`/api/pages/${page.id}`, { title, slug, body, published });
      } else {
        await apiClient.post('/api/pages', { title, slug, body, published });
      }
      setMessage('Saved');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        <label className="block"><span>Title</span><input className="mt-1 block w-full" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block"><span>Slug</span><input className="mt-1 block w-full" value={slug} onChange={(e) => setSlug(e.target.value)} /></label>
        <label className="block"><span>Body (Markdown)</span><textarea rows={10} className="mt-1 block w-full" value={body} onChange={(e) => setBody(e.target.value)} /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published</label>

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
          {message && <div className="text-sm text-green-600">{message}</div>}
        </div>
      </div>
    </div>
  );
}