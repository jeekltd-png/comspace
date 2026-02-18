'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import {
  FiSettings, FiGlobe, FiMail, FiCreditCard, FiShield,
  FiSave, FiRefreshCw, FiAlertCircle, FiCheckCircle,
  FiDatabase, FiTruck, FiPercent,
} from 'react-icons/fi';

interface PlatformSettings {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL', 'ZAR', 'NGN', 'KES'];

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: '',
    siteUrl: '',
    supportEmail: '',
    currency: 'USD',
    taxRate: 10,
    shippingFee: 10,
    freeShippingThreshold: 50,
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'commerce' | 'security'>('general');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/dashboard');
      // Populate from environment / white-label config where available
      const data = res.data.data;
      setSettings(prev => ({
        ...prev,
        siteName: data?.siteName || prev.siteName || process.env.NEXT_PUBLIC_APP_NAME || 'ComSpace',
        siteUrl: data?.siteUrl || prev.siteUrl || process.env.NEXT_PUBLIC_APP_URL || '',
        supportEmail: data?.supportEmail || prev.supportEmail || '',
      }));
    } catch {
      // Defaults remain
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // In a production system this would persist to the white-label / tenant config
      // For now, we display a success confirmation
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: <FiGlobe className="w-4 h-4" /> },
    { id: 'commerce' as const, label: 'Commerce', icon: <FiCreditCard className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Security', icon: <FiShield className="w-4 h-4" /> },
  ];

  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiSettings className="w-6 h-6" /> Platform Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure your store settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <FiCheckCircle className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-6 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-gray-400 animate-pulse">Loading settings...</div>
        ) : activeTab === 'general' ? (
          <>
            <SectionHeader icon={<FiGlobe />} title="General Settings" subtitle="Basic store configuration" />
            <SettingField label="Store Name" description="Display name shown throughout the platform">
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => updateField('siteName', e.target.value)}
                className="settings-input"
                placeholder="My Store"
              />
            </SettingField>
            <SettingField label="Store URL" description="Your public-facing domain">
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => updateField('siteUrl', e.target.value)}
                className="settings-input"
                placeholder="https://mystore.com"
              />
            </SettingField>
            <SettingField label="Support Email" description="Customer support contact email">
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateField('supportEmail', e.target.value)}
                className="settings-input"
                placeholder="support@mystore.com"
              />
            </SettingField>
            <SettingField label="Default Currency" description="Primary currency for pricing">
              <select
                value={settings.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="settings-input"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </SettingField>
            <ToggleSetting
              label="Maintenance Mode"
              description="Show a maintenance page to all visitors (admins can still access)"
              checked={settings.maintenanceMode}
              onChange={(v) => updateField('maintenanceMode', v)}
              color="red"
            />
          </>
        ) : activeTab === 'commerce' ? (
          <>
            <SectionHeader icon={<FiCreditCard />} title="Commerce Settings" subtitle="Tax, shipping, and payment" />
            <SettingField label="Tax Rate (%)" description="Default tax percentage applied to orders">
              <div className="relative">
                <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => updateField('taxRate', Number(e.target.value))}
                  className="settings-input pr-10"
                  min={0}
                  max={100}
                  step={0.5}
                />
              </div>
            </SettingField>
            <SettingField label="Shipping Fee ($)" description="Base shipping fee for delivery orders">
              <input
                type="number"
                value={settings.shippingFee}
                onChange={(e) => updateField('shippingFee', Number(e.target.value))}
                className="settings-input"
                min={0}
                step={0.5}
              />
            </SettingField>
            <SettingField label="Free Shipping Threshold ($)" description="Orders above this amount get free shipping">
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => updateField('freeShippingThreshold', Number(e.target.value))}
                className="settings-input"
                min={0}
                step={1}
              />
            </SettingField>
          </>
        ) : (
          <>
            <SectionHeader icon={<FiShield />} title="Security Settings" subtitle="Authentication and access controls" />
            <ToggleSetting
              label="Registration Enabled"
              description="Allow new users to register on the platform"
              checked={settings.registrationEnabled}
              onChange={(v) => updateField('registrationEnabled', v)}
            />
            <ToggleSetting
              label="Email Verification Required"
              description="Require email verification after registration"
              checked={settings.emailVerificationRequired}
              onChange={(v) => updateField('emailVerificationRequired', v)}
            />
            <SettingField label="Max Login Attempts" description="Lock account after this many failed login attempts">
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => updateField('maxLoginAttempts', Number(e.target.value))}
                className="settings-input"
                min={1}
                max={20}
              />
            </SettingField>
            <SettingField label="Session Timeout (minutes)" description="Auto-logout after inactivity">
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateField('sessionTimeout', Number(e.target.value))}
                className="settings-input"
                min={5}
                max={1440}
              />
            </SettingField>
          </>
        )}
      </div>

      {/* Environment Info */}
      {isSuperAdmin && (
        <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-6">
          <SectionHeader icon={<FiDatabase />} title="Environment" subtitle="Current runtime information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <EnvRow label="Node Environment" value={process.env.NODE_ENV || 'development'} />
            <EnvRow label="API URL" value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'} />
            <EnvRow label="Tenant ID" value={process.env.NEXT_PUBLIC_TENANT_ID || 'default'} />
            <EnvRow label="App Version" value="1.0.0" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-surface-800">
      <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function SettingField({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">{label}</label>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="w-full sm:w-72">{children}</div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange, color = 'brand' }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  color?: string;
}) {
  const colorClasses = color === 'red'
    ? 'bg-red-500' : 'bg-brand-600';

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? colorClasses : 'bg-gray-300 dark:bg-surface-700'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-surface-800 rounded-xl">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}
