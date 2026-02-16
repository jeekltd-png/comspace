'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { SalonService } from '@/types/salon';
import { useFormatPrice } from '@/lib/currency';

interface SalonServiceCardProps {
  service: SalonService;
  locale?: string;
}

export default function SalonServiceCard({ service, locale }: SalonServiceCardProps) {
  const formatPrice = useFormatPrice();
  const hasDiscount = service.salePrice != null && service.salePrice < service.price;
  const displayPrice = hasDiscount ? service.salePrice! : service.price;

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {/* Image */}
      {service.image && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={service.image}
            alt={service.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {hasDiscount && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Sale
            </span>
          )}
          {service.isFeatured && (
            <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              ⭐ Featured
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Category badge */}
        <span className="text-xs font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wide">
          {service.category}
        </span>

        <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
          {service.name}
        </h3>

        {service.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Duration + Price row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            <span>{service.duration} min</span>
          </div>

          <div className="text-right">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through mr-1">
                {formatPrice(service.price)}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(displayPrice)}
            </span>
          </div>
        </div>

        {/* Staff avatars */}
        {service.staffIds && service.staffIds.length > 0 && (
          <div className="mt-3 flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">With:</span>
            {service.staffIds.slice(0, 3).map((staff) => (
              <div
                key={staff._id}
                title={staff.name}
                className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-[10px] font-semibold text-brand-700 dark:text-brand-300 border border-white dark:border-gray-800"
              >
                {staff.name?.[0]?.toUpperCase() || '?'}
              </div>
            ))}
            {service.staffIds.length > 3 && (
              <span className="text-xs text-gray-400">+{service.staffIds.length - 3}</span>
            )}
          </div>
        )}

        {/* Book button */}
        <Link
          href={`/${locale || 'en'}/salon/book?service=${service.slug}`}
          className="mt-4 block w-full text-center py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
