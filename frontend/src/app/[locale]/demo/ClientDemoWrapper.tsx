'use client';

import React from 'react';

const LazyClientDemo = React.lazy(() => import('./ClientDemo'));

export default function ClientDemoWrapper() {
  return (
    <React.Suspense fallback={<div className="p-6">Loading demo...</div>}>
      <LazyClientDemo />
    </React.Suspense>
  );
}
