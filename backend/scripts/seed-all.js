#!/usr/bin/env node

/**
 * Comprehensive Seed Script
 * Populates ALL collections with realistic sample data across
 * three account types: Individual, Business, and Association.
 *
 * Usage:
 *   node backend/scripts/seed-all.js
 *   (Requires MongoDB running — either local or via MONGODB_URI env)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comspace';

// ─── Schemas (self-contained so script runs without ts-node) ───────────────

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['customer','admin','admin1','admin2','superadmin','merchant'], default: 'customer' },
  accountType: { type: String, enum: ['individual','business','association'], default: 'individual' },
  organization: {
    name: String, registrationNumber: String, taxId: String,
    industry: String, mission: String, estimatedMembers: Number,
  },
  avatar: String,
  addresses: [{
    label: String, street: String, city: String, state: String,
    country: String, postalCode: String,
    coordinates: { lat: Number, lng: Number },
    isDefault: { type: Boolean, default: false },
  }],
  preferences: {
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
    notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
  },
  oauth: { google: String, apple: String },
  tenant: { type: String, default: 'default', index: true },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });
UserSchema.index({ email: 1, tenant: 1 }, { unique: true });

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true },
  description: String, image: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  tenant: { type: String, default: 'default', index: true },
}, { timestamps: true });
CategorySchema.index({ slug: 1, tenant: 1 }, { unique: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  shortDescription: String,
  sku: { type: String, required: true, uppercase: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: String,
  basePrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  prices: [{ currency: String, amount: Number, updatedAt: Date }],
  images: [{ url: String, alt: String, isPrimary: Boolean }],
  stock: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  isUnlimited: { type: Boolean, default: false },
  dimensions: { weight: Number, length: Number, width: Number, height: Number, unit: { type: String, default: 'cm' } },
  tags: [String],
  rating: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  variants: [{ name: String, options: [String], priceModifier: Number }],
  seo: { title: String, description: String, keywords: [String] },
  tenant: { type: String, default: 'default', index: true },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  salePrice: Number, discount: Number,
  badge: String, isBestseller: Boolean, isNew: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
ProductSchema.index({ sku: 1, tenant: 1 }, { unique: true });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, uppercase: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String, sku: String, quantity: Number, price: Number, currency: String, image: String,
  }],
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true },
  paymentMethod: String,
  paymentStatus: { type: String, enum: ['pending','processing','completed','failed','refunded'], default: 'pending' },
  paymentIntentId: String,
  fulfillmentType: { type: String, enum: ['delivery','pickup'], required: true },
  deliveryAddress: { street: String, city: String, state: String, country: String, postalCode: String },
  status: { type: String, enum: ['pending','confirmed','processing','shipped','out-for-delivery','delivered','ready-for-pickup','picked-up','cancelled','refunded'], default: 'pending' },
  trackingNumber: String,
  estimatedDelivery: Date,
  notes: String,
  tenant: { type: String, default: 'default', index: true },
  statusHistory: [{ status: String, timestamp: Date, note: String }],
}, { timestamps: true });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
  }],
  tenant: { type: String, default: 'default', index: true },
}, { timestamps: true });
CartSchema.index({ user: 1, tenant: 1 }, { unique: true });

const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  address: { street: String, city: String, state: String, country: String, postalCode: String },
  coordinates: { lat: Number, lng: Number },
  phone: String, email: String,
  hours: [{ day: String, open: String, close: String, isClosed: { type: Boolean, default: false } }],
  inventory: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, quantity: Number }],
  isActive: { type: Boolean, default: true },
  tenant: { type: String, default: 'default', index: true },
}, { timestamps: true });
StoreSchema.index({ code: 1, tenant: 1 }, { unique: true });

const WhiteLabelSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  branding: {
    logo: { type: String, required: true },
    favicon: String,
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#10B981' },
    accentColor: { type: String, default: '#F59E0B' },
    fontFamily: { type: String, default: 'Inter, sans-serif' },
  },
  features: {
    delivery: { type: Boolean, default: true }, pickup: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true }, wishlist: { type: Boolean, default: true },
    chat: { type: Boolean, default: false }, socialLogin: { type: Boolean, default: true },
  },
  payment: { stripeAccountId: String, supportedMethods: [String], currencies: [String] },
  contact: { email: { type: String, required: true }, phone: String, address: String },
  social: { facebook: String, twitter: String, instagram: String, linkedin: String },
  seo: { title: String, description: String, keywords: [String] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, trim: true },
  comment: { type: String, required: true, trim: true },
  verified: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  images: [String],
}, { timestamps: true });
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const NewsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const PageSchema = new mongoose.Schema({
  tenant: { type: String, required: true, index: true },
  slug: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  published: { type: Boolean, default: false },
}, { timestamps: true });
PageSchema.index({ tenant: 1, slug: 1 }, { unique: true });

const MembershipPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD', uppercase: true },
  interval: { type: String, enum: ['monthly','quarterly','yearly'], default: 'monthly' },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  maxMembers: Number,
  tenant: { type: String, default: 'default', index: true },
}, { timestamps: true });
MembershipPlanSchema.index({ name: 1, tenant: 1 }, { unique: true });

const MembershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
  status: { type: String, enum: ['active','lapsed','suspended','cancelled','pending'], default: 'pending' },
  memberNumber: { type: String, required: true },
  joinDate: { type: Date, default: Date.now },
  expiryDate: Date,
  autoRenew: { type: Boolean, default: true },
  lastPaymentDate: Date,
  nextDueDate: Date,
  tenant: { type: String, default: 'default', index: true },
}, { timestamps: true });
MembershipSchema.index({ user: 1, tenant: 1 }, { unique: true });
MembershipSchema.index({ memberNumber: 1, tenant: 1 }, { unique: true });

const MemberDuesSchema = new mongoose.Schema({
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD', uppercase: true },
  status: { type: String, enum: ['paid','pending','overdue','failed','waived'], default: 'pending' },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['stripe','manual','bank_transfer','cash'], default: 'stripe' },
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tenant: { type: String, default: 'default', index: true },
}, { timestamps: true });
MemberDuesSchema.index({ membership: 1, periodStart: 1, tenant: 1 }, { unique: true });

// ─── Register models ───────────────────────────────────────────────────────

const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Cart = mongoose.model('Cart', CartSchema);
const Store = mongoose.model('Store', StoreSchema);
const WhiteLabel = mongoose.model('WhiteLabel', WhiteLabelSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Newsletter = mongoose.model('Newsletter', NewsletterSchema);
const Page = mongoose.model('Page', PageSchema);
const MembershipPlan = mongoose.model('MembershipPlan', MembershipPlanSchema);
const Membership = mongoose.model('Membership', MembershipSchema);
const MemberDues = mongoose.model('MemberDues', MemberDuesSchema);

// ─── Helpers ────────────────────────────────────────────────────────────────

const hash = (pw) => bcrypt.hashSync(pw, 10);
const DEFAULT_PW = 'Password123!';
const today = new Date();
const daysAgo = (n) => new Date(today.getTime() - n * 86400000);
const daysFromNow = (n) => new Date(today.getTime() + n * 86400000);
const monthsAgo = (n) => { const d = new Date(today); d.setMonth(d.getMonth() - n); return d; };
const monthsFromNow = (n) => { const d = new Date(today); d.setMonth(d.getMonth() + n); return d; };

// ─── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected!\n');

  // ── Clean existing seed data ────────────────────────────────────────────
  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({}),
    Order.deleteMany({}), Cart.deleteMany({}), Store.deleteMany({}),
    WhiteLabel.deleteMany({}), Review.deleteMany({}), Newsletter.deleteMany({}),
    Page.deleteMany({}), MembershipPlan.deleteMany({}), Membership.deleteMany({}),
    MemberDues.deleteMany({}),
  ]);
  console.log('✅ Database cleared\n');

  // ════════════════════════════════════════════════════════════════════════
  // 1. WHITE-LABEL TENANTS
  // ════════════════════════════════════════════════════════════════════════
  console.log('🏢 Creating tenants...');

  const tenants = await WhiteLabel.insertMany([
    {
      tenantId: 'default',
      name: 'ComSpace Marketplace',
      domain: 'localhost:3000',
      branding: {
        logo: '/images/logo.png',
        favicon: '/favicon.ico',
        primaryColor: '#6C63FF',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        fontFamily: 'Inter, sans-serif',
      },
      features: { delivery: true, pickup: true, reviews: true, wishlist: true, chat: false, socialLogin: true },
      payment: { supportedMethods: ['card', 'apple_pay', 'google_pay'], currencies: ['USD', 'EUR', 'GBP'] },
      contact: { email: 'hello@comspace.io', phone: '+1-555-100-0001', address: '100 Market St, San Francisco, CA 94105' },
      social: { twitter: 'https://twitter.com/comspace', instagram: 'https://instagram.com/comspace' },
      seo: { title: 'ComSpace — Multi-Vendor Marketplace', description: 'Shop from thousands of vendors in one place.', keywords: ['marketplace','ecommerce','shopping'] },
    },
    {
      tenantId: 'acme-corp',
      name: 'Acme Corporation Store',
      domain: 'acme.localhost:3000',
      branding: {
        logo: '/images/acme-logo.png',
        favicon: '/favicon.ico',
        primaryColor: '#1E40AF',
        secondaryColor: '#DC2626',
        accentColor: '#FBBF24',
        fontFamily: 'Poppins, sans-serif',
      },
      features: { delivery: true, pickup: false, reviews: true, wishlist: true, chat: true, socialLogin: false },
      payment: { supportedMethods: ['card', 'bank_transfer'], currencies: ['USD'] },
      contact: { email: 'sales@acme-corp.com', phone: '+1-555-200-0002', address: '200 Industrial Ave, Dallas, TX 75201' },
      social: { linkedin: 'https://linkedin.com/company/acme-corp' },
      seo: { title: 'Acme Corp — Industrial Supplies', description: 'Quality industrial and safety supplies for businesses.', keywords: ['industrial','supplies','business'] },
    },
    {
      tenantId: 'green-earth-assoc',
      name: 'Green Earth Association',
      domain: 'greenearth.localhost:3000',
      branding: {
        logo: '/images/greenearth-logo.png',
        favicon: '/favicon.ico',
        primaryColor: '#059669',
        secondaryColor: '#0D9488',
        accentColor: '#84CC16',
        fontFamily: 'Nunito, sans-serif',
      },
      features: { delivery: true, pickup: true, reviews: true, wishlist: false, chat: true, socialLogin: true },
      payment: { supportedMethods: ['card', 'bank_transfer'], currencies: ['USD', 'EUR'] },
      contact: { email: 'info@greenearth.org', phone: '+1-555-300-0003', address: '50 Green Way, Portland, OR 97201' },
      social: { facebook: 'https://facebook.com/greenearthassoc', instagram: 'https://instagram.com/greenearth' },
      seo: { title: 'Green Earth Association — Sustainable Living', description: 'Join our community for a greener planet.', keywords: ['sustainability','environment','association','community'] },
    },
  ]);
  console.log(`   ✅ ${tenants.length} tenants created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 2. USERS (across all account types and tenants)
  // ════════════════════════════════════════════════════════════════════════
  console.log('👤 Creating users...');

  const users = await User.insertMany([
    // ── Default tenant (ComSpace) ─────────────────────────────────────
    {
      email: 'superadmin@comspace.io',
      password: hash(DEFAULT_PW),
      firstName: 'Super', lastName: 'Admin',
      phone: '+1-555-000-0001',
      role: 'superadmin', accountType: 'individual',
      tenant: 'default', isVerified: true, isActive: true,
      lastLogin: daysAgo(0),
      addresses: [{ label: 'Office', street: '100 Market St', city: 'San Francisco', state: 'CA', country: 'US', postalCode: '94105', isDefault: true }],
    },
    {
      email: 'admin@comspace.io',
      password: hash(DEFAULT_PW),
      firstName: 'Platform', lastName: 'Admin',
      phone: '+1-555-000-0002',
      role: 'admin', accountType: 'individual',
      tenant: 'default', isVerified: true, isActive: true,
      lastLogin: daysAgo(1),
    },
    {
      email: 'sarah.johnson@gmail.com',
      password: hash(DEFAULT_PW),
      firstName: 'Sarah', lastName: 'Johnson',
      phone: '+1-555-101-1001',
      role: 'customer', accountType: 'individual',
      tenant: 'default', isVerified: true, isActive: true,
      lastLogin: daysAgo(2),
      addresses: [
        { label: 'Home', street: '456 Oak Ave', city: 'Austin', state: 'TX', country: 'US', postalCode: '73301', isDefault: true },
        { label: 'Work', street: '789 Congress Blvd', city: 'Austin', state: 'TX', country: 'US', postalCode: '73302', isDefault: false },
      ],
    },
    {
      email: 'mike.chen@gmail.com',
      password: hash(DEFAULT_PW),
      firstName: 'Mike', lastName: 'Chen',
      phone: '+1-555-101-1002',
      role: 'customer', accountType: 'individual',
      tenant: 'default', isVerified: true, isActive: true,
      lastLogin: daysAgo(5),
      addresses: [{ label: 'Home', street: '123 Maple Dr', city: 'Seattle', state: 'WA', country: 'US', postalCode: '98101', isDefault: true }],
    },
    {
      email: 'emma.davis@outlook.com',
      password: hash(DEFAULT_PW),
      firstName: 'Emma', lastName: 'Davis',
      phone: '+1-555-101-1003',
      role: 'customer', accountType: 'individual',
      tenant: 'default', isVerified: true, isActive: true,
      lastLogin: daysAgo(10),
      addresses: [{ label: 'Home', street: '321 Pine St', city: 'Denver', state: 'CO', country: 'US', postalCode: '80201', isDefault: true }],
    },
    {
      email: 'james.wilson@yahoo.com',
      password: hash(DEFAULT_PW),
      firstName: 'James', lastName: 'Wilson',
      phone: '+1-555-101-1004',
      role: 'customer', accountType: 'individual',
      tenant: 'default', isVerified: false, isActive: true,
    },

    // ── Business tenant (Acme Corp) ───────────────────────────────────
    {
      email: 'robert.blake@acme-corp.com',
      password: hash(DEFAULT_PW),
      firstName: 'Robert', lastName: 'Blake',
      phone: '+1-555-200-1001',
      role: 'merchant', accountType: 'business',
      organization: {
        name: 'Acme Corporation',
        registrationNumber: 'BIZ-2024-78901',
        taxId: 'EIN-12-3456789',
        industry: 'Industrial Supplies',
      },
      tenant: 'acme-corp', isVerified: true, isActive: true,
      lastLogin: daysAgo(0),
      addresses: [{ label: 'HQ', street: '200 Industrial Ave', city: 'Dallas', state: 'TX', country: 'US', postalCode: '75201', isDefault: true }],
    },
    {
      email: 'linda.torres@acme-corp.com',
      password: hash(DEFAULT_PW),
      firstName: 'Linda', lastName: 'Torres',
      phone: '+1-555-200-1002',
      role: 'admin', accountType: 'business',
      organization: { name: 'Acme Corporation' },
      tenant: 'acme-corp', isVerified: true, isActive: true,
      lastLogin: daysAgo(1),
    },
    {
      email: 'kevin.patel@outlook.com',
      password: hash(DEFAULT_PW),
      firstName: 'Kevin', lastName: 'Patel',
      phone: '+1-555-200-1003',
      role: 'customer', accountType: 'individual',
      tenant: 'acme-corp', isVerified: true, isActive: true,
      lastLogin: daysAgo(3),
      addresses: [{ label: 'Home', street: '500 Elm St', city: 'Houston', state: 'TX', country: 'US', postalCode: '77001', isDefault: true }],
    },
    {
      email: 'nancy.kim@gmail.com',
      password: hash(DEFAULT_PW),
      firstName: 'Nancy', lastName: 'Kim',
      phone: '+1-555-200-1004',
      role: 'customer', accountType: 'individual',
      tenant: 'acme-corp', isVerified: true, isActive: true,
      lastLogin: daysAgo(7),
    },

    // ── Association tenant (Green Earth) ──────────────────────────────
    {
      email: 'olivia.green@greenearth.org',
      password: hash(DEFAULT_PW),
      firstName: 'Olivia', lastName: 'Green',
      phone: '+1-555-300-1001',
      role: 'admin', accountType: 'association',
      organization: {
        name: 'Green Earth Association',
        mission: 'Promote sustainable living and environmental awareness through community action.',
        estimatedMembers: 250,
      },
      tenant: 'green-earth-assoc', isVerified: true, isActive: true,
      lastLogin: daysAgo(0),
      addresses: [{ label: 'Office', street: '50 Green Way', city: 'Portland', state: 'OR', country: 'US', postalCode: '97201', isDefault: true }],
    },
    {
      email: 'david.rivers@gmail.com',
      password: hash(DEFAULT_PW),
      firstName: 'David', lastName: 'Rivers',
      phone: '+1-555-300-1002',
      role: 'customer', accountType: 'individual',
      tenant: 'green-earth-assoc', isVerified: true, isActive: true,
      lastLogin: daysAgo(2),
      addresses: [{ label: 'Home', street: '88 River Rd', city: 'Portland', state: 'OR', country: 'US', postalCode: '97202', isDefault: true }],
    },
    {
      email: 'maya.flores@yahoo.com',
      password: hash(DEFAULT_PW),
      firstName: 'Maya', lastName: 'Flores',
      phone: '+1-555-300-1003',
      role: 'customer', accountType: 'individual',
      tenant: 'green-earth-assoc', isVerified: true, isActive: true,
      lastLogin: daysAgo(4),
    },
    {
      email: 'alex.storm@outlook.com',
      password: hash(DEFAULT_PW),
      firstName: 'Alex', lastName: 'Storm',
      phone: '+1-555-300-1004',
      role: 'customer', accountType: 'individual',
      tenant: 'green-earth-assoc', isVerified: true, isActive: true,
      lastLogin: daysAgo(6),
      addresses: [{ label: 'Home', street: '12 Cloud Ct', city: 'Eugene', state: 'OR', country: 'US', postalCode: '97401', isDefault: true }],
    },
    {
      email: 'chris.woods@gmail.com',
      password: hash(DEFAULT_PW),
      firstName: 'Chris', lastName: 'Woods',
      phone: '+1-555-300-1005',
      role: 'customer', accountType: 'individual',
      tenant: 'green-earth-assoc', isVerified: true, isActive: true,
      lastLogin: daysAgo(14),
    },
    {
      email: 'pat.meadow@gmail.com',
      password: hash(DEFAULT_PW),
      firstName: 'Pat', lastName: 'Meadow',
      phone: '+1-555-300-1006',
      role: 'customer', accountType: 'individual',
      tenant: 'green-earth-assoc', isVerified: false, isActive: true,
    },
  ]);

  // Build lookup maps
  const u = {};
  users.forEach(user => { u[user.email] = user; });
  console.log(`   ✅ ${users.length} users created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 3. CATEGORIES
  // ════════════════════════════════════════════════════════════════════════
  console.log('📂 Creating categories...');

  const categories = await Category.insertMany([
    // Default tenant
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets, devices, and accessories', order: 1, tenant: 'default' },
    { name: 'Fashion', slug: 'fashion', description: 'Clothing, shoes, and apparel', order: 2, tenant: 'default' },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Furniture, decor, and garden tools', order: 3, tenant: 'default' },
    { name: 'Books & Media', slug: 'books-media', description: 'Books, music, and digital media', order: 4, tenant: 'default' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Equipment for sports and outdoor adventures', order: 5, tenant: 'default' },
    { name: 'Health & Beauty', slug: 'health-beauty', description: 'Skincare, supplements, and wellness', order: 6, tenant: 'default' },
    // Acme Corp
    { name: 'Safety Equipment', slug: 'safety-equipment', description: 'Hard hats, goggles, gloves, and PPE', order: 1, tenant: 'acme-corp' },
    { name: 'Power Tools', slug: 'power-tools', description: 'Drills, saws, and industrial tools', order: 2, tenant: 'acme-corp' },
    { name: 'Fasteners & Hardware', slug: 'fasteners-hardware', description: 'Nuts, bolts, screws, and brackets', order: 3, tenant: 'acme-corp' },
    // Green Earth
    { name: 'Eco Products', slug: 'eco-products', description: 'Sustainable and eco-friendly goods', order: 1, tenant: 'green-earth-assoc' },
    { name: 'Garden Supplies', slug: 'garden-supplies', description: 'Seeds, soil, and composting tools', order: 2, tenant: 'green-earth-assoc' },
    { name: 'Workshops & Events', slug: 'workshops-events', description: 'Tickets and materials for community events', order: 3, tenant: 'green-earth-assoc' },
  ]);

  const c = {};
  categories.forEach(cat => { c[`${cat.tenant}:${cat.slug}`] = cat; });
  console.log(`   ✅ ${categories.length} categories created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 4. PRODUCTS
  // ════════════════════════════════════════════════════════════════════════
  console.log('🛍️  Creating products...');

  const productData = [
    // ── Default tenant ────────────────────────────────────────────────
    {
      name: 'Wireless Noise-Cancelling Headphones',
      description: 'Premium over-ear headphones with adaptive noise cancellation, 40-hour battery life, and Hi-Res audio certification. Bluetooth 5.3 with multipoint connection.',
      shortDescription: 'Premium ANC headphones with 40hr battery',
      sku: 'DEF-ELEC-001', category: c['default:electronics']._id,
      basePrice: 249.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 249.99, updatedAt: today }, { currency: 'EUR', amount: 229.99, updatedAt: today }],
      images: [{ url: '/uploads/products/headphones-1.jpg', alt: 'Wireless Headphones Front', isPrimary: true }],
      stock: 85, lowStockThreshold: 10,
      tags: ['electronics', 'audio', 'wireless', 'noise-cancelling'],
      rating: { average: 4.7, count: 234 },
      seo: { title: 'Wireless ANC Headphones', description: 'Shop premium noise-cancelling headphones', keywords: ['headphones','anc','wireless'] },
      tenant: 'default', isFeatured: true, isOnSale: false,
      badge: 'bestseller', isBestseller: true,
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'Ultra Slim Laptop 15"',
      description: 'Lightweight 15.6" laptop with Intel i7-13th Gen, 16GB RAM, 512GB SSD, and a stunning 2.8K OLED display. Perfect for work and creativity.',
      shortDescription: '15.6" i7 laptop with OLED display',
      sku: 'DEF-ELEC-002', category: c['default:electronics']._id,
      basePrice: 1299.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 1299.99, updatedAt: today }],
      images: [{ url: '/uploads/products/laptop-1.jpg', alt: 'Ultra Slim Laptop', isPrimary: true }],
      stock: 32, lowStockThreshold: 5,
      tags: ['electronics', 'laptop', 'computer'],
      rating: { average: 4.5, count: 89 },
      seo: { title: 'Ultra Slim Laptop 15"', description: 'Powerful thin laptop for professionals', keywords: ['laptop','ultrabook','oled'] },
      tenant: 'default', isFeatured: true, isOnSale: true,
      salePrice: 1099.99, discount: 15, badge: 'hot',
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'Smart Watch Series X',
      description: 'Advanced health and fitness smartwatch with ECG, SpO2, GPS, and 7-day battery. Water-resistant to 50m with always-on AMOLED display.',
      shortDescription: 'Health-tracking smartwatch with ECG',
      sku: 'DEF-ELEC-003', category: c['default:electronics']._id,
      basePrice: 399.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 399.99, updatedAt: today }],
      images: [{ url: '/uploads/products/smartwatch-1.jpg', alt: 'Smart Watch Series X', isPrimary: true }],
      stock: 120, lowStockThreshold: 15,
      tags: ['electronics', 'wearable', 'fitness', 'smartwatch'],
      rating: { average: 4.8, count: 312 },
      seo: { title: 'Smart Watch Series X', description: 'Advanced health smartwatch', keywords: ['smartwatch','fitness','health'] },
      tenant: 'default', isFeatured: true, badge: 'new', isNew: true,
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'Organic Cotton T-Shirt',
      description: 'Ultra-soft 100% organic cotton crew-neck t-shirt. Sustainably sourced, pre-shrunk, and available in 12 colors. Fair Trade certified.',
      shortDescription: 'Soft organic cotton crew-neck tee',
      sku: 'DEF-FASH-001', category: c['default:fashion']._id,
      basePrice: 34.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 34.99, updatedAt: today }],
      images: [{ url: '/uploads/products/tshirt-1.jpg', alt: 'Organic Cotton T-Shirt', isPrimary: true }],
      stock: 500, lowStockThreshold: 50,
      variants: [{ name: 'Size', options: ['S','M','L','XL','XXL'], priceModifier: 0 }, { name: 'Color', options: ['White','Black','Navy','Forest Green'], priceModifier: 0 }],
      tags: ['fashion', 'organic', 'cotton', 'sustainable'],
      rating: { average: 4.6, count: 178 },
      seo: { title: 'Organic Cotton T-Shirt', description: 'Sustainable organic tee', keywords: ['tshirt','organic','cotton'] },
      tenant: 'default', isFeatured: false,
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'Premium Denim Jeans',
      description: 'Classic-fit premium denim jeans with stretch comfort. Made from Japanese selvedge denim with a modern silhouette.',
      shortDescription: 'Classic-fit Japanese selvedge denim',
      sku: 'DEF-FASH-002', category: c['default:fashion']._id,
      basePrice: 89.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 89.99, updatedAt: today }],
      images: [{ url: '/uploads/products/jeans-1.jpg', alt: 'Premium Denim Jeans', isPrimary: true }],
      stock: 200, lowStockThreshold: 20,
      variants: [{ name: 'Waist', options: ['28','30','32','34','36'], priceModifier: 0 }, { name: 'Length', options: ['30','32','34'], priceModifier: 0 }],
      tags: ['fashion', 'denim', 'jeans'],
      rating: { average: 4.4, count: 96 },
      tenant: 'default',
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'Ergonomic Office Chair',
      description: 'Full-mesh ergonomic office chair with adjustable lumbar support, headrest, and 4D armrests. Supports up to 300 lbs with a 12-year warranty.',
      shortDescription: 'Full-mesh ergonomic chair with lumbar support',
      sku: 'DEF-HOME-001', category: c['default:home-garden']._id,
      basePrice: 449.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 449.99, updatedAt: today }],
      images: [{ url: '/uploads/products/chair-1.jpg', alt: 'Ergonomic Office Chair', isPrimary: true }],
      stock: 45, lowStockThreshold: 5,
      tags: ['furniture', 'office', 'ergonomic'],
      rating: { average: 4.9, count: 456 },
      seo: { title: 'Ergonomic Office Chair', description: 'Premium desk chair for comfort', keywords: ['chair','ergonomic','office'] },
      tenant: 'default', isFeatured: true, badge: 'bestseller', isBestseller: true,
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'Ceramic Plant Pot Set (3-Pack)',
      description: 'Modern minimalist ceramic plant pots in three sizes. Features drainage holes and bamboo saucers. Perfect for succulents and herbs.',
      shortDescription: 'Minimalist ceramic pots with bamboo saucers',
      sku: 'DEF-HOME-002', category: c['default:home-garden']._id,
      basePrice: 42.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 42.99, updatedAt: today }],
      images: [{ url: '/uploads/products/plant-pots-1.jpg', alt: 'Ceramic Plant Pots', isPrimary: true }],
      stock: 150, lowStockThreshold: 20,
      tags: ['home', 'garden', 'pots', 'ceramic'],
      rating: { average: 4.3, count: 67 },
      tenant: 'default',
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'JavaScript: The Definitive Guide (7th Ed)',
      description: 'The comprehensive resource for JavaScript developers. Covers ES2020+, modules, iterators, generators, Promises, and more.',
      shortDescription: 'Comprehensive JS guide — 7th edition',
      sku: 'DEF-BOOK-001', category: c['default:books-media']._id,
      basePrice: 49.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 49.99, updatedAt: today }],
      images: [{ url: '/uploads/products/js-book-1.jpg', alt: 'JavaScript Book', isPrimary: true }],
      stock: 300, lowStockThreshold: 30,
      tags: ['books', 'programming', 'javascript'],
      rating: { average: 4.6, count: 521 },
      tenant: 'default',
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'Yoga Mat Premium',
      description: 'Extra-thick 6mm TPE yoga mat with alignment lines. Non-slip surface, eco-friendly material. Includes carry strap.',
      shortDescription: 'Extra-thick eco-friendly yoga mat',
      sku: 'DEF-SPRT-001', category: c['default:sports-outdoors']._id,
      basePrice: 59.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 59.99, updatedAt: today }],
      images: [{ url: '/uploads/products/yoga-mat-1.jpg', alt: 'Yoga Mat', isPrimary: true }],
      stock: 220, lowStockThreshold: 25,
      tags: ['sports', 'yoga', 'fitness', 'eco-friendly'],
      rating: { average: 4.5, count: 189 },
      tenant: 'default', isOnSale: true, salePrice: 44.99, discount: 25, badge: 'sale',
      createdBy: u['admin@comspace.io']._id,
    },
    {
      name: 'Vitamin C Serum',
      description: '20% Vitamin C serum with hyaluronic acid and vitamin E. Brightens skin, reduces dark spots, and boosts collagen. Dermatologist-tested.',
      shortDescription: 'Brightening vitamin C serum with HA',
      sku: 'DEF-HLTH-001', category: c['default:health-beauty']._id,
      basePrice: 28.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 28.99, updatedAt: today }],
      images: [{ url: '/uploads/products/serum-1.jpg', alt: 'Vitamin C Serum', isPrimary: true }],
      stock: 400, lowStockThreshold: 40,
      tags: ['skincare', 'beauty', 'vitamin-c'],
      rating: { average: 4.7, count: 342 },
      tenant: 'default', badge: 'new', isNew: true,
      createdBy: u['admin@comspace.io']._id,
    },

    // ── Acme Corp products ────────────────────────────────────────────
    {
      name: 'Industrial Hard Hat — OSHA Approved',
      description: 'Type I Class E hard hat with ratchet suspension. Meets ANSI/ISEA Z89.1-2014. UV-stabilized HDPE shell.',
      shortDescription: 'OSHA-approved industrial hard hat',
      sku: 'ACM-SAFE-001', category: c['acme-corp:safety-equipment']._id,
      basePrice: 24.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 24.99, updatedAt: today }],
      images: [{ url: '/uploads/products/hardhat-1.jpg', alt: 'Industrial Hard Hat', isPrimary: true }],
      stock: 500, lowStockThreshold: 50,
      tags: ['safety', 'hardhat', 'osha', 'ppe'],
      rating: { average: 4.6, count: 87 },
      tenant: 'acme-corp', isFeatured: true,
      createdBy: u['robert.blake@acme-corp.com']._id,
    },
    {
      name: 'Safety Goggles Anti-Fog',
      description: 'Over-glasses safety goggles with anti-fog coating. Indirect ventilation for chemical splash protection. ANSI Z87.1 rated.',
      shortDescription: 'Anti-fog safety goggles',
      sku: 'ACM-SAFE-002', category: c['acme-corp:safety-equipment']._id,
      basePrice: 12.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 12.99, updatedAt: today }],
      images: [{ url: '/uploads/products/goggles-1.jpg', alt: 'Safety Goggles', isPrimary: true }],
      stock: 800, lowStockThreshold: 100,
      tags: ['safety', 'goggles', 'ppe'],
      rating: { average: 4.4, count: 156 },
      tenant: 'acme-corp',
      createdBy: u['robert.blake@acme-corp.com']._id,
    },
    {
      name: '20V Cordless Impact Drill',
      description: '20V MAX lithium-ion cordless impact drill with 2-speed settings. 1500 in-lbs torque, LED work light, belt clip. Battery + charger included.',
      shortDescription: '20V cordless impact drill with battery',
      sku: 'ACM-TOOL-001', category: c['acme-corp:power-tools']._id,
      basePrice: 129.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 129.99, updatedAt: today }],
      images: [{ url: '/uploads/products/drill-1.jpg', alt: 'Cordless Impact Drill', isPrimary: true }],
      stock: 65, lowStockThreshold: 10,
      tags: ['tools', 'drill', 'cordless', 'power-tool'],
      rating: { average: 4.7, count: 203 },
      tenant: 'acme-corp', isFeatured: true, badge: 'bestseller', isBestseller: true,
      createdBy: u['robert.blake@acme-corp.com']._id,
    },
    {
      name: 'Stainless Steel Bolt Assortment (500pc)',
      description: 'Comprehensive 500-piece stainless steel hex bolt assortment. Sizes M3-M12 in various lengths. Grade A2-70, corrosion resistant.',
      shortDescription: '500pc stainless steel bolt assortment',
      sku: 'ACM-FAST-001', category: c['acme-corp:fasteners-hardware']._id,
      basePrice: 54.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 54.99, updatedAt: today }],
      images: [{ url: '/uploads/products/bolts-1.jpg', alt: 'Bolt Assortment', isPrimary: true }],
      stock: 200, lowStockThreshold: 20,
      tags: ['hardware', 'bolts', 'fasteners', 'stainless'],
      rating: { average: 4.5, count: 78 },
      tenant: 'acme-corp',
      createdBy: u['robert.blake@acme-corp.com']._id,
    },

    // ── Green Earth products ──────────────────────────────────────────
    {
      name: 'Bamboo Cutlery Travel Set',
      description: 'Reusable bamboo utensil set: fork, knife, spoon, chopsticks, and straw with cleaning brush. Comes in an organic cotton roll-up pouch.',
      shortDescription: 'Reusable bamboo utensil travel set',
      sku: 'GRN-ECO-001', category: c['green-earth-assoc:eco-products']._id,
      basePrice: 18.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 18.99, updatedAt: today }],
      images: [{ url: '/uploads/products/bamboo-cutlery-1.jpg', alt: 'Bamboo Cutlery Set', isPrimary: true }],
      stock: 300, lowStockThreshold: 30,
      tags: ['eco', 'bamboo', 'reusable', 'zero-waste'],
      rating: { average: 4.8, count: 145 },
      tenant: 'green-earth-assoc', isFeatured: true, badge: 'bestseller', isBestseller: true,
      createdBy: u['olivia.green@greenearth.org']._id,
    },
    {
      name: 'Beeswax Food Wraps (6-Pack)',
      description: 'Organic beeswax-infused cotton wraps to replace plastic wrap. Washable, reusable for up to a year. Assorted sizes.',
      shortDescription: 'Reusable beeswax food wraps set',
      sku: 'GRN-ECO-002', category: c['green-earth-assoc:eco-products']._id,
      basePrice: 22.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 22.99, updatedAt: today }],
      images: [{ url: '/uploads/products/beeswax-wraps-1.jpg', alt: 'Beeswax Wraps', isPrimary: true }],
      stock: 180, lowStockThreshold: 20,
      tags: ['eco', 'beeswax', 'zero-waste', 'kitchen'],
      rating: { average: 4.6, count: 98 },
      tenant: 'green-earth-assoc', isFeatured: true, badge: 'new', isNew: true,
      createdBy: u['olivia.green@greenearth.org']._id,
    },
    {
      name: 'Organic Herb Seed Kit',
      description: '12-variety organic herb seed starter kit with biodegradable pots, soil pellets, and growing guide. Includes basil, cilantro, mint, and more.',
      shortDescription: '12-variety organic herb starter kit',
      sku: 'GRN-GARD-001', category: c['green-earth-assoc:garden-supplies']._id,
      basePrice: 29.99, currency: 'USD',
      prices: [{ currency: 'USD', amount: 29.99, updatedAt: today }],
      images: [{ url: '/uploads/products/herb-kit-1.jpg', alt: 'Organic Herb Seed Kit', isPrimary: true }],
      stock: 150, lowStockThreshold: 15,
      tags: ['garden', 'herbs', 'organic', 'seeds'],
      rating: { average: 4.4, count: 67 },
      tenant: 'green-earth-assoc',
      createdBy: u['olivia.green@greenearth.org']._id,
    },
    {
      name: 'Composting Workshop Ticket — Spring 2026',
      description: 'Hands-on composting workshop at the Green Earth Community Garden. Learn vermicomposting, hot composting, and bokashi methods. Refreshments included.',
      shortDescription: 'Spring composting workshop admission',
      sku: 'GRN-EVNT-001', category: c['green-earth-assoc:workshops-events']._id,
      basePrice: 35.00, currency: 'USD',
      prices: [{ currency: 'USD', amount: 35.00, updatedAt: today }],
      images: [{ url: '/uploads/products/workshop-1.jpg', alt: 'Composting Workshop', isPrimary: true }],
      stock: 30, lowStockThreshold: 5,
      tags: ['workshop', 'composting', 'community', 'event'],
      rating: { average: 4.9, count: 23 },
      tenant: 'green-earth-assoc', isFeatured: true, badge: 'limited',
      createdBy: u['olivia.green@greenearth.org']._id,
    },
  ];

  const products = await Product.insertMany(productData);
  const p = {};
  products.forEach(prod => { p[prod.sku] = prod; });
  console.log(`   ✅ ${products.length} products created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 5. STORES
  // ════════════════════════════════════════════════════════════════════════
  console.log('🏪 Creating stores...');

  const storeHours = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day, i) => ({
    day,
    open: i < 5 ? '09:00' : '10:00',
    close: i < 5 ? '18:00' : (i === 5 ? '16:00' : '14:00'),
    isClosed: false,
  }));

  const stores = await Store.insertMany([
    {
      name: 'ComSpace SF Showroom', code: 'CMSF01',
      address: { street: '100 Market St', city: 'San Francisco', state: 'CA', country: 'US', postalCode: '94105' },
      coordinates: { lat: 37.7937, lng: -122.3965 },
      phone: '+1-555-100-0001', email: 'sf@comspace.io',
      hours: storeHours,
      inventory: [
        { product: p['DEF-ELEC-001']._id, quantity: 20 },
        { product: p['DEF-ELEC-002']._id, quantity: 8 },
        { product: p['DEF-ELEC-003']._id, quantity: 30 },
        { product: p['DEF-HOME-001']._id, quantity: 10 },
      ],
      tenant: 'default',
    },
    {
      name: 'ComSpace Austin Pickup', code: 'CMAU01',
      address: { street: '456 Congress Ave', city: 'Austin', state: 'TX', country: 'US', postalCode: '73301' },
      coordinates: { lat: 30.2672, lng: -97.7431 },
      phone: '+1-555-100-0010', email: 'austin@comspace.io',
      hours: storeHours,
      inventory: [
        { product: p['DEF-FASH-001']._id, quantity: 100 },
        { product: p['DEF-FASH-002']._id, quantity: 50 },
        { product: p['DEF-SPRT-001']._id, quantity: 40 },
      ],
      tenant: 'default',
    },
    {
      name: 'Acme Dallas Warehouse', code: 'ACDL01',
      address: { street: '200 Industrial Ave', city: 'Dallas', state: 'TX', country: 'US', postalCode: '75201' },
      coordinates: { lat: 32.7767, lng: -96.7970 },
      phone: '+1-555-200-0002', email: 'warehouse@acme-corp.com',
      hours: storeHours,
      inventory: [
        { product: p['ACM-SAFE-001']._id, quantity: 200 },
        { product: p['ACM-SAFE-002']._id, quantity: 350 },
        { product: p['ACM-TOOL-001']._id, quantity: 30 },
        { product: p['ACM-FAST-001']._id, quantity: 100 },
      ],
      tenant: 'acme-corp',
    },
    {
      name: 'Green Earth Community Hub', code: 'GEPD01',
      address: { street: '50 Green Way', city: 'Portland', state: 'OR', country: 'US', postalCode: '97201' },
      coordinates: { lat: 45.5152, lng: -122.6784 },
      phone: '+1-555-300-0003', email: 'hub@greenearth.org',
      hours: storeHours,
      inventory: [
        { product: p['GRN-ECO-001']._id, quantity: 80 },
        { product: p['GRN-ECO-002']._id, quantity: 50 },
        { product: p['GRN-GARD-001']._id, quantity: 60 },
      ],
      tenant: 'green-earth-assoc',
    },
  ]);
  console.log(`   ✅ ${stores.length} stores created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 6. REVIEWS
  // ════════════════════════════════════════════════════════════════════════
  console.log('⭐ Creating reviews...');

  const reviews = await Review.insertMany([
    // Default tenant reviews
    { productId: p['DEF-ELEC-001']._id, userId: u['sarah.johnson@gmail.com']._id, rating: 5, title: 'Best headphones I\'ve ever owned', comment: 'The noise cancellation is incredible. I use them daily for work calls and music. Battery lasts forever. Highly recommended!', verified: true, helpful: 24 },
    { productId: p['DEF-ELEC-001']._id, userId: u['mike.chen@gmail.com']._id, rating: 4, title: 'Great sound, slightly tight fit', comment: 'Sound quality is top-notch and ANC is excellent. They feel a bit tight on my head after 3+ hours though. Still a great buy.', verified: true, helpful: 11 },
    { productId: p['DEF-ELEC-002']._id, userId: u['emma.davis@outlook.com']._id, rating: 5, title: 'Perfect for development work', comment: 'The OLED display is gorgeous and the performance is snappy. Boot-up is instant. Love the keyboard too. Worth every penny.', verified: true, helpful: 18 },
    { productId: p['DEF-ELEC-003']._id, userId: u['sarah.johnson@gmail.com']._id, rating: 5, title: 'Health tracking changed my routine', comment: 'The ECG and sleep tracking features are surprisingly accurate. Compared them with my doctor\'s readings. Battery lasts a full week.', verified: true, helpful: 32 },
    { productId: p['DEF-HOME-001']._id, userId: u['mike.chen@gmail.com']._id, rating: 5, title: 'My back thanks me', comment: 'After 8 years of cheap chairs, this is life-changing. The lumbar support is perfect and I can sit comfortably for 10+ hours.', verified: true, helpful: 45 },
    { productId: p['DEF-HOME-001']._id, userId: u['emma.davis@outlook.com']._id, rating: 5, title: 'Worth the investment', comment: 'Assembly was easy (30 min). The mesh keeps you cool in summer. Armrests adjust in every direction. Zero regrets.', verified: true, helpful: 29 },
    { productId: p['DEF-FASH-001']._id, userId: u['sarah.johnson@gmail.com']._id, rating: 4, title: 'Super soft and comfortable', comment: 'The fabric is so soft! Love that it\'s organic. Runs slightly large — I\'d size down. Great basic tee for everyday wear.', verified: true, helpful: 8 },
    { productId: p['DEF-SPRT-001']._id, userId: u['emma.davis@outlook.com']._id, rating: 5, title: 'Non-slip and cushioned', comment: 'I\'ve used many yoga mats but this one has the best grip. The extra thickness is kind on my knees. Love the alignment lines!', verified: true, helpful: 15 },
    { productId: p['DEF-HLTH-001']._id, userId: u['sarah.johnson@gmail.com']._id, rating: 5, title: 'Visible results in 2 weeks', comment: 'My dark spots have noticeably faded after just 2 weeks of use. Texture is light and absorbs quickly. Will repurchase!', verified: true, helpful: 22 },
    // Acme Corp reviews
    { productId: p['ACM-TOOL-001']._id, userId: u['kevin.patel@outlook.com']._id, rating: 5, title: 'Powerful and reliable', comment: 'Used this for a deck rebuild and it handled everything. Great torque, comfortable grip, and the battery lasts all day.', verified: true, helpful: 14 },
    { productId: p['ACM-SAFE-001']._id, userId: u['nancy.kim@gmail.com']._id, rating: 4, title: 'Good quality PPE', comment: 'Comfortable fit with the ratchet adjustment. Ordered 20 for our team. Good ventilation. Only wish it came in more colors.', verified: true, helpful: 7 },
    // Green Earth reviews
    { productId: p['GRN-ECO-001']._id, userId: u['david.rivers@gmail.com']._id, rating: 5, title: 'Perfect for zero-waste lifestyle', comment: 'I carry this everywhere now. The bamboo feels great and the cotton pouch is beautiful. No more single-use plastics!', verified: true, helpful: 19 },
    { productId: p['GRN-ECO-001']._id, userId: u['maya.flores@yahoo.com']._id, rating: 5, title: 'Great gift idea', comment: 'Bought these as gifts for friends. Everyone loved them! Quality is excellent and the packaging is plastic-free too.', verified: true, helpful: 12 },
    { productId: p['GRN-ECO-002']._id, userId: u['alex.storm@outlook.com']._id, rating: 4, title: 'Works well, takes getting used to', comment: 'Wraps work great once you learn to warm them in your hands first. Replaced all our cling film. Would love bigger sizes.', verified: true, helpful: 8 },
    { productId: p['GRN-EVNT-001']._id, userId: u['david.rivers@gmail.com']._id, rating: 5, title: 'Learned so much!', comment: 'Olivia is a fantastic instructor. I now have a thriving compost bin at home. The refreshments were great too. Will attend more!', verified: true, helpful: 16 },
  ]);
  console.log(`   ✅ ${reviews.length} reviews created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 7. ORDERS
  // ════════════════════════════════════════════════════════════════════════
  console.log('📦 Creating orders...');

  const orders = await Order.insertMany([
    // Sarah's completed order
    {
      orderNumber: 'ORD-CS-000001',
      user: u['sarah.johnson@gmail.com']._id,
      items: [
        { product: p['DEF-ELEC-001']._id, name: 'Wireless Noise-Cancelling Headphones', sku: 'DEF-ELEC-001', quantity: 1, price: 249.99, currency: 'USD', image: '/uploads/products/headphones-1.jpg' },
        { product: p['DEF-FASH-001']._id, name: 'Organic Cotton T-Shirt', sku: 'DEF-FASH-001', quantity: 2, price: 34.99, currency: 'USD', image: '/uploads/products/tshirt-1.jpg' },
      ],
      subtotal: 319.97, tax: 25.60, shippingFee: 0, discount: 0, total: 345.57, currency: 'USD',
      paymentMethod: 'card', paymentStatus: 'completed',
      fulfillmentType: 'delivery',
      deliveryAddress: { street: '456 Oak Ave', city: 'Austin', state: 'TX', country: 'US', postalCode: '73301' },
      status: 'delivered',
      trackingNumber: 'TRK9876543210',
      tenant: 'default',
      statusHistory: [
        { status: 'pending', timestamp: daysAgo(14) },
        { status: 'confirmed', timestamp: daysAgo(14), note: 'Payment confirmed' },
        { status: 'processing', timestamp: daysAgo(13) },
        { status: 'shipped', timestamp: daysAgo(12), note: 'Shipped via FedEx' },
        { status: 'delivered', timestamp: daysAgo(10), note: 'Left at front door' },
      ],
    },
    // Mike's in-transit order
    {
      orderNumber: 'ORD-CS-000002',
      user: u['mike.chen@gmail.com']._id,
      items: [
        { product: p['DEF-ELEC-003']._id, name: 'Smart Watch Series X', sku: 'DEF-ELEC-003', quantity: 1, price: 399.99, currency: 'USD', image: '/uploads/products/smartwatch-1.jpg' },
      ],
      subtotal: 399.99, tax: 32.00, shippingFee: 9.99, discount: 0, total: 441.98, currency: 'USD',
      paymentMethod: 'card', paymentStatus: 'completed',
      fulfillmentType: 'delivery',
      deliveryAddress: { street: '123 Maple Dr', city: 'Seattle', state: 'WA', country: 'US', postalCode: '98101' },
      status: 'shipped',
      trackingNumber: 'TRK1234567890',
      estimatedDelivery: daysFromNow(3),
      tenant: 'default',
      statusHistory: [
        { status: 'pending', timestamp: daysAgo(3) },
        { status: 'confirmed', timestamp: daysAgo(3) },
        { status: 'processing', timestamp: daysAgo(2) },
        { status: 'shipped', timestamp: daysAgo(1), note: 'Shipped via UPS' },
      ],
    },
    // Emma's processing order
    {
      orderNumber: 'ORD-CS-000003',
      user: u['emma.davis@outlook.com']._id,
      items: [
        { product: p['DEF-HOME-001']._id, name: 'Ergonomic Office Chair', sku: 'DEF-HOME-001', quantity: 1, price: 449.99, currency: 'USD', image: '/uploads/products/chair-1.jpg' },
        { product: p['DEF-HLTH-001']._id, name: 'Vitamin C Serum', sku: 'DEF-HLTH-001', quantity: 3, price: 28.99, currency: 'USD', image: '/uploads/products/serum-1.jpg' },
      ],
      subtotal: 536.96, tax: 42.96, shippingFee: 0, discount: 53.70, total: 526.22, currency: 'USD',
      paymentMethod: 'card', paymentStatus: 'completed',
      fulfillmentType: 'delivery',
      deliveryAddress: { street: '321 Pine St', city: 'Denver', state: 'CO', country: 'US', postalCode: '80201' },
      status: 'processing',
      tenant: 'default',
      statusHistory: [
        { status: 'pending', timestamp: daysAgo(1) },
        { status: 'confirmed', timestamp: daysAgo(1) },
        { status: 'processing', timestamp: today },
      ],
    },
    // Sarah's second order (pickup)
    {
      orderNumber: 'ORD-CS-000004',
      user: u['sarah.johnson@gmail.com']._id,
      items: [
        { product: p['DEF-SPRT-001']._id, name: 'Yoga Mat Premium', sku: 'DEF-SPRT-001', quantity: 1, price: 44.99, currency: 'USD', image: '/uploads/products/yoga-mat-1.jpg' },
      ],
      subtotal: 44.99, tax: 3.60, shippingFee: 0, discount: 0, total: 48.59, currency: 'USD',
      paymentMethod: 'apple_pay', paymentStatus: 'completed',
      fulfillmentType: 'pickup',
      status: 'ready-for-pickup',
      tenant: 'default',
      statusHistory: [
        { status: 'pending', timestamp: daysAgo(2) },
        { status: 'confirmed', timestamp: daysAgo(2) },
        { status: 'ready-for-pickup', timestamp: daysAgo(1) },
      ],
    },
    // Pending order (James — unverified user)
    {
      orderNumber: 'ORD-CS-000005',
      user: u['james.wilson@yahoo.com']._id,
      items: [
        { product: p['DEF-BOOK-001']._id, name: 'JavaScript: The Definitive Guide', sku: 'DEF-BOOK-001', quantity: 1, price: 49.99, currency: 'USD', image: '/uploads/products/js-book-1.jpg' },
      ],
      subtotal: 49.99, tax: 4.00, shippingFee: 4.99, discount: 0, total: 58.98, currency: 'USD',
      paymentMethod: 'card', paymentStatus: 'pending',
      fulfillmentType: 'delivery',
      status: 'pending',
      tenant: 'default',
      statusHistory: [{ status: 'pending', timestamp: today }],
    },
    // Kevin's Acme order
    {
      orderNumber: 'ORD-AC-000001',
      user: u['kevin.patel@outlook.com']._id,
      items: [
        { product: p['ACM-TOOL-001']._id, name: '20V Cordless Impact Drill', sku: 'ACM-TOOL-001', quantity: 2, price: 129.99, currency: 'USD', image: '/uploads/products/drill-1.jpg' },
        { product: p['ACM-FAST-001']._id, name: 'Stainless Steel Bolt Assortment', sku: 'ACM-FAST-001', quantity: 1, price: 54.99, currency: 'USD', image: '/uploads/products/bolts-1.jpg' },
      ],
      subtotal: 314.97, tax: 25.20, shippingFee: 12.99, discount: 0, total: 353.16, currency: 'USD',
      paymentMethod: 'card', paymentStatus: 'completed',
      fulfillmentType: 'delivery',
      deliveryAddress: { street: '500 Elm St', city: 'Houston', state: 'TX', country: 'US', postalCode: '77001' },
      status: 'delivered',
      trackingNumber: 'TRK-ACM-00001',
      tenant: 'acme-corp',
      statusHistory: [
        { status: 'pending', timestamp: daysAgo(10) },
        { status: 'confirmed', timestamp: daysAgo(10) },
        { status: 'shipped', timestamp: daysAgo(8) },
        { status: 'delivered', timestamp: daysAgo(5) },
      ],
    },
    // David's Green Earth order
    {
      orderNumber: 'ORD-GE-000001',
      user: u['david.rivers@gmail.com']._id,
      items: [
        { product: p['GRN-ECO-001']._id, name: 'Bamboo Cutlery Travel Set', sku: 'GRN-ECO-001', quantity: 3, price: 18.99, currency: 'USD', image: '/uploads/products/bamboo-cutlery-1.jpg' },
        { product: p['GRN-ECO-002']._id, name: 'Beeswax Food Wraps (6-Pack)', sku: 'GRN-ECO-002', quantity: 1, price: 22.99, currency: 'USD', image: '/uploads/products/beeswax-wraps-1.jpg' },
        { product: p['GRN-GARD-001']._id, name: 'Organic Herb Seed Kit', sku: 'GRN-GARD-001', quantity: 1, price: 29.99, currency: 'USD', image: '/uploads/products/herb-kit-1.jpg' },
      ],
      subtotal: 109.95, tax: 8.80, shippingFee: 5.99, discount: 10.00, total: 114.74, currency: 'USD',
      paymentMethod: 'card', paymentStatus: 'completed',
      fulfillmentType: 'delivery',
      deliveryAddress: { street: '88 River Rd', city: 'Portland', state: 'OR', country: 'US', postalCode: '97202' },
      status: 'delivered',
      tenant: 'green-earth-assoc',
      statusHistory: [
        { status: 'pending', timestamp: daysAgo(20) },
        { status: 'confirmed', timestamp: daysAgo(20) },
        { status: 'shipped', timestamp: daysAgo(18) },
        { status: 'delivered', timestamp: daysAgo(15) },
      ],
    },
    // Maya's workshop ticket order
    {
      orderNumber: 'ORD-GE-000002',
      user: u['maya.flores@yahoo.com']._id,
      items: [
        { product: p['GRN-EVNT-001']._id, name: 'Composting Workshop Ticket', sku: 'GRN-EVNT-001', quantity: 2, price: 35.00, currency: 'USD', image: '/uploads/products/workshop-1.jpg' },
      ],
      subtotal: 70.00, tax: 0, shippingFee: 0, discount: 0, total: 70.00, currency: 'USD',
      paymentMethod: 'card', paymentStatus: 'completed',
      fulfillmentType: 'pickup',
      status: 'confirmed',
      tenant: 'green-earth-assoc',
      statusHistory: [
        { status: 'pending', timestamp: daysAgo(5) },
        { status: 'confirmed', timestamp: daysAgo(5), note: 'E-tickets sent via email' },
      ],
    },
  ]);
  console.log(`   ✅ ${orders.length} orders created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 8. CARTS (active shopping carts)
  // ════════════════════════════════════════════════════════════════════════
  console.log('🛒 Creating carts...');

  const carts = await Cart.insertMany([
    {
      user: u['sarah.johnson@gmail.com']._id,
      items: [
        { product: p['DEF-ELEC-002']._id, quantity: 1, price: 1099.99, currency: 'USD' },
        { product: p['DEF-HOME-002']._id, quantity: 2, price: 42.99, currency: 'USD' },
      ],
      tenant: 'default',
    },
    {
      user: u['mike.chen@gmail.com']._id,
      items: [
        { product: p['DEF-BOOK-001']._id, quantity: 1, price: 49.99, currency: 'USD' },
      ],
      tenant: 'default',
    },
    {
      user: u['kevin.patel@outlook.com']._id,
      items: [
        { product: p['ACM-SAFE-001']._id, quantity: 10, price: 24.99, currency: 'USD' },
        { product: p['ACM-SAFE-002']._id, quantity: 10, price: 12.99, currency: 'USD' },
      ],
      tenant: 'acme-corp',
    },
    {
      user: u['alex.storm@outlook.com']._id,
      items: [
        { product: p['GRN-ECO-001']._id, quantity: 1, price: 18.99, currency: 'USD' },
        { product: p['GRN-GARD-001']._id, quantity: 1, price: 29.99, currency: 'USD' },
      ],
      tenant: 'green-earth-assoc',
    },
  ]);
  console.log(`   ✅ ${carts.length} active carts created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 9. NEWSLETTER SUBSCRIBERS
  // ════════════════════════════════════════════════════════════════════════
  console.log('📧 Creating newsletter subscribers...');

  const newsletters = await Newsletter.insertMany([
    { email: 'sarah.johnson@gmail.com', subscribedAt: daysAgo(90), isActive: true },
    { email: 'mike.chen@gmail.com', subscribedAt: daysAgo(60), isActive: true },
    { email: 'emma.davis@outlook.com', subscribedAt: daysAgo(45), isActive: true },
    { email: 'kevin.patel@outlook.com', subscribedAt: daysAgo(30), isActive: true },
    { email: 'david.rivers@gmail.com', subscribedAt: daysAgo(120), isActive: true },
    { email: 'maya.flores@yahoo.com', subscribedAt: daysAgo(100), isActive: true },
    { email: 'newsletter-fan@example.com', subscribedAt: daysAgo(200), isActive: true },
    { email: 'unsubscribed@example.com', subscribedAt: daysAgo(150), unsubscribedAt: daysAgo(20), isActive: false },
  ]);
  console.log(`   ✅ ${newsletters.length} subscribers created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 10. CMS PAGES
  // ════════════════════════════════════════════════════════════════════════
  console.log('📄 Creating CMS pages...');

  const pages = await Page.insertMany([
    // Default tenant
    {
      tenant: 'default', slug: 'about', title: 'About ComSpace', published: true,
      body: `# About ComSpace\n\nComSpace is a next-generation multi-vendor marketplace connecting buyers with trusted sellers worldwide.\n\n## Our Mission\n\nTo democratize e-commerce by giving every business — from solo entrepreneurs to large corporations — the tools to reach customers globally.\n\n## Founded\n\n2024 in San Francisco, California.\n\n## Contact\n\n- Email: hello@comspace.io\n- Phone: +1-555-100-0001`,
    },
    {
      tenant: 'default', slug: 'faq', title: 'Frequently Asked Questions', published: true,
      body: `# FAQ\n\n## How do I create an account?\nClick "Register" in the top-right corner. Choose your account type (Individual, Business, or Association) and follow the steps.\n\n## What payment methods do you accept?\nWe accept Visa, Mastercard, American Express, Apple Pay, and Google Pay.\n\n## How can I track my order?\nGo to **My Orders** in your dashboard. Click on any order to see real-time tracking information.\n\n## What is your return policy?\nWe offer 30-day hassle-free returns on most items. See our Return Policy page for details.\n\n## How do I become a seller?\nRegister as a Business account to start selling on ComSpace. You'll get your own branded storefront.`,
    },
    {
      tenant: 'default', slug: 'shipping', title: 'Shipping & Delivery', published: true,
      body: `# Shipping & Delivery\n\n## Standard Shipping\n- **Delivery time:** 5-7 business days\n- **Cost:** Free on orders over $50, otherwise $4.99\n\n## Express Shipping\n- **Delivery time:** 2-3 business days\n- **Cost:** $12.99\n\n## International Shipping\n- **Delivery time:** 7-14 business days\n- **Cost:** Varies by destination\n\n## In-Store Pickup\nAvailable at select locations. Orders are usually ready within 2 hours.`,
    },
    // Acme Corp
    {
      tenant: 'acme-corp', slug: 'about', title: 'About Acme Corporation', published: true,
      body: `# About Acme Corporation\n\nAcme Corporation has been a trusted supplier of industrial equipment and safety gear since 1985.\n\n## What We Offer\n- Safety equipment & PPE\n- Power tools & accessories\n- Fasteners & hardware\n- Bulk ordering for businesses\n\n## Quality Promise\nAll products meet or exceed OSHA and ANSI standards.\n\n## Contact Sales\n- Email: sales@acme-corp.com\n- Phone: +1-555-200-0002`,
    },
    // Green Earth
    {
      tenant: 'green-earth-assoc', slug: 'about', title: 'About Green Earth Association', published: true,
      body: `# Green Earth Association\n\nWe are a community-driven non-profit dedicated to promoting sustainable living and environmental stewardship.\n\n## Our Mission\nTo inspire and equip communities to live sustainably through education, advocacy, and access to eco-friendly products.\n\n## What We Do\n- **Community Workshops:** Composting, gardening, zero-waste living\n- **Eco Store:** Curated sustainable products at fair prices\n- **Advocacy:** Local policy engagement for greener communities\n\n## Membership\nJoin 250+ members making a difference. Visit our Membership page to learn more.\n\n## Contact\n- Email: info@greenearth.org\n- Phone: +1-555-300-0003`,
    },
    {
      tenant: 'green-earth-assoc', slug: 'membership-info', title: 'Membership Information', published: true,
      body: `# Green Earth Membership\n\nBecome a member and join our movement for a sustainable future.\n\n## Benefits\n- 10% discount on all eco products\n- Free access to workshops and events\n- Monthly sustainability newsletter\n- Voting rights at annual meetings\n- Community garden plot access (Premium+)\n\n## Plans\n- **Seedling (Monthly):** $9.99/mo — Core benefits\n- **Sapling (Quarterly):** $24.99/quarter — Core + workshop priority\n- **Redwood (Yearly):** $89.99/year — All benefits + garden plot\n\nVisit our Membership page to sign up today!`,
    },
  ]);
  console.log(`   ✅ ${pages.length} CMS pages created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 11. MEMBERSHIP PLANS (Green Earth Association)
  // ════════════════════════════════════════════════════════════════════════
  console.log('🎫 Creating membership plans...');

  const plans = await MembershipPlan.insertMany([
    {
      name: 'Seedling',
      description: 'Perfect for getting started on your sustainability journey. Access to member discounts and the monthly newsletter.',
      amount: 9.99, currency: 'USD', interval: 'monthly',
      features: ['10% store discount', 'Monthly newsletter', 'Community forum access', 'Annual meeting voting rights'],
      isActive: true, tenant: 'green-earth-assoc',
    },
    {
      name: 'Sapling',
      description: 'Our most popular plan. Everything in Seedling plus priority workshop registration and seasonal seed kits.',
      amount: 24.99, currency: 'USD', interval: 'quarterly',
      features: ['All Seedling benefits', 'Priority workshop registration', 'Seasonal seed kit (4x/year)', 'Members-only events access', 'Partner business discounts'],
      isActive: true, maxMembers: 100, tenant: 'green-earth-assoc',
    },
    {
      name: 'Redwood',
      description: 'Our premium annual membership. All benefits plus a community garden plot, mentoring sessions, and exclusive merch.',
      amount: 89.99, currency: 'USD', interval: 'yearly',
      features: ['All Sapling benefits', 'Community garden plot', '1-on-1 sustainability mentoring', 'Exclusive member merchandise', 'Free workshop admission', 'Early access to new products'],
      isActive: true, maxMembers: 50, tenant: 'green-earth-assoc',
    },
  ]);

  const planMap = {};
  plans.forEach(pl => { planMap[pl.name] = pl; });
  console.log(`   ✅ ${plans.length} membership plans created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 12. MEMBERSHIPS
  // ════════════════════════════════════════════════════════════════════════
  console.log('🏅 Creating memberships...');

  const memberships = await Membership.insertMany([
    {
      user: u['david.rivers@gmail.com']._id,
      plan: planMap['Redwood']._id,
      status: 'active',
      memberNumber: 'MEM-GRE-A01001',
      joinDate: monthsAgo(8),
      expiryDate: monthsFromNow(4),
      autoRenew: true,
      lastPaymentDate: monthsAgo(8),
      nextDueDate: monthsFromNow(4),
      tenant: 'green-earth-assoc',
    },
    {
      user: u['maya.flores@yahoo.com']._id,
      plan: planMap['Sapling']._id,
      status: 'active',
      memberNumber: 'MEM-GRE-B02001',
      joinDate: monthsAgo(5),
      expiryDate: monthsFromNow(1),
      autoRenew: true,
      lastPaymentDate: monthsAgo(2),
      nextDueDate: monthsFromNow(1),
      tenant: 'green-earth-assoc',
    },
    {
      user: u['alex.storm@outlook.com']._id,
      plan: planMap['Seedling']._id,
      status: 'active',
      memberNumber: 'MEM-GRE-C03001',
      joinDate: monthsAgo(3),
      expiryDate: monthsFromNow(0),
      autoRenew: true,
      lastPaymentDate: monthsAgo(1),
      nextDueDate: daysFromNow(5),
      tenant: 'green-earth-assoc',
    },
    {
      user: u['chris.woods@gmail.com']._id,
      plan: planMap['Seedling']._id,
      status: 'lapsed',
      memberNumber: 'MEM-GRE-C04001',
      joinDate: monthsAgo(6),
      expiryDate: monthsAgo(1),
      autoRenew: false,
      lastPaymentDate: monthsAgo(2),
      nextDueDate: monthsAgo(1),
      tenant: 'green-earth-assoc',
    },
    {
      user: u['pat.meadow@gmail.com']._id,
      plan: planMap['Sapling']._id,
      status: 'pending',
      memberNumber: 'MEM-GRE-B05001',
      joinDate: today,
      autoRenew: true,
      tenant: 'green-earth-assoc',
    },
  ]);

  const memMap = {};
  memberships.forEach(m => { memMap[m.memberNumber] = m; });
  console.log(`   ✅ ${memberships.length} memberships created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 13. MEMBER DUES
  // ════════════════════════════════════════════════════════════════════════
  console.log('💰 Creating member dues records...');

  const dues = await MemberDues.insertMany([
    // David (Redwood — yearly) — 1 paid period
    {
      membership: memMap['MEM-GRE-A01001']._id,
      user: u['david.rivers@gmail.com']._id,
      plan: planMap['Redwood']._id,
      amount: 89.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(8), paidDate: monthsAgo(8),
      periodStart: monthsAgo(8), periodEnd: monthsFromNow(4),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    // Maya (Sapling — quarterly) — 2 paid periods
    {
      membership: memMap['MEM-GRE-B02001']._id,
      user: u['maya.flores@yahoo.com']._id,
      plan: planMap['Sapling']._id,
      amount: 24.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(5), paidDate: monthsAgo(5),
      periodStart: monthsAgo(5), periodEnd: monthsAgo(2),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-B02001']._id,
      user: u['maya.flores@yahoo.com']._id,
      plan: planMap['Sapling']._id,
      amount: 24.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(2), paidDate: monthsAgo(2),
      periodStart: monthsAgo(2), periodEnd: monthsFromNow(1),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    // Alex (Seedling — monthly) — 3 paid, 1 upcoming
    {
      membership: memMap['MEM-GRE-C03001']._id,
      user: u['alex.storm@outlook.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(3), paidDate: monthsAgo(3),
      periodStart: monthsAgo(3), periodEnd: monthsAgo(2),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-C03001']._id,
      user: u['alex.storm@outlook.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(2), paidDate: monthsAgo(2),
      periodStart: monthsAgo(2), periodEnd: monthsAgo(1),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-C03001']._id,
      user: u['alex.storm@outlook.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(1), paidDate: monthsAgo(1),
      periodStart: monthsAgo(1), periodEnd: today,
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-C03001']._id,
      user: u['alex.storm@outlook.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'pending',
      dueDate: daysFromNow(5),
      periodStart: today, periodEnd: monthsFromNow(1),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    // Chris (lapsed) — 4 paid, 2 overdue
    {
      membership: memMap['MEM-GRE-C04001']._id,
      user: u['chris.woods@gmail.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(6), paidDate: monthsAgo(6),
      periodStart: monthsAgo(6), periodEnd: monthsAgo(5),
      paymentMethod: 'manual',
      notes: 'Paid at community event',
      recordedBy: u['olivia.green@greenearth.org']._id,
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-C04001']._id,
      user: u['chris.woods@gmail.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(5), paidDate: monthsAgo(5),
      periodStart: monthsAgo(5), periodEnd: monthsAgo(4),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-C04001']._id,
      user: u['chris.woods@gmail.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(4), paidDate: monthsAgo(4),
      periodStart: monthsAgo(4), periodEnd: monthsAgo(3),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-C04001']._id,
      user: u['chris.woods@gmail.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'paid',
      dueDate: monthsAgo(3), paidDate: monthsAgo(3),
      periodStart: monthsAgo(3), periodEnd: monthsAgo(2),
      paymentMethod: 'stripe',
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-C04001']._id,
      user: u['chris.woods@gmail.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'overdue',
      dueDate: monthsAgo(2),
      periodStart: monthsAgo(2), periodEnd: monthsAgo(1),
      paymentMethod: 'stripe',
      notes: 'Payment failed — card expired',
      tenant: 'green-earth-assoc',
    },
    {
      membership: memMap['MEM-GRE-C04001']._id,
      user: u['chris.woods@gmail.com']._id,
      plan: planMap['Seedling']._id,
      amount: 9.99, currency: 'USD', status: 'overdue',
      dueDate: monthsAgo(1),
      periodStart: monthsAgo(1), periodEnd: today,
      paymentMethod: 'stripe',
      notes: 'Auto-renewal cancelled — membership lapsed',
      tenant: 'green-earth-assoc',
    },
  ]);
  console.log(`   ✅ ${dues.length} dues records created\n`);

  // ════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📊 Collection Summary:');
  console.log(`   White-Label Tenants .... ${await WhiteLabel.countDocuments()}`);
  console.log(`   Users .................. ${await User.countDocuments()}`);
  console.log(`   Categories ............. ${await Category.countDocuments()}`);
  console.log(`   Products ............... ${await Product.countDocuments()}`);
  console.log(`   Stores ................. ${await Store.countDocuments()}`);
  console.log(`   Reviews ................ ${await Review.countDocuments()}`);
  console.log(`   Orders ................. ${await Order.countDocuments()}`);
  console.log(`   Carts .................. ${await Cart.countDocuments()}`);
  console.log(`   Newsletter Subs ........ ${await Newsletter.countDocuments()}`);
  console.log(`   CMS Pages .............. ${await Page.countDocuments()}`);
  console.log(`   Membership Plans ....... ${await MembershipPlan.countDocuments()}`);
  console.log(`   Memberships ............ ${await Membership.countDocuments()}`);
  console.log(`   Member Dues ............ ${await MemberDues.countDocuments()}`);

  console.log('\n🏢 Tenants:');
  console.log('   ┌─────────────────────────┬──────────────────────┬─────────────┐');
  console.log('   │ Tenant                  │ Type                 │ Users       │');
  console.log('   ├─────────────────────────┼──────────────────────┼─────────────┤');
  console.log(`   │ ComSpace (default)      │ Marketplace          │ ${await User.countDocuments({ tenant: 'default' })} users    │`);
  console.log(`   │ Acme Corp (acme-corp)   │ Business             │ ${await User.countDocuments({ tenant: 'acme-corp' })} users    │`);
  console.log(`   │ Green Earth (green-...) │ Association          │ ${await User.countDocuments({ tenant: 'green-earth-assoc' })} users    │`);
  console.log('   └─────────────────────────┴──────────────────────┴─────────────┘');

  console.log('\n🔐 Login Credentials (all passwords: Password123!):');
  console.log('');
  console.log('   Platform Admins:');
  console.log('     • superadmin@comspace.io       (superadmin, default tenant)');
  console.log('     • admin@comspace.io            (admin, default tenant)');
  console.log('');
  console.log('   Individual Customers (default tenant):');
  console.log('     • sarah.johnson@gmail.com      (customer, 2 orders)');
  console.log('     • mike.chen@gmail.com          (customer, 1 order in transit)');
  console.log('     • emma.davis@outlook.com       (customer, 1 order processing)');
  console.log('     • james.wilson@yahoo.com       (customer, unverified)');
  console.log('');
  console.log('   Business — Acme Corp (acme-corp tenant):');
  console.log('     • robert.blake@acme-corp.com   (merchant/owner)');
  console.log('     • linda.torres@acme-corp.com   (admin)');
  console.log('     • kevin.patel@outlook.com      (customer, 1 order)');
  console.log('     • nancy.kim@gmail.com          (customer)');
  console.log('');
  console.log('   Association — Green Earth (green-earth-assoc tenant):');
  console.log('     • olivia.green@greenearth.org  (admin/founder)');
  console.log('     • david.rivers@gmail.com       (member, Redwood plan)');
  console.log('     • maya.flores@yahoo.com        (member, Sapling plan)');
  console.log('     • alex.storm@outlook.com       (member, Seedling plan)');
  console.log('     • chris.woods@gmail.com        (lapsed member)');
  console.log('     • pat.meadow@gmail.com         (pending member)');
  console.log('');
  console.log('✅ Happy testing!\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
