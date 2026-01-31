'use client';

import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { store } from '@/store/store';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Elements stripe={stripePromise}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Elements>
      </QueryClientProvider>
    </Provider>
  );
}
