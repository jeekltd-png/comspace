import React from 'react';
import ClientPageEditor from './ClientPageEditor';

export default function AdminPagesPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Pages</h1>
      <ClientPageEditor />
    </div>
  );
}
