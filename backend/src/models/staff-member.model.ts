import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export interface IWorkingHours {
  /** 0=Sunday, 1=Monday … 6=Saturday */
  day: number;
  isOpen: boolean;
  openTime: string;  // "09:00" (24h)
  closeTime: string; // "18:00"
  /** Lunch / break blocks within the day */
  breaks?: Array<{ start: string; end: string }>;
}

export interface IStaffMember extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  title?: string; // "Senior Stylist", "Nail Technician"
  bio?: string;
  avatar?: string;
  /** Services this staff member can perform */
  serviceIds: mongoose.Types.ObjectId[];
  /** Weekly availability schedule */
  workingHours: IWorkingHours[];
  /** Blocked-out dates (holidays, sick days) — stored as YYYY-MM-DD strings */
  blockedDates: string[];
  isActive: boolean;
  sortOrder: number;
  tenant: string;
  vendor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const WorkingHoursSubSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '18:00' },
    breaks: [
      {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
  },
  { _id: false },
);

const StaffMemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    avatar: String,
    serviceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'SalonService',
      },
    ],
    workingHours: {
      type: [WorkingHoursSubSchema],
      default: [
        { day: 0, isOpen: false, openTime: '09:00', closeTime: '18:00' },
        { day: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { day: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { day: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { day: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { day: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { day: 6, isOpen: true, openTime: '09:00', closeTime: '17:00' },
      ],
    },
    blockedDates: [String],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    tenant: { type: String, required: true, index: true },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes
StaffMemberSchema.index({ tenant: 1, slug: 1 }, { unique: true });
StaffMemberSchema.index({ tenant: 1, vendor: 1 });

export default mongoose.model<IStaffMember>('StaffMember', StaffMemberSchema);
