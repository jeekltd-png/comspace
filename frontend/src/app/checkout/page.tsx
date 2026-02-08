'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCart } from '@/store/slices/cartSlice';
import apiClient from '@/lib/api';
import { FiChevronLeft, FiShield, FiLock, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, total } = useAppSelector(state => state.cart);
  const { user, token } = useAppSelector(state => state.auth);
  const currency = useAppSelector(state => state.currency);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');

  const [form, setForm] = useState<ShippingForm>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  const formatPrice = (price: number) => {
    const converted = price * (currency.rates[currency.current] || 1);
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'shipping') {
      setStep('payment');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        items: items.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
        })),
        shippingAddress: {
          firstName: form.firstName,
          lastName: form.lastName,
          address: form.address,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        },
        contactEmail: form.email,
        contactPhone: form.phone,
        total,
      };

      const response = await apiClient.post('/orders', orderData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data?.data?.paymentUrl) {
        window.location.href = response.data.data.paymentUrl;
      } else {
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        router.push('/orders');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-10">
        <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-brand-600 dark:text-brand-400' : 'text-green-600 dark:text-green-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 'shipping' ? 'bg-brand-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {step === 'payment' ? <FiCheck className="w-4 h-4" /> : '1'}
          </div>
          <span className="font-medium text-sm">Shipping</span>
        </div>
        <div className="h-px flex-1 bg-gray-200 dark:bg-surface-700" />
        <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 'payment' ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-surface-700 text-gray-500'
          }`}>
            2
          </div>
          <span className="font-medium text-sm">Payment</span>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit}>
            {step === 'shipping' && (
              <div className="glass-card p-6 md:p-8 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={form.firstName}
                      onChange={e => updateField('firstName', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={form.lastName}
                      onChange={e => updateField('lastName', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => updateField('email', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={e => updateField('phone', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
                  <input
                    id="address"
                    type="text"
                    required
                    value={form.address}
                    onChange={e => updateField('address', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City</label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={form.city}
                      onChange={e => updateField('city', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">State</label>
                    <input
                      id="state"
                      type="text"
                      required
                      value={form.state}
                      onChange={e => updateField('state', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ZIP Code</label>
                    <input
                      id="zipCode"
                      type="text"
                      required
                      value={form.zipCode}
                      onChange={e => updateField('zipCode', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={e => updateField('country', e.target.value)}
                    className="input-field"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="IN">India</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary w-full mt-4">
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="glass-card p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment</h2>
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Edit Shipping
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-surface-800/50 rounded-2xl p-4 text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">{form.firstName} {form.lastName}</p>
                  <p>{form.address}</p>
                  <p>{form.city}, {form.state} {form.zipCode}, {form.country}</p>
                </div>

                <div className="border border-gray-200 dark:border-surface-700 rounded-2xl p-6 text-center">
                  <FiLock className="w-8 h-8 text-brand-600 dark:text-brand-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Secure Payment via Stripe</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You&apos;ll be redirected to Stripe&apos;s secure checkout to complete your payment.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiShield className="w-5 h-5" />
                      Place Order &mdash; {formatPrice(total)}
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 mt-8 lg:mt-0">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h2>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-800 flex-shrink-0">
                    <Image
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.variant}</p>
                    )}
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-surface-700 mt-6 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className="text-green-600 dark:text-green-400">Free</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-2 border-t border-gray-200 dark:border-surface-700">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
