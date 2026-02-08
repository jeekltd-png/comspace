'use client';

import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store/store';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';
import { AuthProvider } from '@/lib/useAuth';
import { useState } from 'react';

// Stripe is lazy-loaded only when needed (checkout page)
// instead of loading 30KB+ on every page

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to avoid SSR sharing across requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Header />
          <main id="main-content" className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}
