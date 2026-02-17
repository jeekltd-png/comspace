import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export type WorshipSubType =
  | 'church'
  | 'mosque'
  | 'temple'
  | 'synagogue'
  | 'chapel'
  | 'worship-centre';

export type FaithTradition =
  | 'christian'
  | 'muslim'
  | 'hindu'
  | 'jewish'
  | 'buddhist'
  | 'sikh'
  | 'non-denominational'
  | 'other';

export interface IWorshipProvider extends Document {
  name: string;
  slug: string;
  /** Sub-type distinguishes churches from mosques, temples, etc. */
  subType: WorshipSubType;
  /** Faith tradition / denomination family */
  faithTradition: FaithTradition;
  /** Denomination or movement (e.g. "Catholic", "Anglican", "Pentecostal", "Sunni") */
  denomination?: string;
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
  /** Regular service / worship schedule */
  serviceSchedule: Array<{
    day: number; // 0=Sun … 6=Sat
    time: string; // "09:00"
    label: string; // "Sunday Service", "Jummah Prayer"
  }>;
  /** Operating / office hours per day */
  hours: Array<{
    day: number; // 0=Sun … 6=Sat
    isOpen: boolean;
    openTime: string;  // "08:00"
    closeTime: string; // "17:00"
  }>;
  /** Ministries / departments / groups (e.g. "Youth Ministry", "Choir", "Women's Fellowship") */
  ministries: string[];
  /** Programmes & community activities */
  programmes: string[];
  /** Name of head pastor, imam, rabbi, etc. */
  leaderName?: string;
  /** Title of leader (e.g. "Senior Pastor", "Imam", "Rabbi") */
  leaderTitle?: string;
  /** Languages used in services */
  languages: string[];
  /** Service tags for search (e.g. "live-stream", "children-church", "counselling") */
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

const WorshipProviderSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Place of worship name is required'],
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
      enum: ['church', 'mosque', 'temple', 'synagogue', 'chapel', 'worship-centre'],
      required: [true, 'Worship sub-type is required'],
    },
    faithTradition: {
      type: String,
      enum: ['christian', 'muslim', 'hindu', 'jewish', 'buddhist', 'sikh', 'non-denominational', 'other'],
      required: [true, 'Faith tradition is required'],
    },
    denomination: {
      type: String,
      trim: true,
      maxlength: [100, 'Denomination cannot exceed 100 characters'],
    },
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
    serviceSchedule: [
      {
        day: { type: Number, required: true, min: 0, max: 6 },
        time: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],
    hours: [
      {
        day: { type: Number, required: true, min: 0, max: 6 },
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '08:00' },
        closeTime: { type: String, default: '17:00' },
      },
    ],
    ministries: [{ type: String, trim: true }],
    programmes: [{ type: String, trim: true }],
    leaderName: {
      type: String,
      trim: true,
      maxlength: [150, 'Leader name cannot exceed 150 characters'],
    },
    leaderTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Leader title cannot exceed 100 characters'],
    },
    languages: [{ type: String, trim: true }],
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

WorshipProviderSchema.index({ location: '2dsphere' });
WorshipProviderSchema.index({ tenant: 1, slug: 1 }, { unique: true });
WorshipProviderSchema.index({ isDiscoverable: 1, subType: 1, isActive: 1 });
WorshipProviderSchema.index({ faithTradition: 1 });
WorshipProviderSchema.index({ serviceTags: 1 });

export default mongoose.model<IWorshipProvider>('WorshipProvider', WorshipProviderSchema);
