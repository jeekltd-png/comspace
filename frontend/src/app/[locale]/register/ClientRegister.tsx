'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import apiClient from '@/lib/api';
import Link from 'next/link';
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiUsers,
  FiBriefcase,
  FiShoppingBag,
  FiHash,
  FiFileText,
  FiTarget,
} from 'react-icons/fi';

type AccountType = 'individual' | 'business' | 'association';

const accountTypeOptions: {
  value: AccountType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'Personal shopping account',
    icon: FiShoppingBag,
    color: 'from-brand-500 to-cyan-500',
  },
  {
    value: 'business',
    label: 'Business',
    description: 'Sell products & manage a store',
    icon: FiBriefcase,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'association',
    label: 'Association',
    description: 'Manage members & collect dues',
    icon: FiUsers,
    color: 'from-brand-500 to-accent-500',
  },
];

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Organization fields
  const [orgName, setOrgName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industry, setIndustry] = useState('');
  const [mission, setMission] = useState('');
  const [estimatedMembers, setEstimatedMembers] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const payload: Record<string, unknown> = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      phone,
      accountType,
    };

    if (accountType !== 'individual') {
      payload.organization = {
        name: orgName,
        registrationNumber: regNumber || undefined,
        taxId: taxId || undefined,
        industry: accountType === 'business' ? industry || undefined : undefined,
        mission: accountType === 'association' ? mission || undefined : undefined,
        estimatedMembers:
          accountType === 'association' && estimatedMembers
            ? parseInt(estimatedMembers, 10)
            : undefined,
      };
    }

    try {
      const resp = await apiClient.post('/auth/register', payload);
      if (resp.data?.success) {
        const { user, token, refreshToken } = resp.data.data;
        dispatch(setCredentials({ user, token, refreshToken }));

        // Step 5: Route based on account type
        if (user.accountType === 'association') {
          router.push('/create-association');
        } else if (user.accountType === 'business') {
          router.push('/admin');
        } else {
          router.push('/products');
        }
      } else {
        setError(resp.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Registration error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {step === 1
              ? 'Choose your account type'
              : `Setting up your ${accountTypeOptions.find((o) => o.value === accountType)?.label} account`}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`h-2 rounded-full transition-all ${
              step === 1 ? 'w-10 bg-brand-500' : 'w-6 bg-brand-200 dark:bg-brand-800'
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all ${
              step === 2 ? 'w-10 bg-brand-500' : 'w-6 bg-brand-200 dark:bg-brand-800'
            }`}
          />
        </div>

        {/* Step 1: Account Type */}
        {step === 1 && (
          <div className="space-y-4">
            {accountTypeOptions.map((opt) => {
              const Icon = opt.icon;
              const selected = accountType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAccountType(opt.value)}
                  className={`w-full glass-card p-5 flex items-center gap-4 text-left transition-all duration-200 ${
                    selected
                      ? 'ring-2 ring-brand-500 shadow-lg shadow-brand-500/10'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {opt.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {opt.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selected && <FiCheck className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              Continue <FiArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Details Form */}
        {step === 2 && (
          <div className="glass-card p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    {t('auth.firstName')}
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="firstName"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field pl-11"
                      placeholder="Jane"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    {t('auth.lastName')}
                  </label>
                  <input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11 pr-11"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  {t('auth.phone')}{' '}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field pl-11"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Organization Fields — shown for business & association */}
              {accountType !== 'individual' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    {accountType === 'association' ? (
                      <FiUsers className="w-4 h-4 text-brand-500" />
                    ) : (
                      <FiBriefcase className="w-4 h-4 text-emerald-500" />
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {accountType === 'association'
                        ? 'Association Details'
                        : 'Business Details'}
                    </h3>
                  </div>

                  {/* Org Name */}
                  <div>
                    <label
                      htmlFor="orgName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {accountType === 'association'
                        ? 'Association Name'
                        : 'Company Name'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="orgName"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="input-field"
                      placeholder={
                        accountType === 'association'
                          ? 'e.g. National Teachers Association'
                          : 'e.g. Acme Corp'
                      }
                    />
                  </div>

                  {/* Reg Number */}
                  <div>
                    <label
                      htmlFor="regNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      Registration Number{' '}
                      <span className="text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="regNumber"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        className="input-field pl-11"
                        placeholder="REG-123456"
                      />
                    </div>
                  </div>

                  {/* Business-specific: Tax ID & Industry */}
                  {accountType === 'business' && (
                    <>
                      <div>
                        <label
                          htmlFor="taxId"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Tax ID{' '}
                          <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="relative">
                          <FiFileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            id="taxId"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            className="input-field pl-11"
                            placeholder="EIN / VAT number"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="industry"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Industry{' '}
                          <span className="text-gray-400">(optional)</span>
                        </label>
                        <select
                          id="industry"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="input-field"
                        >
                          <option value="">Select industry</option>
                          <option value="retail">Retail</option>
                          <option value="food">Food & Beverage</option>
                          <option value="fashion">Fashion & Apparel</option>
                          <option value="electronics">Electronics</option>
                          <option value="health">Health & Beauty</option>
                          <option value="services">Professional Services</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Association-specific: Mission & Members */}
                  {accountType === 'association' && (
                    <>
                      <div>
                        <label
                          htmlFor="mission"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Mission / Purpose{' '}
                          <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="relative">
                          <FiTarget className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                          <textarea
                            id="mission"
                            value={mission}
                            onChange={(e) => setMission(e.target.value)}
                            className="input-field pl-11"
                            rows={2}
                            placeholder="Brief description of your association's purpose"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="estimatedMembers"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Estimated Members{' '}
                          <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="relative">
                          <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            id="estimatedMembers"
                            type="number"
                            min="1"
                            value={estimatedMembers}
                            onChange={(e) =>
                              setEstimatedMembers(e.target.value)
                            }
                            className="input-field pl-11"
                            placeholder="e.g. 100"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-2xl px-4 py-3"
                >
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost flex items-center gap-1"
                >
                  <FiArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}