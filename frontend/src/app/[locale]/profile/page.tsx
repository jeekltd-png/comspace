'use client';

import React from 'react';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) return <div className="p-6">Not signed in. <Link href="/login" className="text-blue-600">Login</Link></div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="space-y-2">
        <div><strong>Name:</strong> {user.firstName} {user.lastName}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Phone:</strong> {user.phone || '—'}</div>
      </div>

      <div className="mt-6 space-x-3">
        <Link href="/profile/edit" className="px-4 py-2 bg-blue-600 text-white rounded">Edit profile</Link>
        <Link href="/profile/addresses" className="px-4 py-2 bg-gray-100 text-black rounded">Addresses</Link>
        <Link href="/profile/preferences" className="px-4 py-2 bg-gray-100 text-black rounded">Preferences</Link>
      </div>
    </div>
  );
}
