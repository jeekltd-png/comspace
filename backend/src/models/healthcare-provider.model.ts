import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export type HealthcareSubType =
  | 'hospital'
  | 'clinic'
  | 'dental'
  | 'lab'
  | 'physio'
  | 'specialist'
  | 'optometrist'
  | 'pharmacy'
  | 'mental-health';

export interface IHealthcareProvider extends Document {
  name: string;
  slug: string;
  /** Sub-type distinguishes hospitals from clinics, dental, etc. */
  subType: HealthcareSubType;
  /** Medical specialties offered (e.g. Cardiology, Dermatology, Pediatrics) */
  specialties: string[];
  /** Short public-facing description */
  shortDescription?: string;
  /** Full description / about page */
  description?: string;
  /** Representative image / logo */
  image?: string;
  /** Gallery images */
  images?: Array<{ url: string; alt?: string }>;
  /** GeoJSON Point for geospatial queries */
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  phone: string;
  email?: string;
  website?: string;
  /** Operating hours per day */
  hours: Array<{
    day: number; // 0=Sun … 6=Sat
    isOpen: boolean;
    openTime: string;  // "08:00"
    closeTime: string; // "18:00"
  }>;
  /** Emergency / 24-hour service */
  isEmergency: boolean;
  /** Languages spoken */
  languages: string[];
  /** Insurance providers accepted */
  insuranceAccepted: string[];
  /** Service tags for search (e.g. "X-ray", "blood-test", "vaccination") */
  serviceTags: string[];
  /** Average rating (denormalized) */
  rating: number;
  /** Number of reviews (denormalized) */
  reviewCount: number;
  /** Whether visible in public discovery */
  isDiscoverable: boolean;
  isActive: boolean;
  /** Tenant that owns this provider listing */
  tenant: string;
  /** User who created this listing (merchant/admin) */
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const HealthcareProviderSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Provider name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subType: {
      type: String,
      enum: ['hospital', 'clinic', 'dental', 'lab', 'physio', 'specialist', 'optometrist', 'pharmacy', 'mental-health'],
      required: [true, 'Provider sub-type is required'],
    },
    specialties: [{ type: String, trim: true }],
    shortDescription: {
      type: String,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    image: String,
    images: [
      {
        url: { type: String, required: true },
        alt: String,
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    email: String,
    website: String,
    hours: [
      {
        day: { type: Number, required: true, min: 0, max: 6 },
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '08:00' },
        closeTime: { type: String, default: '18:00' },
      },
    ],
    isEmergency: { type: Boolean, default: false },
    languages: [{ type: String, trim: true }],
    insuranceAccepted: [{ type: String, trim: true }],
    serviceTags: [{ type: String, trim: true }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isDiscoverable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    tenant: { type: String, required: true, index: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

// ── Indexes ──────────────────────────────────────────────────

HealthcareProviderSchema.index({ location: '2dsphere' });
HealthcareProviderSchema.index({ tenant: 1, slug: 1 }, { unique: true });
HealthcareProviderSchema.index({ isDiscoverable: 1, subType: 1, isActive: 1 });
HealthcareProviderSchema.index({ specialties: 1 });
HealthcareProviderSchema.index({ serviceTags: 1 });

export default mongoose.model<IHealthcareProvider>('HealthcareProvider', HealthcareProviderSchema);
