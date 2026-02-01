const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comspace';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB, seeding demo tenant...');

  // Prefer compiled dist (when running node against build), fallback to src (ts-node)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const User = (function(){ try { return require('../dist/models/user.model').default; } catch(e){ return require('../src/models/user.model'); } })();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const WhiteLabel = (function(){ try { return require('../dist/models/white-label.model').default; } catch(e){ return require('../src/models/white-label.model'); } })();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Store = (function(){ try { return require('../dist/models/store.model').default; } catch(e){ return require('../src/models/store.model'); } })();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Category = (function(){ try { return require('../dist/models/category.model').default; } catch(e){ return require('../src/models/category.model'); } })();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Product = (function(){ try { return require('../dist/models/product.model').default; } catch(e){ return require('../src/models/product.model'); } })();

  const tenant = 'demo-company-2026';

  // 1) Create or update demo admin
  const adminEmail = 'demo-admin@demo.local';
  let admin = await User.findOne({ email: adminEmail, tenant });
  if (!admin) {
    const hashed = await bcrypt.hash('DemoPass!23', 10);
    admin = await User.create({ email: adminEmail, password: hashed, firstName: 'Demo', lastName: 'Admin', role: 'admin', tenant, isVerified: true });
    console.log('Created admin:', adminEmail);
  } else {
    admin.password = await bcrypt.hash('DemoPass!23', 10);
    admin.role = 'admin';
    admin.firstName = 'Demo';
    admin.lastName = 'Admin';
    admin.tenant = tenant;
    await admin.save({ validateBeforeSave: false });
    console.log('Updated admin:', adminEmail);
  }

  // 2) WhiteLabel config
  const wl = await WhiteLabel.findOne({ tenantId: tenant });
  const logoUrl = 'https://via.placeholder.com/240x80.png?text=Demo+Company+Logo';
  const heroUrl = 'https://via.placeholder.com/1200x400.png?text=Demo+Hero+Image';
  if (!wl) {
    await WhiteLabel.create({
      tenantId: tenant,
      name: 'Demo Company',
      domain: 'demo-company.local',
      branding: {
        logo: logoUrl,
        favicon: '',
        primaryColor: '#0EA5B7',
        secondaryColor: '#7C3AED',
        accentColor: '#F97316',
        fontFamily: 'Inter, sans-serif',
        assets: {
          logo: { url: logoUrl, storage: 'local', alt: 'Demo Company Logo' },
          heroImage: { url: heroUrl, storage: 'local', alt: 'Demo hero' }
        }
      },
      features: { delivery: true, pickup: true, reviews: true, wishlist: true },
      contact: { email: 'support@demo-company.local', phone: '+1000000000' },
    });
    console.log('Created white-label for tenant:', tenant);
  } else {
    wl.branding = wl.branding || {};
    wl.branding.assets = wl.branding.assets || {};
    wl.branding.assets.logo = { url: logoUrl, storage: 'local', alt: 'Demo Company Logo' };
    wl.branding.assets.heroImage = { url: heroUrl, storage: 'local', alt: 'Demo hero' };
    wl.contact = wl.contact || {};
    wl.contact.email = 'support@demo-company.local';
    wl.name = 'Demo Company';
    wl.domain = 'demo-company.local';
    wl.tenantId = tenant;
    await wl.save();
    console.log('Updated white-label for tenant:', tenant);
  }

  // 3) Store
  const storeCode = 'DEMOSTORE';
  let store = await Store.findOne({ code: storeCode, tenant });
  if (!store) {
    store = await Store.create({
      name: 'Demo Company Store',
      code: storeCode,
      address: { street: '1 Demo Lane', city: 'Demo City', state: 'ND', country: 'Demo Country', postalCode: '00000' },
      coordinates: { lat: 0, lng: 0 },
      phone: '+1000000000',
      email: 'store@demo-company.local',
      hours: [ { day: 'Mon', open: '09:00', close: '17:00', isClosed: false } ],
      tenant,
    });
    console.log('Created store:', storeCode);
  }

  // 4) Category
  let category = await Category.findOne({ slug: 'apparel', tenant });
  if (!category) {
    category = await Category.create({ name: 'Apparel', slug: 'apparel', description: 'Demo apparel', tenant });
    console.log('Created category: Apparel');
  }

  // 5) Products
  const productsToCreate = [
    {
      name: 'Demo T-Shirt',
      description: 'A comfy demo T-Shirt',
      shortDescription: 'Comfortable demo tee',
      sku: 'DEMO-TSHIRT-001',
      basePrice: 19.99,
      currency: 'USD',
      images: [{ url: 'https://via.placeholder.com/600x400.png?text=Demo+T-Shirt', alt: 'Demo T-Shirt', isPrimary: true }],
      stock: 100,
      tenant,
    },
    {
      name: 'Demo Hoodie',
      description: 'A warm demo hoodie',
      shortDescription: 'Warm demo hoodie',
      sku: 'DEMO-HOODIE-001',
      basePrice: 49.99,
      currency: 'USD',
      images: [{ url: 'https://via.placeholder.com/600x400.png?text=Demo+Hoodie', alt: 'Demo Hoodie', isPrimary: true }],
      stock: 50,
      tenant,
    }
  ];

  for (const p of productsToCreate) {
    const exists = await Product.findOne({ sku: p.sku, tenant });
    if (exists) {
      console.log('Skipping existing product', p.sku);
      continue;
    }
    const created = await Product.create({ ...p, category: category._id, createdBy: admin._id });
    console.log('Created product', created.sku);

    // add inventory record to store
    store.inventory.push({ product: created._id, quantity: p.stock });
  }

  await store.save();
  console.log('Updated store inventory');

  console.log('\nDemo tenant seeding complete!');
  console.log('Tenant:', tenant);
  console.log('Admin login:', adminEmail, 'password: DemoPass!23');
  console.log('\nTo view branding in API:');
  console.log(`curl -H "X-Tenant-ID: ${tenant}" http://localhost:5000/api/white-label/config`);
  console.log('\nTo list products (API):');
  console.log(`curl -H "X-Tenant-ID: ${tenant}" http://localhost:5000/api/products`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});