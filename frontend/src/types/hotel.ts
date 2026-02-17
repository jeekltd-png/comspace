// ── Hotel / B&B Types ────────────────────────────────────────

export type PropertyType = 'room' | 'suite' | 'apartment' | 'cottage' | 'cabin' | 'villa' | 'dormitory';
export type PropertyStatus = 'available' | 'maintenance' | 'retired';
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'non-refundable';

export interface PropertyImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface PropertyPolicies {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
  minStay: number;
  maxStay: number;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  childrenAllowed: boolean;
}

export interface Property {
  _id: string;
  propertyCode: string;
  name: string;
  slug: string;
  type: PropertyType;
  description: string;
  shortDescription?: string;
  amenities: string[];
  images: PropertyImage[];
  maxGuests: number;
  beds: number;
  bathrooms: number;
  sizeSqm?: number;
  floor?: string;
  basePrice: number;
  currency: string;
  status: PropertyStatus;
  policies: PropertyPolicies;
  tags: string[];
  sortOrder: number;
  isActive: boolean;
  tenant: string;
  createdAt: string;
  updatedAt: string;
}

export interface NightlyBreakdown {
  date: string;
  basePrice: number;
  modifiedPrice: number;
  ratePlan?: string;
}

export interface AvailableProperty {
  property: Property;
  nights: number;
  nightlyBreakdown: NightlyBreakdown[];
  subtotal: number;
  currency: string;
}

export interface AvailabilityResponse {
  checkIn: string;
  checkOut: string;
  nights: number;
  available: AvailableProperty[];
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export interface ReservationAddOn {
  addOn: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReservationPricing {
  nightlyBreakdown: NightlyBreakdown[];
  subtotal: number;
  taxes: number;
  fees: number;
  addOns: ReservationAddOn[];
  discount: number;
  total: number;
  currency: string;
}

export interface ReservationPayment {
  stripePaymentIntentId?: string;
  depositAmount: number;
  depositPaid: boolean;
  balanceDue: number;
  paymentStatus: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'partial_refund';
}

export interface Reservation {
  _id: string;
  reservationRef: string;
  property: Property | string;
  guest: { _id: string; firstName: string; lastName: string; email: string; phone?: string } | string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  status: ReservationStatus;
  source: string;
  pricing: ReservationPricing;
  payment: ReservationPayment;
  cancellation?: {
    policy: string;
    refundAmount: number;
    cancelledAt: string;
    reason?: string;
  };
  specialRequests?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  tenant: string;
  createdAt: string;
  updatedAt: string;
}

export type AddOnPer = 'night' | 'stay' | 'guest';

export interface HotelAddOn {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  per: AddOnPer;
  category?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface RatePlan {
  _id: string;
  name: string;
  description?: string;
  property: string | Property;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  currency: string;
  dayModifiers: Array<{ day: number; modifier: number }>;
  minStay: number;
  priority: number;
  isActive: boolean;
}

export interface GuestMessage {
  _id: string;
  reservation?: string;
  sender: { _id: string; firstName: string; lastName: string; email: string } | string;
  recipient?: { _id: string; firstName: string; lastName: string; email: string } | string;
  type: 'inquiry' | 'pre_arrival' | 'during_stay' | 'post_checkout' | 'general';
  subject?: string;
  message: string;
  attachments: string[];
  readAt?: string;
  isFromGuest: boolean;
  createdAt: string;
}
