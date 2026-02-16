// ============================================================
// Salon / Booking Type Definitions
// ============================================================

export interface SalonService {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  /** Duration in minutes */
  duration: number;
  price: number;
  currency: string;
  salePrice?: number;
  image?: string;
  images?: Array<{ url: string; alt?: string }>;
  staffIds?: StaffMember[];
  tags?: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface WorkingHours {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breaks?: Array<{ start: string; end: string }>;
}

export interface StaffMember {
  _id: string;
  name: string;
  slug: string;
  title?: string;
  bio?: string;
  avatar?: string;
  serviceIds?: Array<{ _id: string; name: string; slug: string; category: string }>;
  workingHours?: WorkingHours[];
  isActive: boolean;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface Booking {
  _id: string;
  bookingRef: string;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  service: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
    category: string;
    duration: number;
    price?: number;
    currency?: string;
  };
  staff: {
    _id: string;
    name: string;
    avatar?: string;
    title?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  currency: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  status: BookingStatus;
  notes?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SlotAvailability {
  staffId: string;
  staffName: string;
  slots: string[];
}

export interface AvailabilityResponse {
  date: string;
  serviceId: string;
  duration: number;
  availability: SlotAvailability[];
}
