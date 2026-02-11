'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import apiClient from '@/lib/api';
import { generatePalette } from '@/lib/brand-utils';
import toast from 'react-hot-toast';
import { FiUpload, FiCheck, FiX, FiEye, FiSave, FiRefreshCw, FiType, FiDroplet, FiImage, FiToggleLeft, FiZap } from 'react-icons/fi';
import { SPACE_PRESETS, type SpacePreset } from '@/hooks/useFeatureFlag';

const FONT_OPTIONS = [
  { label: 'Inter (Default)', value: 'Inter, system-ui, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Playfair Display', value: 'Playfair Display, serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
  { label: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Open Sans', value: 'Open Sans, sans-serif' },
];

interface BrandingState {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logo: string;
  favicon: string;
}

export default function ThemeEditorPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [branding, setBranding] = useState<BrandingState>({
    primaryColor: '#9333ea',
    secondaryColor: '#10B981',
    accentColor: '#ec4899',
    fontFamily: 'Inter, system-ui, sans-serif',
    logo: '',
    favicon: '',
  });
  const [customCSS, setCustomCSS] = useState('');
  const [features, setFeatures] = useState<Record<string, boolean>>({
    products: true,
    pricing: true,
    cart: true,
    checkout: true,
    delivery: true,
    pickup: true,
    reviews: true,
    wishlist: true,
    chat: false,
    socialLogin: true,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'features' | 'assets' | 'custom'>('colors');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiClient.get('/api/white-label/config');
        const cfg = resp.data?.data?.config || resp.data?.config;
        if (cfg) {
          setTenantId(cfg.tenantId || '');
          setStoreName(cfg.name || '');
          setBranding({
            primaryColor: cfg.branding?.primaryColor || '#9333ea',
            secondaryColor: cfg.branding?.secondaryColor || '#10B981',
            accentColor: cfg.branding?.accentColor || '#ec4899',
            fontFamily: cfg.branding?.fontFamily || 'Inter, system-ui, sans-serif',
            logo: cfg.branding?.logo || cfg.branding?.assets?.logo?.url || '',
            favicon: cfg.branding?.favicon || '',
          });
          setCustomCSS(cfg.customCSS || '');
          if (cfg.features) {
            setFeatures(prev => ({ ...prev, ...cfg.features }));
          }
          if (cfg.branding?.logo || cfg.branding?.assets?.logo?.url) {
            setLogoPreview(cfg.branding?.assets?.logo?.url || cfg.branding?.logo);
          }
        }
      } catch {
        // no config yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogoUpload = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      toast.error('Unsupported image format. Use PNG, JPEG, WEBP, or SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = e => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    const form = new FormData();
    form.append('file', file, file.name);
    try {
      const resp = await apiClient.post('/api/white-label/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = resp.data?.data?.url;
      if (url) {
        setBranding(b => ({ ...b, logo: url }));
        toast.success('Logo uploaded');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    }
  };

  const handleFaviconUpload = async (file: File) => {
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Favicon too large (max 1MB)');
      return;
    }
    const form = new FormData();
    form.append('file', file, file.name);
    try {
      const resp = await apiClient.post('/api/white-label/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = resp.data?.data?.url;
      if (url) {
        setBranding(b => ({ ...b, favicon: url }));
        toast.success('Favicon uploaded');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        branding: {
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          accentColor: branding.accentColor,
          fontFamily: branding.fontFamily,
          logo: branding.logo,
          favicon: branding.favicon,
        },
        features,
        customCSS,
      };

      if (tenantId) {
        await apiClient.put(`/api/white-label/config/${tenantId}`, payload);
      } else {
        await apiClient.post('/api/white-label/config', payload);
      }
      toast.success('Theme saved successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setBranding({
      primaryColor: '#9333ea',
      secondaryColor: '#10B981',
      accentColor: '#ec4899',
      fontFamily: 'Inter, system-ui, sans-serif',
      logo: '',
      favicon: '',
    });
    setCustomCSS('');
    setFeatures({
      products: true, pricing: true, cart: true, checkout: true,
      delivery: true, pickup: true, reviews: true, wishlist: true,
      chat: false, socialLogin: true,
    });
    toast.success('Reset to defaults');
  };

  // Generate preview palette
  const primaryPalette = generatePalette(branding.primaryColor);
  const secondaryPalette = generatePalette(branding.secondaryColor);
  const accentPalette = generatePalette(branding.accentColor);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded w-48" />
          <div className="h-64 bg-gray-200 dark:bg-surface-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'colors' as const, label: 'Colors', icon: FiDroplet },
    { id: 'typography' as const, label: 'Typography', icon: FiType },
    { id: 'features' as const, label: 'Features', icon: FiToggleLeft },
    { id: 'assets' as const, label: 'Logo & Assets', icon: FiImage },
    { id: 'custom' as const, label: 'Custom CSS', icon: FiEye },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Theme Editor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Customize your store&apos;s look and feel. Changes apply to all visitors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={resetToDefaults} className="btn-ghost text-sm flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><FiSave className="w-4 h-4" /> Save Theme</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-surface-800 rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-surface-900 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="glass-card p-6 space-y-8">
              <ColorPicker
                label="Primary Color"
                description="Main brand color used for buttons, links, and accents throughout your store"
                value={branding.primaryColor}
                onChange={c => setBranding(b => ({ ...b, primaryColor: c }))}
                palette={primaryPalette}
              />
              <ColorPicker
                label="Secondary Color"
                description="Complementary color for success states, badges, and supporting elements"
                value={branding.secondaryColor}
                onChange={c => setBranding(b => ({ ...b, secondaryColor: c }))}
                palette={secondaryPalette}
              />
              <ColorPicker
                label="Accent Color"
                description="Highlight color for special promotions, alerts, and call-to-action elements"
                value={branding.accentColor}
                onChange={c => setBranding(b => ({ ...b, accentColor: c }))}
                palette={accentPalette}
              />
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Family
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Choose a font for your entire store. Google Fonts are loaded automatically.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FONT_OPTIONS.map(font => (
                    <button
                      key={font.value}
                      onClick={() => setBranding(b => ({ ...b, fontFamily: font.value }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        branding.fontFamily === font.value
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span
                        className="text-lg font-medium text-gray-900 dark:text-white"
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </span>
                      <p
                        className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                        style={{ fontFamily: font.value }}
                      >
                        The quick brown fox jumps over the lazy dog.
                      </p>
                      {branding.fontFamily === font.value && (
                        <FiCheck className="w-4 h-4 text-brand-500 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              {/* Space Presets */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiZap className="w-5 h-5 text-brand-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Presets</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Choose a preset to quickly configure your space type. You can fine-tune individual toggles below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.entries(SPACE_PRESETS) as [SpacePreset, typeof SPACE_PRESETS[SpacePreset]][]).map(([key, preset]) => {
                    // Check if current features match this preset
                    const isActive = Object.entries(preset.features).every(
                      ([f, v]) => features[f] === v
                    );
                    return (
                      <button
                        key={key}
                        onClick={() => setFeatures(prev => ({ ...prev, ...preset.features }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isActive
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{preset.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{preset.label}</span>
                          {isActive && <FiCheck className="w-4 h-4 text-brand-500 ml-auto" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-11">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Toggles */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Individual Features</h3>
                <div className="space-y-1">
                  <FeatureToggleGroup label="Shopping">
                    <FeatureToggle
                      label="Product Catalog"
                      description="Show product listings and search"
                      enabled={features.products}
                      onChange={v => setFeatures(f => ({ ...f, products: v }))}
                    />
                    <FeatureToggle
                      label="Pricing"
                      description="Display product prices"
                      enabled={features.pricing}
                      onChange={v => setFeatures(f => ({ ...f, pricing: v }))}
                    />
                    <FeatureToggle
                      label="Shopping Cart"
                      description="Allow adding items to cart"
                      enabled={features.cart}
                      onChange={v => setFeatures(f => ({ ...f, cart: v }))}
                    />
                    <FeatureToggle
                      label="Checkout"
                      description="Enable online purchasing"
                      enabled={features.checkout}
                      onChange={v => setFeatures(f => ({ ...f, checkout: v }))}
                    />
                  </FeatureToggleGroup>

                  <FeatureToggleGroup label="Fulfilment">
                    <FeatureToggle
                      label="Delivery"
                      description="Offer delivery options"
                      enabled={features.delivery}
                      onChange={v => setFeatures(f => ({ ...f, delivery: v }))}
                    />
                    <FeatureToggle
                      label="Pickup"
                      description="Allow in-store pickup"
                      enabled={features.pickup}
                      onChange={v => setFeatures(f => ({ ...f, pickup: v }))}
                    />
                  </FeatureToggleGroup>

                  <FeatureToggleGroup label="Community">
                    <FeatureToggle
                      label="Reviews"
                      description="Allow product reviews and ratings"
                      enabled={features.reviews}
                      onChange={v => setFeatures(f => ({ ...f, reviews: v }))}
                    />
                    <FeatureToggle
                      label="Wishlist"
                      description="Let users save favourite items"
                      enabled={features.wishlist}
                      onChange={v => setFeatures(f => ({ ...f, wishlist: v }))}
                    />
                    <FeatureToggle
                      label="Chat"
                      description="Live chat support widget"
                      enabled={features.chat}
                      onChange={v => setFeatures(f => ({ ...f, chat: v }))}
                    />
                    <FeatureToggle
                      label="Social Login"
                      description="Sign in with Google, Facebook, etc."
                      enabled={features.socialLogin}
                      onChange={v => setFeatures(f => ({ ...f, socialLogin: v }))}
                    />
                  </FeatureToggleGroup>
                </div>
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="glass-card p-6 space-y-8">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Logo
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Recommended: PNG or SVG, at least 200×60px. Max 5MB.
                </p>
                <div className="flex items-start gap-6">
                  {/* Preview */}
                  <div className="w-48 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-surface-800">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-sm text-gray-400">No logo</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <FiUpload className="w-4 h-4" /> Upload Logo
                    </button>
                    {logoPreview && (
                      <button
                        onClick={() => {
                          setLogoPreview(null);
                          setBranding(b => ({ ...b, logo: '' }));
                        }}
                        className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <FiX className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Favicon
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Small icon shown in browser tabs. Use a 32×32 or 64×64 PNG. Max 1MB.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-surface-800">
                    {branding.favicon ? (
                      <img src={branding.favicon} alt="Favicon" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">ico</span>
                    )}
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/x-icon,image/svg+xml"
                    onChange={e => e.target.files?.[0] && handleFaviconUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <button
                    onClick={() => faviconInputRef.current?.click()}
                    className="btn-ghost text-sm flex items-center gap-2"
                  >
                    <FiUpload className="w-4 h-4" /> Upload Favicon
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom CSS Tab */}
          {activeTab === 'custom' && (
            <div className="glass-card p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom CSS
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Advanced: Add custom CSS rules. Dangerous properties (position:fixed, @import, javascript:) are automatically stripped for security.
                </p>
                <textarea
                  value={customCSS}
                  onChange={e => setCustomCSS(e.target.value)}
                  rows={12}
                  className="input-field font-mono text-sm resize-none"
                  placeholder={`.my-header {\n  background: linear-gradient(to right, var(--brand), var(--brand-dark));\n}\n\n.product-card:hover {\n  transform: scale(1.02);\n}`}
                  spellCheck={false}
                />
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Tip:</strong> Use <code className="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">var(--brand)</code>, <code className="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">var(--brand-light)</code>, and <code className="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">var(--brand-dark)</code> to reference your brand colors dynamically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FiEye className="w-4 h-4" /> Live Preview
            </h3>

            {/* Mini store preview */}
            <div
              className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg"
              style={{ fontFamily: branding.fontFamily }}
            >
              {/* Header preview */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <div className="flex items-center gap-2">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-6 w-auto" />
                  ) : (
                    <span className="text-white font-bold text-sm">{storeName || 'Your Store'}</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="w-4 h-4 rounded bg-white/30" />
                  <div className="w-4 h-4 rounded bg-white/30" />
                </div>
              </div>

              {/* Hero preview */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-surface-900 dark:to-surface-800 p-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Welcome to</p>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: branding.primaryColor }}
                >
                  {storeName || 'Your Store'}
                </h3>
                <button
                  className="text-white text-xs px-4 py-1.5 rounded-lg font-medium"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Shop Now
                </button>
              </div>

              {/* Product cards preview */}
              <div className="p-4 bg-white dark:bg-surface-900 grid grid-cols-2 gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="h-16 bg-gray-100 dark:bg-surface-800" />
                    <div className="p-2 space-y-1.5">
                      <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded w-3/4" />
                      <p className="text-xs font-bold" style={{ color: branding.primaryColor }}>$29.99</p>
                      <button
                        className="w-full text-white text-[10px] py-1 rounded-md font-medium"
                        style={{ backgroundColor: branding.accentColor }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Badge previews */}
              <div className="px-4 pb-4 bg-white dark:bg-surface-900 flex gap-2 flex-wrap">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: branding.secondaryColor }}
                >
                  In Stock
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: branding.accentColor }}
                >
                  Sale
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  New
                </span>
              </div>

              {/* Footer preview */}
              <div className="px-4 py-3 bg-gray-900 text-center">
                <p className="text-[10px] text-gray-400">© {storeName || 'Your Store'}</p>
              </div>
            </div>

            {/* Palette preview */}
            <div className="glass-card p-4 space-y-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Primary Palette</p>
              <div className="flex gap-0.5 rounded-lg overflow-hidden">
                {Object.entries(primaryPalette).map(([shade, hex]) => (
                  <div
                    key={shade}
                    className="flex-1 h-8 relative group cursor-pointer"
                    style={{ backgroundColor: hex }}
                    title={`${shade}: ${hex}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity text-white mix-blend-difference">
                      {shade}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Secondary</p>
              <div className="flex gap-0.5 rounded-lg overflow-hidden">
                {Object.entries(secondaryPalette).map(([shade, hex]) => (
                  <div key={shade} className="flex-1 h-6" style={{ backgroundColor: hex }} title={`${shade}: ${hex}`} />
                ))}
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accent</p>
              <div className="flex gap-0.5 rounded-lg overflow-hidden">
                {Object.entries(accentPalette).map(([shade, hex]) => (
                  <div key={shade} className="flex-1 h-6" style={{ backgroundColor: hex }} title={`${shade}: ${hex}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Color Picker Component ─────────────────────────────── */
function ColorPicker({
  label,
  description,
  value,
  onChange,
  palette,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (color: string) => void;
  palette: Record<string, string>;
}) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => setInputValue(value), [value]);

  const handleChange = (hex: string) => {
    setInputValue(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  // Preset swatches
  const presets = [
    '#9333ea', '#7c3aed', '#6366f1', '#3b82f6', '#0ea5e9',
    '#14b8a6', '#10b981', '#22c55e', '#eab308', '#f97316',
    '#ef4444', '#ec4899', '#d946ef', '#8b5cf6', '#0891b2',
    '#0d9488', '#059669', '#65a30d', '#ca8a04', '#ea580c',
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{description}</p>

      <div className="flex items-center gap-4 mb-4">
        {/* Native color picker */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
          />
        </div>
        {/* Hex input */}
        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={e => handleChange(e.target.value)}
            onBlur={() => {
              if (!/^#[0-9a-fA-F]{6}$/.test(inputValue)) setInputValue(value);
            }}
            className="input-field text-sm font-mono"
            placeholder="#9333ea"
            maxLength={7}
          />
        </div>
        {/* Current swatch */}
        <div
          className="w-12 h-12 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700"
          style={{ backgroundColor: value }}
        />
      </div>

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map(hex => (
          <button
            key={hex}
            onClick={() => onChange(hex)}
            className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${
              value === hex ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-surface-900' : ''
            }`}
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>

      {/* Generated palette preview */}
      <div className="flex gap-0.5 rounded-lg overflow-hidden">
        {Object.entries(palette).map(([shade, hex]) => (
          <div
            key={shade}
            className="flex-1 h-6 cursor-pointer hover:h-8 transition-all"
            style={{ backgroundColor: hex }}
            onClick={() => onChange(hex)}
            title={`${shade}: ${hex}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Feature Toggle Components ──────────────────────────── */
function FeatureToggleGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-4 first:mt-0">
        {label}
      </h4>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FeatureToggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
        enabled
          ? 'bg-brand-50/50 dark:bg-brand-900/10'
          : 'bg-gray-50 dark:bg-surface-800/50'
      }`}
    >
      <div className="flex-1 min-w-0 mr-4">
        <p className={`text-sm font-medium ${enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900 ${
          enabled ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
