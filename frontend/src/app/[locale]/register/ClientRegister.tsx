'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  FiGlobe,
  FiHash,
  FiFileText,
  FiTarget,
  FiShoppingCart,
  FiBookOpen,
  FiScissors,
  FiDroplet,
  FiActivity,
  FiHeart,
  FiPackage,
  FiTool,
} from 'react-icons/fi';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { FormStepper } from '@/components/SmartFormGuide';
import { Tooltip } from '@/components/ui/Tooltip';

type AccountType = 'individual' | 'business' | 'association' | 'education';

// Registration mode — verticals like salon, food-store, etc. are shortcuts that
// register as accountType=business with a spacePreset hint for auto-feature-flagging.
type RegistrationMode =
  | 'individual'
  | 'business'
  | 'association'
  | 'marketplace-vendor'
  | 'showcase'
  | 'education'
  | 'salon'
  | 'food-store'
  | 'restaurant'
  | 'gym'
  | 'pharmacy'
  | 'laundry'
  | 'home-services';

// Which modes are vertical shortcuts (business + spacePreset)
const VERTICAL_SHORTCUTS: Record<string, string> = {
  salon: 'salon',
  'food-store': 'food-store',
  restaurant: 'restaurant',
  gym: 'gym',
  pharmacy: 'pharmacy',
  laundry: 'laundry',
  'home-services': 'home-services',
};

