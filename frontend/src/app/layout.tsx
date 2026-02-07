import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import { NextIntlClientProvider } from 'next-intl';
import { defaultLocale } from '@/i18n';
import { ThemeProvider } from '@/contexts/ThemeContext';
// Load default messages so pages not under a locale (e.g., /register) still have intl context
import enMessages from '@/locales/en.json';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ComSpace - E-Commerce Platform',
  description: 'White-label e-commerce platform with multicurrency support',
  keywords: ['ecommerce', 'shopping', 'online store'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Touch file to trigger Next dev reload when we patch node_modules
  // (no runtime effect)
  /* dev-reload: updated */
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Provide a default NextIntl client provider for non-locale routes (e.g., /register) */}
        <NextIntlClientProvider locale={defaultLocale} messages={enMessages as any}>
          <ThemeProvider>
            <Providers>
              {children}
              <Toaster position="top-right" />
            </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
