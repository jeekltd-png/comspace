'use client';

import React from 'react';
import { FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi';
import { Tooltip } from '@/components/ui/Tooltip';

const perks = [
  {
    icon: FiTruck,
    title: 'Free Shipping',
    desc: 'On orders over $50',
    tooltip: 'Standard free shipping on all orders over $50. Express & international options available at checkout.',
  },
  {
    icon: FiShield,
    title: 'Secure Payments',
    desc: '256-bit SSL encryption',
    tooltip: 'All transactions are encrypted with 256-bit SSL and processed through PCI-compliant payment providers.',
  },
  {
    icon: FiRefreshCw,
    title: 'Easy Returns',
    desc: '30-day return policy',
    tooltip: 'Not satisfied? Return any unused item within 30 days for a full refund — no questions asked.',
  },
  {
    icon: FiHeadphones,
    title: '24/7 Support',
    desc: "We're here to help",
    tooltip: 'Our support team is available around the clock via live chat, email & phone to assist you.',
  },
];

export function PerksStrip() {
  return (
    <section className="border-t border-gray-200 dark:border-surface-800 bg-gray-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {perks.map((perk) => (
            <Tooltip key={perk.title} content={perk.tooltip} position="top" maxWidth={280}>
              <div className="flex items-center gap-4 cursor-help">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <perk.icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{perk.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{perk.desc}</p>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </section>
  );
}
