import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import { NextIntlClientProvider } from 'next-intl';
import { defaultLocale } from '@/i18n';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WhiteLabelProvider } from '@/contexts/WhiteLabelContext';
import { CookieConsent } from '@/components/CookieConsent';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CurrencyDetector } from '@/components/CurrencyDetector';
import enMessages from '@/locales/en.json';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'ComSpace — Modern E-Commerce Platform',
    template: '%s | ComSpace',
  },
  description: 'Discover amazing products with secure payments, worldwide delivery, and multi-currency support. Your modern shopping destination.',
  keywords: ['ecommerce', 'shopping', 'online store', 'fashion', 'electronics', 'multicurrency'],
  authors: [{ name: 'ComSpace' }],
  creator: 'ComSpace',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://comspace.store',
    siteName: 'ComSpace',
    title: 'ComSpace — Modern E-Commerce Platform',
    description: 'Discover amazing products with secure payments, worldwide delivery, and multi-currency support.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ComSpace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComSpace — Modern E-Commerce Platform',
    description: 'Discover amazing products with secure payments, worldwide delivery, and multi-currency support.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Prevent dark mode flash — runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* Structured data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'ComSpace',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://comspace.store',
              logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comspace.store'}/logo.png`,
              sameAs: [],
            }),
          }}
        />
        {/* Structured data — WebSite with search action */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'ComSpace',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://comspace.store',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comspace.store'}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-surface-50 dark:bg-surface-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        {/* Skip to content — accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg">
          Skip to content
        </a>
        <NextIntlClientProvider locale={defaultLocale} messages={enMessages as any}>
          <ThemeProvider>
            <WhiteLabelProvider>
              <ErrorBoundary>
              <Providers>
                <CurrencyDetector />
                {children}
                <CookieConsent />
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'var(--foreground)',
                      color: 'var(--background)',
                      borderRadius: '1rem',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                    },
                  }}
                />
              </Providers>
              </ErrorBoundary>
            </WhiteLabelProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
