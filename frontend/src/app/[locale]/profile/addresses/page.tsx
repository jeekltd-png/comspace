'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

type Addr = any;

export default function AddressesPage() {
  const { user, refreshUser } = useAuth();
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setAddresses(user?.addresses || []);
  }, [user]);

  const addAddress = () => {
    setAddresses([...addresses, { label: 'New', street: '', city: '', state: '', country: '', postalCode: '', isDefault: false }]);
  };

  const updateAt = (idx: number, key: string, value: any) => {
    const copy = [...addresses];
    (copy[idx] as any)[key] = value;
    setAddresses(copy);
  };

  const removeAt = (idx: number) => {
    const copy = [...addresses];
    copy.splice(idx, 1);
    setAddresses(copy);
  };

  const save = async () => {
    setLoading(true);
    try {
      await apiClient.put('/auth/profile', { addresses });
      setMessage('Addresses saved');
      await refreshUser();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Addresses</h1>
      <div className="space-y-4">
        {addresses.map((a, i) => (
          <div key={i} className="border p-3 rounded space-y-2">
            <div className="flex gap-2">
              <input className="flex-1 p-2 border rounded" value={a.label} onChange={(e) => updateAt(i, 'label', e.target.value)} placeholder="Label" />
              <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => removeAt(i)}>Delete</button>
            </div>
            <input className="w-full p-2 border rounded" value={a.street} onChange={(e) => updateAt(i, 'street', e.target.value)} placeholder="Street" />
            <div className="flex gap-2">
              <input className="flex-1 p-2 border rounded" value={a.city} onChange={(e) => updateAt(i, 'city', e.target.value)} placeholder="City" />
              <input className="flex-1 p-2 border rounded" value={a.state} onChange={(e) => updateAt(i, 'state', e.target.value)} placeholder="State" />
            </div>
            <div className="flex gap-2">
              <input className="flex-1 p-2 border rounded" value={a.country} onChange={(e) => updateAt(i, 'country', e.target.value)} placeholder="Country" />
              <input className="flex-1 p-2 border rounded" value={a.postalCode} onChange={(e) => updateAt(i, 'postalCode', e.target.value)} placeholder="Postal" />
            </div>
          </div>
        ))}

        <div className="flex gap-3">
          <button onClick={addAddress} className="px-4 py-2 bg-gray-100 rounded">Add address</button>
          <button onClick={save} disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded">{loading ? 'Saving...' : 'Save'}</button>
        </div>

        {message && <div className="text-sm text-green-600">{message}</div>}
      </div>
    </div>
  );
}
