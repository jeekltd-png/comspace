'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { generatePalette, sanitizeCSS } from '@/lib/brand-utils';

/**
 * White-label branding configuration as received from the API.
 */
export interface WhiteLabelBranding {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  assets?: {
    logo?: { url?: string; alt?: string };
    heroImage?: { url?: string; alt?: string };
  };
}

export interface WhiteLabelConfig {
  tenantId?: string;
  name?: string;
  domain?: string;
  branding?: WhiteLabelBranding;
  customCSS?: string;
  features?: {
    // Shopping
    products?: boolean;
    pricing?: boolean;
    cart?: boolean;
    checkout?: boolean;
    // Fulfilment
    delivery?: boolean;
    pickup?: boolean;
    // Community
    reviews?: boolean;
    wishlist?: boolean;
    chat?: boolean;
    socialLogin?: boolean;
    // Salon / Booking
    booking?: boolean;
    salon?: boolean;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface WhiteLabelContextType {
  config: WhiteLabelConfig | null;
  loading: boolean;
  /** Refresh the config from API */
  refresh: () => Promise<void>;
  /** Resolve logo URL (asset > branding.logo > fallback) */
  logoUrl: string | null;
  /** Store display name */
  storeName: string;
}

const WhiteLabelContext = createContext<WhiteLabelContextType>({
  config: null,
  loading: true,
  refresh: async () => {},
  logoUrl: null,
  storeName: 'ComSpace',
});

const STYLE_ID = 'wl-dynamic-brand';
const CUSTOM_STYLE_ID = 'wl-custom-css';

/**
 * Inject CSS custom properties derived from tenant branding colors.
 * This generates a full shade palette (50-950) from the primary and secondary
 * colors, making all Tailwind `brand-*` and `accent-*` utilities dynamic.
 */
function injectBrandCSS(branding: WhiteLabelBranding) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  const vars: string[] = [];

  // Primary → brand palette
  if (branding.primaryColor) {
    const palette = generatePalette(branding.primaryColor);
    for (const [shade, hex] of Object.entries(palette)) {
      vars.push(`--wl-brand-${shade}: ${hex};`);
    }
    vars.push(`--brand: ${branding.primaryColor};`);
    vars.push(`--brand-light: ${palette['400']};`);
    vars.push(`--brand-dark: ${palette['700']};`);
  }

  // Secondary → secondary palette
  if (branding.secondaryColor) {
    const palette = generatePalette(branding.secondaryColor);
    for (const [shade, hex] of Object.entries(palette)) {
      vars.push(`--wl-secondary-${shade}: ${hex};`);
    }
  }

  // Accent
  if (branding.accentColor) {
    const palette = generatePalette(branding.accentColor);
    for (const [shade, hex] of Object.entries(palette)) {
      vars.push(`--wl-accent-${shade}: ${hex};`);
    }
  }

  // Font family
  if (branding.fontFamily) {
    vars.push(`--wl-font-family: ${branding.fontFamily};`);
  }

  style.textContent = `:root {\n  ${vars.join('\n  ')}\n}`;
}

/**
 * Inject sanitized custom CSS from tenant config.
 */
function injectCustomCSS(css: string | undefined) {
  let style = document.getElementById(CUSTOM_STYLE_ID) as HTMLStyleElement | null;
  if (!css) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = CUSTOM_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = sanitizeCSS(css);
}

const SYSTEM_FONTS = ['system-ui', 'sans-serif', 'serif', 'monospace', '-apple-system', 'BlinkMacSystemFont'];
const GOOGLE_FONT_LINK_ID = 'wl-google-font';

/**
 * Dynamically load a Google Font if the font family isn't a system font.
 */
function loadGoogleFont(fontFamily: string) {
  // Extract the first font name from the family list
  const firstName = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  if (!firstName || SYSTEM_FONTS.some(f => firstName.toLowerCase() === f.toLowerCase())) return;
  if (firstName === 'Inter') return; // Already loaded via Next.js

  let link = document.getElementById(GOOGLE_FONT_LINK_ID) as HTMLLinkElement | null;
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(firstName)}:wght@300;400;500;600;700&display=swap`;
  if (link) {
    if (link.href === href) return; // Already loaded
    link.href = href;
  } else {
    link = document.createElement('link');
    link.id = GOOGLE_FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

/**
 * Update the favicon link element.
 */
function updateFavicon(url: string) {

  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function WhiteLabelProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${base}/white-label/config`, {
        credentials: 'include',
        headers: { 'x-tenant-id': process.env.NEXT_PUBLIC_TENANT_ID || 'default' },
      });
      if (!res.ok) return;
      const json = await res.json();
      const cfg = json?.data?.config || json?.config;
      if (cfg) setConfig(cfg);
    } catch {
      // Silently fail — default branding will be used
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Apply branding CSS whenever config changes
  useEffect(() => {
    if (!config?.branding) return;
    injectBrandCSS(config.branding);
    injectCustomCSS(config.customCSS);

    if (config.branding.favicon) {
      updateFavicon(config.branding.favicon);
    } else if (config.branding.assets?.logo?.url) {
      updateFavicon(config.branding.assets.logo.url);
    }

    // Apply custom font
    if (config.branding.fontFamily) {
      document.body.style.fontFamily = config.branding.fontFamily;
      // Dynamically load Google Font if it's not a system font
      loadGoogleFont(config.branding.fontFamily);
    }

    // Update document title with store name
    if (config.name) {
      const current = document.title;
      if (current.includes('ComSpace')) {
        document.title = current.replace('ComSpace', config.name);
      }
    }
  }, [config]);

  const logoUrl =
    config?.branding?.assets?.logo?.url ||
    config?.branding?.logo ||
    null;

  const storeName = config?.name || 'ComSpace';

  return (
    <WhiteLabelContext.Provider value={{ config, loading, refresh: fetchConfig, logoUrl, storeName }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}
