'use client';

import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { store } from '@/store/store';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';
import { AuthProvider } from '@/lib/useAuth';

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <AuthProvider>
              <Header />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </AuthProvider>
          </Elements>
        ) : (
          <AuthProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </AuthProvider>
        )}
      </QueryClientProvider>
    </Provider>
  );
}
