'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { FiUsers, FiCheck, FiX } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';
import { MdOutlineBathroom } from 'react-icons/md';
import apiClient from '@/lib/api';
import HotelBookingWidget from '@/components/hotel/HotelBookingWidget';
import type { Property } from '@/types/hotel';

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶',
  parking: '🅿️',
  pool: '🏊',
  gym: '🏋️',
  spa: '💆',
  breakfast: '🥐',
  'air-conditioning': '❄️',
  tv: '📺',
  kitchen: '🍳',
  'ocean-view': '🌊',
  garden: '🌿',
  fireplace: '🔥',
  balcony: '🏠',
  minibar: '🍸',
};

export default function PropertyDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!slug) return;
    apiClient
      .get(`/hotel/properties/${slug}`)
      .then(res => setProperty(res.data?.data?.property || null))
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-950 py-8 px-4">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-96 bg-gray-200 dark:bg-surface-700 rounded-2xl mb-6" />
          <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <IoBedOutline className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400">Property not found</h2>
        </div>
      </div>
    );
  }

  const images = property.images || [];
  const currentImage = images[selectedImage] || images[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Image gallery */}
        <div className="mb-8">
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-gray-200 dark:bg-surface-700">
            {currentImage ? (
              <Image
                src={currentImage.url}
                alt={currentImage.alt || property.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <IoBedOutline className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors
                    ${selectedImage === idx ? 'border-brand-600' : 'border-transparent'}`}
                >
                  <Image src={img.url} alt={img.alt || ''} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content + Booking widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <span className="text-sm text-brand-600 font-semibold uppercase">
                {property.type}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-1">
                {property.name}
              </h1>
              <p className="text-sm text-gray-400 mt-1">Code: {property.propertyCode}</p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FiUsers className="w-5 h-5 text-brand-500" />
                <span>{property.maxGuests} guests max</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <IoBedOutline className="w-5 h-5 text-brand-500" />
                <span>{property.beds} {property.beds === 1 ? 'bed' : 'beds'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <MdOutlineBathroom className="w-5 h-5 text-brand-500" />
                <span>{property.bathrooms} {property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}</span>
              </div>
              {property.sizeSqm && (
                <div className="text-gray-700 dark:text-gray-300">
                  {property.sizeSqm}m²
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">About this property</h2>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map(amenity => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-lg">{AMENITY_ICONS[amenity.toLowerCase()] || '✓'}</span>
                      <span className="text-sm capitalize">{amenity.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Policies</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-gray-500">Check-in</span>
                  <span className="font-medium">{property.policies.checkInTime}</span>
                </div>
                <div className="flex justify-between p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-gray-500">Check-out</span>
                  <span className="font-medium">{property.policies.checkOutTime}</span>
                </div>
                <div className="flex justify-between p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-gray-500">Min stay</span>
                  <span className="font-medium">{property.policies.minStay} night{property.policies.minStay > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-gray-500">Cancellation</span>
                  <span className="font-medium capitalize">{property.policies.cancellationPolicy}</span>
                </div>
                <div className="flex justify-between p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-gray-500">Smoking</span>
                  <span className="font-medium flex items-center gap-1">
                    {property.policies.smokingAllowed ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />}
                    {property.policies.smokingAllowed ? 'Allowed' : 'Not allowed'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-white dark:bg-surface-800 rounded-lg">
                  <span className="text-gray-500">Pets</span>
                  <span className="font-medium flex items-center gap-1">
                    {property.policies.petsAllowed ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />}
                    {property.policies.petsAllowed ? 'Allowed' : 'Not allowed'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking widget (sticky sidebar) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <HotelBookingWidget property={property} />
          </div>
        </div>
      </div>
    </div>
  );
}
