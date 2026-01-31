const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../dist/models/user.model').default || require('../src/models/user.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comspace';

async function run() {
  await mongoose.connect(MONGODB_URI);

  console.log('Connected to MongoDB, seeding demo accounts...');

  const users = [
    {
      email: 'admin@local.test',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'Local',
      role: 'admin',
      tenant: 'default',
    },
    {
      email: 'merchant@acme.test',
      password: 'Password123!',
      firstName: 'Acme',
      lastName: 'Merchant',
      role: 'merchant',
      tenant: 'acme',
    },
    {
      email: 'user@acme.test',
      password: 'Password123!',
      firstName: 'Acme',
      lastName: 'User',
      role: 'customer',
      tenant: 'acme',
    },
  ];

  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log('Skipping existing user', u.email);
      continue;
    }

    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password: hashed });
    console.log('Created demo user', u.email);
  }

  console.log('Demo seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});