const accountTypeOptions: {
  value: RegistrationMode;
  label: string;
  description: string;
  tooltip: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    value: 'individual',
    label: 'Personal Account',
    description: 'Browse, explore & shop when you\u2019re ready',
    tooltip: 'Best for shoppers. Browse products, place orders, track deliveries & manage your purchases across all currencies.',
    icon: FiUser,
    color: 'from-brand-500 to-cyan-500',
  },
  {
    value: 'showcase',
    label: 'Showcase',
    description: 'Display your services & build online presence',
    tooltip: 'Create a public profile to showcase your services, portfolio & contact info — no selling or inventory required.',
    icon: FiGlobe,
    color: 'from-purple-500 to-violet-500',
  },
  {
    value: 'marketplace-vendor',
    label: 'Sell on ComSpace',
    description: 'List & sell products on the marketplace',
    tooltip: 'List your products on the ComSpace marketplace. We handle the storefront — you manage products, pricing & orders.',
    icon: FiShoppingCart,
    color: 'from-orange-500 to-amber-500',
  },
  {
    value: 'food-store',
    label: 'Food Store',
    description: 'Sell groceries, provisions & food items online',
    tooltip: 'Perfect for corner shops, grocery stores & food businesses. Manage inventory, take orders, offer delivery & click-and-collect.',
    icon: FiPackage,
    color: 'from-lime-500 to-green-600',
  },
  {
    value: 'salon',
    label: 'Salon',
    description: 'Manage bookings, staff & services',
    tooltip: 'Perfect for salons, barbershops & spas. Manage your services, staff schedules, appointments & client bookings all in one place.',
    icon: FiScissors,
    color: 'from-pink-500 to-rose-500',
  },
  {
    value: 'restaurant',
    label: 'Restaurant',
    description: 'Online orders, delivery & table bookings',
    tooltip: 'Accept online food orders, manage a menu, offer delivery or pickup, and optionally take table reservations.',
    icon: FiDroplet,
    color: 'from-red-500 to-orange-500',
  },
  {
    value: 'gym',
    label: 'Gym & Fitness',
    description: 'Memberships, classes & bookings',
    tooltip: 'Manage memberships, class timetables, trainer bookings & sell fitness products — all in one place.',
    icon: FiActivity,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    value: 'pharmacy',
    label: 'Pharmacy',
    description: 'Sell health products & manage prescriptions',
    tooltip: 'List health & wellness products online. Manage inventory, take orders, offer delivery & click-and-collect.',
    icon: FiHeart,
    color: 'from-teal-500 to-cyan-600',
  },
  {
    value: 'laundry',
    label: 'Laundry',
    description: 'Pickup, wash & delivery service',
    tooltip: 'Manage laundry & dry-cleaning orders. Schedule pickups, track orders & offer delivery back to customers.',
    icon: FiDroplet,
    color: 'from-blue-500 to-sky-500',
  },
  {
    value: 'home-services',
    label: 'Home Services',
    description: 'Plumbing, building, cleaning & more',
    tooltip: 'For tradespeople & service pros. Manage bookings, quotes, reviews & showcase your work — plumbers, builders, cleaners, decorators & more.',
    icon: FiTool,
    color: 'from-amber-500 to-yellow-600',
  },
  {
    value: 'business',
    label: 'Business',
    description: 'Create your own branded online store',
    tooltip: 'Get your own white-label store with custom branding, domain, theme & full e-commerce capabilities.',
    icon: FiBriefcase,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'association',
    label: 'Association',
    description: 'Manage members & collect dues',
    tooltip: 'Ideal for clubs, unions & non-profits. Manage members, collect dues, track payments & communicate with your community.',
    icon: FiUsers,
    color: 'from-brand-500 to-accent-500',
  },
  {
    value: 'education',
    label: 'Education',
    description: 'Create a space for your school or institution',
    tooltip: 'For primary, secondary, further or higher education. Manage students, staff, timetables, enrollment & parent/student portals.',
    icon: FiBookOpen,
    color: 'from-sky-500 to-blue-600',
  },
];

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>('individual');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      accountType: 'individual',
      sellOnMarketplace: false,
      spacePreset: '',
      orgName: '',
      regNumber: '',
      taxId: '',
      industry: '',
      mission: '',
      estimatedMembers: '',
      institutionType: undefined,
      estimatedStudents: '',
      urn: '',
    },
  });

  const accountType = watch('accountType');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    const isMarketplaceVendor = registrationMode === 'marketplace-vendor';
    const isShowcase = registrationMode === 'showcase';
    const verticalPreset = VERTICAL_SHORTCUTS[registrationMode]; // e.g. 'salon', 'food-store'

    const payload: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      phone: data.phone,
      accountType: data.accountType,
    };

    // Vertical shortcuts send a spacePreset hint
    if (verticalPreset) {
      payload.spacePreset = verticalPreset;
    }

    // For marketplace vendors, add the flag
    if (isMarketplaceVendor) {
      payload.sellOnMarketplace = true;
    }

    // For showcase businesses, add the showcaseOnly flag
    if (isShowcase) {
      payload.sellOnMarketplace = true;
      payload.showcaseOnly = true;
    }

    if (data.accountType !== 'individual') {
      payload.organization = {
        name: data.orgName,
        registrationNumber: data.regNumber || undefined,
        taxId: data.accountType === 'business' ? data.taxId || undefined : undefined,
        industry: data.accountType === 'business' ? data.industry || undefined : undefined,
        mission: data.accountType === 'association' ? data.mission || undefined : undefined,
        estimatedMembers:
          data.accountType === 'association' && data.estimatedMembers
            ? parseInt(data.estimatedMembers, 10)
            : undefined,
        // Education-specific fields
        institutionType: data.accountType === 'education' ? data.institutionType || undefined : undefined,
        estimatedStudents:
          data.accountType === 'education' && data.estimatedStudents
            ? parseInt(data.estimatedStudents, 10)
            : undefined,
        urn: data.accountType === 'education' ? data.urn || undefined : undefined,
      };
    }

    try {
      const resp = await apiClient.post('/auth/register', payload);
      if (resp.data?.success) {
        const { user, token, refreshToken } = resp.data.data;
        dispatch(setCredentials({ user, token, refreshToken }));

        if (isShowcase) {
          router.push('/admin/merchant/profile');
        } else if (isMarketplaceVendor) {
          router.push('/admin/merchant');
        } else if (verticalPreset === 'salon') {
          router.push('/salon');
        } else if (verticalPreset) {
          // Other verticals (food-store, restaurant, etc.) → admin dashboard
          router.push('/admin');
        } else if (user.accountType === 'association') {
          router.push('/create-association');
        } else if (user.accountType === 'education') {
          router.push('/admin');
        } else if (user.accountType === 'business') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setServerError(resp.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || err?.message || 'Registration error'
      );
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
              : `Setting up your ${accountTypeOptions.find((o) => o.value === registrationMode)?.label || accountTypeOptions.find((o) => o.value === accountType)?.label} account`}
          </p>
        </div>

        {/* Step indicators */}
        <div className="mb-8">
          <FormStepper
            steps={[
              { id: 'type', label: 'Account Type' },
              { id: 'details', label: 'Your Details' },
            ]}
            currentStep={step - 1}
            completedSteps={step === 2 ? [0] : []}
          />
        </div>

        {/* Step 1: Account Type */}
        {step === 1 && (
          <div className="space-y-4">
            {accountTypeOptions.map((opt) => {
              const Icon = opt.icon;
              const selected = registrationMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setRegistrationMode(opt.value);
                    const isVertical = opt.value in VERTICAL_SHORTCUTS;
                    if (opt.value === 'marketplace-vendor') {
                      setValue('accountType', 'business');
                      setValue('sellOnMarketplace', true);
                      setValue('spacePreset', '');
                    } else if (opt.value === 'showcase') {
                      setValue('accountType', 'business');
                      setValue('sellOnMarketplace', false);
                      setValue('spacePreset', '');
                    } else if (isVertical) {
                      // Salon, food-store, restaurant, gym, pharmacy, laundry
                      // → all business under the hood with a spacePreset
                      setValue('accountType', 'business');
                      setValue('sellOnMarketplace', false);
                      setValue('spacePreset', VERTICAL_SHORTCUTS[opt.value]);
                    } else if (opt.value === 'education') {
                      setValue('accountType', 'education');
                      setValue('sellOnMarketplace', false);
                      setValue('spacePreset', '');
                    } else {
                      setValue('accountType', opt.value as AccountType);
                      setValue('sellOnMarketplace', false);
                      setValue('spacePreset', '');
                    }
                  }}
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
                  <Tooltip content={opt.tooltip} position="right" maxWidth={300}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {opt.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {opt.description}
                    </p>
                  </div>
                  </Tooltip>
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
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
                      {...register('firstName')}
                      className={`input-field pl-11 ${errors.firstName ? 'border-red-400' : ''}`}
                      placeholder="Jane"
                    />
                  </div>
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
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
                    {...register('lastName')}
                    className={`input-field ${errors.lastName ? 'border-red-400' : ''}`}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
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
                    {...register('email')}
                    className={`input-field pl-11 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
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
                    {...register('password')}
                    className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-400' : ''}`}
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
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
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
                    {...register('confirmPassword')}
                    className={`input-field pl-11 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                    placeholder="Repeat password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
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
                    {...register('phone')}
                    className="input-field pl-11"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Organization Fields — shown for business, marketplace-vendor & association */}
              {(accountType !== 'individual') && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    {accountType === 'association' ? (
                      <FiUsers className="w-4 h-4 text-brand-500" />
                    ) : accountType === 'education' ? (
                      <FiBookOpen className="w-4 h-4 text-sky-500" />
                    ) : registrationMode === 'showcase' ? (
                      <FiGlobe className="w-4 h-4 text-purple-500" />
                    ) : registrationMode in VERTICAL_SHORTCUTS ? (
                      <FiBriefcase className="w-4 h-4 text-pink-500" />
                    ) : (
                      <FiBriefcase className="w-4 h-4 text-emerald-500" />
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {accountType === 'association'
                        ? 'Association Details'
                        : accountType === 'education'
                        ? 'Institution Details'
                        : registrationMode === 'showcase'
                        ? 'Showcase Details'
                        : `${accountTypeOptions.find(o => o.value === registrationMode)?.label || 'Business'} Details`}
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
                        : accountType === 'education'
                        ? 'Institution Name'
                        : `${accountTypeOptions.find(o => o.value === registrationMode)?.label || 'Company'} Name`}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="orgName"
                      {...register('orgName')}
                      className={`input-field ${errors.orgName ? 'border-red-400' : ''}`}
                      placeholder={
                        accountType === 'association'
                          ? 'e.g. National Teachers Association'
                          : accountType === 'education'
                          ? 'e.g. Riverside Academy'
                          : registrationMode === 'salon'
                          ? 'e.g. Glamour Hair & Beauty'
                          : registrationMode === 'food-store'
                          ? 'e.g. Lanre Foods'
                          : registrationMode === 'restaurant'
                          ? 'e.g. Mama Kitchen'
                          : registrationMode === 'gym'
                          ? 'e.g. FitZone Gym'
                          : registrationMode === 'pharmacy'
                          ? 'e.g. HealthPlus Pharmacy'
                          : registrationMode === 'laundry'
                          ? 'e.g. CleanWave Laundry'
                          : registrationMode === 'home-services'
                          ? 'e.g. Dave\u2019s Plumbing'
                          : 'e.g. Acme Corp'
                      }
                    />
                    {errors.orgName && <p className="text-xs text-red-500 mt-1">{errors.orgName.message}</p>}
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
                        {...register('regNumber')}
                        className="input-field pl-11"
                        placeholder="REG-123456"
                      />
                    </div>
                  </div>

                  {/* Business-specific: Tax ID & Industry */}
                  {accountType === 'business' && !( registrationMode in VERTICAL_SHORTCUTS) && (
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
                            {...register('taxId')}
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
                          {...register('industry')}
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

                  {/* Home Services: Trade Specialty */}
                  {registrationMode === 'home-services' && (
                    <div>
                      <label
                        htmlFor="industry"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                      >
                        Trade / Specialty{' '}
                        <span className="text-gray-400">(optional)</span>
                      </label>
                      <select
                        id="industry"
                        {...register('industry')}
                        className="input-field"
                      >
                        <option value="">Select your trade</option>
                        <option value="plumber">Plumber</option>
                        <option value="carpenter">Carpenter / Joiner</option>
                        <option value="builder">Builder / Contractor</option>
                        <option value="cleaner">Cleaner</option>
                        <option value="decorator">Interior Decorator / Painter</option>
                        <option value="electrician">Electrician</option>
                        <option value="locksmith">Locksmith</option>
                        <option value="gardener">Gardener / Landscaper</option>
                        <option value="handyman">General Handyman</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
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
                            {...register('mission')}
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
                            {...register('estimatedMembers')}
                            className="input-field pl-11"
                            placeholder="e.g. 100"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Education-specific: Institution Type, URN, Estimated Students */}
                  {accountType === 'education' && (
                    <>
                      <div>
                        <label
                          htmlFor="institutionType"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Institution Type{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="institutionType"
                          {...register('institutionType')}
                          className="input-field"
                        >
                          <option value="">Select institution type</option>
                          <option value="primary">Primary School</option>
                          <option value="secondary">Secondary School</option>
                          <option value="further">Further Education (College)</option>
                          <option value="higher">Higher Education (University)</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="urn"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          URN / School Reference Number{' '}
                          <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="relative">
                          <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            id="urn"
                            {...register('urn')}
                            className="input-field pl-11"
                            placeholder="e.g. 123456"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="estimatedStudents"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Estimated Students{' '}
                          <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="relative">
                          <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            id="estimatedStudents"
                            type="number"
                            min="1"
                            {...register('estimatedStudents')}
                            className="input-field pl-11"
                            placeholder="e.g. 500"
                          />
                        </div>
                      </div>
                    </>
                  )}

                </div>
              )}

              {/* Error */}
              {serverError && (
                <div
                  role="alert"
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-2xl px-4 py-3"
                >
                  {serverError}
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
                  disabled={isSubmitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
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