#!/usr/bin/env node

/**
 * Database Initialization Script
 * Creates initial admin user and sample data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comspace';

// Define schemas (simplified versions)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  role: { type: String, enum: ['customer', 'admin', 'merchant'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  stock: { type: Number, default: 0 },
  images: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

async function initDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB!\n');

    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('⚠️  Database already initialized. Skipping...');
      process.exit(0);
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const admin = await User.create({
      email: 'admin@comspace.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
    console.log('✅ Admin user created:', admin.email);
    console.log('   Password: Admin@123\n');

    // Create sample customer
    console.log('👤 Creating sample customer...');
    const customerPassword = await bcrypt.hash('Customer@123', 10);
    const customer = await User.create({
      email: 'customer@example.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
    });
    console.log('✅ Customer created:', customer.email);
    console.log('   Password: Customer@123\n');

    // Create categories
    console.log('📂 Creating categories...');
    const categories = await Category.insertMany([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Clothing, shoes, and accessories',
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home decor and garden supplies',
      },
      {
        name: 'Books',
        slug: 'books',
        description: 'Books and educational materials',
      },
      {
        name: 'Sports',
        slug: 'sports',
        description: 'Sports equipment and apparel',
      },
    ]);
    console.log(`✅ Created ${categories.length} categories\n`);

    // Create sample products
    console.log('🛍️  Creating sample products...');
    const electronicsCategory = categories[0];
    const fashionCategory = categories[1];

    const products = await Product.insertMany([
      {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 79.99,
        category: electronicsCategory._id,
        stock: 50,
        images: ['https://via.placeholder.com/300'],
      },
      {
        name: 'Smartphone',
        slug: 'smartphone',
        description: 'Latest model smartphone with advanced features',
        price: 599.99,
        category: electronicsCategory._id,
        stock: 30,
        images: ['https://via.placeholder.com/300'],
      },
      {
        name: 'Cotton T-Shirt',
        slug: 'cotton-t-shirt',
        description: 'Comfortable cotton t-shirt in various colors',
        price: 19.99,
        category: fashionCategory._id,
        stock: 100,
        images: ['https://via.placeholder.com/300'],
      },
      {
        name: 'Denim Jeans',
        slug: 'denim-jeans',
        description: 'Classic denim jeans for everyday wear',
        price: 49.99,
        category: fashionCategory._id,
        stock: 75,
        images: ['https://via.placeholder.com/300'],
      },
      {
        name: 'Laptop Backpack',
        slug: 'laptop-backpack',
        description: 'Durable backpack with laptop compartment',
        price: 39.99,
        category: fashionCategory._id,
        stock: 60,
        images: ['https://via.placeholder.com/300'],
      },
    ]);
    console.log(`✅ Created ${products.length} products\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 Database initialization complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Categories: ${await Category.countDocuments()}`);
    console.log(`   - Products: ${await Product.countDocuments()}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@comspace.com');
    console.log('     Password: Admin@123');
    console.log('\n   Customer:');
    console.log('     Email: customer@example.com');
    console.log('     Password: Customer@123');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Start the frontend: cd ../frontend && npm run dev');
    console.log('   3. Visit: http://localhost:3000');
    console.log('   4. Login with credentials above');
    console.log('\n✅ Happy coding!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run initialization
initDatabase();
