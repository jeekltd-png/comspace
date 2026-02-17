'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiUsers, FiMapPin, FiStar } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';
import { MdOutlineBathroom } from 'react-icons/md';
import type { Property, NightlyBreakdown } from '@/types/hotel';

interface PropertyCardProps {
  property: Property;
  /** Pre-computed pricing (from availability search) */
  nights?: number;
  subtotal?: number;
  nightlyBreakdown?: NightlyBreakdown[];
  /** Base path for links (e.g. "/en/hotel/properties") */
  basePath?: string;
}

const TYPE_LABELS: Record<string, string> = {
  room: 'Room',
  suite: 'Suite',
  apartment: 'Apartment',
  cottage: 'Cottage',
  cabin: 'Cabin',
  villa: 'Villa',
  dormitory: 'Dormitory',
};

export default function PropertyCard({
  property,
  nights,
  subtotal,
  nightlyBreakdown,
  basePath = '/hotel/properties',
}: PropertyCardProps) {
  const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];
  const avgNightlyPrice =
    nightlyBreakdown && nightlyBreakdown.length > 0
      ? nightlyBreakdown.reduce((sum, n) => sum + n.modifiedPrice, 0) / nightlyBreakdown.length
      : property.basePrice;

  return (
    <Link
      href={`${basePath}/${property.slug}`}
      className="group block bg-white dark:bg-surface-800 rounded-2xl overflow-hidden shadow-md
                 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      {/* Image */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gray-200 dark:bg-surface-700">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <IoBedOutline className="w-16 h-16" />
          </div>
        )}

        {/* Type badge */}
        <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
          {TYPE_LABELS[property.type] || property.type}
        </span>

        {/* Guest count badge */}
        <span className="absolute top-3 right-3 bg-white/90 dark:bg-surface-800/90 text-gray-700 dark:text-gray-200
                         text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
          <FiUsers className="w-3 h-3" />
          {property.maxGuests}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">
          {property.name}
        </h3>

        {property.shortDescription && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {property.shortDescription}
          </p>
        )}

        {/* Amenities */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1">
            <IoBedOutline className="w-4 h-4" />
            {property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}
          </span>
          <span className="flex items-center gap-1">
            <MdOutlineBathroom className="w-4 h-4" />
            {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
          </span>
          {property.sizeSqm && (
            <span className="text-gray-400">{property.sizeSqm}m²</span>
          )}
        </div>

        {/* Tags */}
        {property.tags && property.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {property.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <span className="text-2xl font-bold text-brand-600">
              {property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : property.currency}{' '}
              {Math.round(avgNightlyPrice)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400"> / night</span>
          </div>

          {nights && subtotal && (
            <div className="text-right">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : property.currency}{' '}
                {Math.round(subtotal)}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
