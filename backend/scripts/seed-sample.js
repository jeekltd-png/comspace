const mongoose = require('mongoose');
const path = require('path');

// Load the Product model
require(path.join(__dirname, '../dist/models/product.model.js'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comspace';

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  console.log('Connected to MongoDB, seeding sample data...');

  const userSchema = new mongoose.Schema({ email: String, password: String, firstName: String, lastName: String, role: String }, { timestamps: true });
  const categorySchema = new mongoose.Schema({ name: String }, { timestamps: true });

  const User = mongoose.model('UserSample', userSchema, 'users');
  const Category = mongoose.model('CategorySample', categorySchema, 'categories');
  
  // Use existing Product model from the app
  const Product = mongoose.model('Product');

  // Clean sample collections (non-destructive to other data)
  await User.deleteMany({ email: /@example.com$/ });
  await Product.deleteMany({ sku: /^SAMPLE-/ });
  await Category.deleteMany({ name: /Electronics/ });

  const user = await User.create({ email: 'owner@example.com', password: 'Password123!', firstName: 'Owner', lastName: 'Example', role: 'owner' });
  const cat = await Category.create({ name: 'Electronics', slug: 'electronics' });

  const products = [
    {
      name: 'Wireless Headphones',
      description: 'Premium wireless headphones with active noise cancellation. Experience crystal-clear audio and immersive sound quality.',
      shortDescription: 'Premium wireless headphones with ANC',
      sku: 'SAMPLE-HEAD-001',
      category: cat._id,
      basePrice: 199.99,
      currency: 'USD',
      prices: [{ currency: 'USD', amount: 199.99, updatedAt: new Date() }],
      images: [{ url: '/uploads/headphones.jpg', alt: 'Wireless Headphones', isPrimary: true }],
      stock: 50,
      lowStockThreshold: 10,
      isUnlimited: false,
      tags: ['electronics', 'audio', 'wireless'],
      rating: { average: 4.5, count: 128 },
      reviews: [],
      seo: { title: 'Wireless Headphones - Premium Audio', description: 'Shop premium wireless headphones', keywords: ['headphones', 'wireless', 'audio'] },
      tenant: 'default',
      isActive: true,
      isFeatured: true,
      isOnSale: false,
      badge: 'bestseller',
      isBestseller: true,
      createdBy: user._id
    },
    {
      name: 'Smart Watch Pro',
      description: 'Advanced smartwatch with health tracking, GPS, and long battery life. Stay connected and monitor your fitness goals.',
      shortDescription: 'Advanced smartwatch with health tracking',
      sku: 'SAMPLE-WATCH-002',
      category: cat._id,
      basePrice: 299.99,
      currency: 'USD',
      prices: [{ currency: 'USD', amount: 299.99, updatedAt: new Date() }],
      images: [{ url: '/uploads/smartwatch.jpg', alt: 'Smart Watch Pro', isPrimary: true }],
      stock: 8,
      lowStockThreshold: 5,
      isUnlimited: false,
      tags: ['electronics', 'wearable', 'fitness'],
      rating: { average: 4.7, count: 95 },
      reviews: [],
      seo: { title: 'Smart Watch Pro - Fitness Tracker', description: 'Advanced smartwatch for fitness enthusiasts', keywords: ['smartwatch', 'fitness', 'health'] },
      tenant: 'default',
      isActive: true,
      isFeatured: true,
      isOnSale: true,
      salePrice: 249.99,
      discount: 17,
      badge: 'hot',
      createdBy: user._id
    },
    {
      name: 'Laptop Stand Aluminum',
      description: 'Ergonomic aluminum laptop stand with adjustable height. Perfect for home office setup and improved posture.',
      shortDescription: 'Ergonomic aluminum laptop stand',
      sku: 'SAMPLE-STAND-003',
      category: cat._id,
      basePrice: 49.99,
      currency: 'USD',
      prices: [{ currency: 'USD', amount: 49.99, updatedAt: new Date() }],
      images: [{ url: '/uploads/laptop-stand.jpg', alt: 'Laptop Stand', isPrimary: true }],
      stock: 100,
      lowStockThreshold: 20,
      isUnlimited: false,
      tags: ['accessories', 'office', 'ergonomic'],
      rating: { average: 4.3, count: 67 },
      reviews: [],
      seo: { title: 'Aluminum Laptop Stand - Ergonomic Office', description: 'Adjustable laptop stand for better posture', keywords: ['laptop stand', 'ergonomic', 'office'] },
      tenant: 'default',
      isActive: true,
      isFeatured: false,
      isOnSale: false,
      createdBy: user._id
    },
    {
      name: 'USB-C Hub 7-in-1',
      description: 'Multi-port USB-C hub with HDMI, USB 3.0, SD card reader, and more. Expand your laptop connectivity.',
      shortDescription: 'Multi-port USB-C hub adapter',
      sku: 'SAMPLE-HUB-004',
      category: cat._id,
      basePrice: 39.99,
      currency: 'USD',
      prices: [{ currency: 'USD', amount: 39.99, updatedAt: new Date() }],
      images: [{ url: '/uploads/usb-hub.jpg', alt: 'USB-C Hub', isPrimary: true }],
      stock: 3,
      lowStockThreshold: 15,
      isUnlimited: false,
      tags: ['accessories', 'usb', 'connectivity'],
      rating: { average: 4.6, count: 112 },
      reviews: [],
      seo: { title: 'USB-C Hub 7-in-1 - Laptop Accessory', description: 'Expand your connectivity with multi-port hub', keywords: ['usb-c', 'hub', 'adapter'] },
      tenant: 'default',
      isActive: true,
      isFeatured: false,
      isOnSale: false,
      badge: 'limited',
      createdBy: user._id
    },
    {
      name: 'Mechanical Keyboard RGB',
      description: 'Premium mechanical gaming keyboard with RGB lighting and customizable switches. Enhance your typing experience.',
      shortDescription: 'Premium mechanical gaming keyboard',
      sku: 'SAMPLE-KEYB-005',
      category: cat._id,
      basePrice: 129.99,
      currency: 'USD',
      prices: [{ currency: 'USD', amount: 129.99, updatedAt: new Date() }],
      images: [{ url: '/uploads/keyboard.jpg', alt: 'Mechanical Keyboard', isPrimary: true }],
      stock: 40,
      lowStockThreshold: 8,
      isUnlimited: false,
      tags: ['electronics', 'gaming', 'keyboard'],
      rating: { average: 4.8, count: 203 },
      reviews: [],
      seo: { title: 'Mechanical Keyboard RGB - Gaming Keyboard', description: 'Premium mechanical keyboard for gamers', keywords: ['mechanical keyboard', 'rgb', 'gaming'] },
      tenant: 'default',
      isActive: true,
      isFeatured: true,
      isOnSale: false,
      badge: 'new',
      isNew: true,
      createdBy: user._id
    }
  ];

  await Product.insertMany(products);

  console.log('Seed complete. Example sign-in: owner@example.com / Password123!');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('Seeding failed', err);
  process.exit(1);
});