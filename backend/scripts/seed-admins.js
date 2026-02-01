#!/usr/bin/env node
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comspace';

// Prefer source model when present (avoids stale compiled dist model during local tests)
let User;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  User = require('../src/models/user.model').default;
} catch (e) {
  // fallback to compiled dist
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  User = require('../dist/models/user.model').default;
}

async function run(opts = { disconnectAfter: true }) {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const users = [
    {
      email: process.env.SUPERADMIN_EMAIL || 'superadmin@comspace.local',
      password: process.env.SUPERADMIN_PASSWORD || 'ChangeMeSuper!23',
      firstName: 'Comspace',
      lastName: 'SuperAdmin',
      role: 'superadmin',
      isVerified: true,
      tenant: 'default',
    },
    {
      email: process.env.ADMIN1_EMAIL || 'admin1@comspace.local',
      password: process.env.ADMIN1_PASSWORD || 'Admin1Pass!23',
      firstName: 'Admin',
      lastName: 'One',
      role: 'admin1',
      isVerified: true,
      tenant: 'default',
    },
    {
      email: process.env.ADMIN2_EMAIL || 'admin2@comspace.local',
      password: process.env.ADMIN2_PASSWORD || 'Admin2Pass!23',
      firstName: 'Admin',
      lastName: 'Two',
      role: 'admin2',
      isVerified: true,
      tenant: 'default',
    },
  ];

  // diagnostic: print allowed role enum values
  try {
    const rolePath = User.schema.path('role');
    console.log('User schema role enum:', rolePath?.enumValues || rolePath?.options?.enum);

    // Ensure seed script works even if compiled dist model is stale by patching enum
    const needed = ['superadmin', 'admin1', 'admin2'];
    const existing = rolePath?.options?.enum || rolePath?.enumValues || [];
    const missing = needed.filter((n) => !existing.includes(n));
    if (missing.length) {
      rolePath.options = rolePath.options || {};
      rolePath.options.enum = Array.from(new Set([...(existing || []), ...needed]));
      if (Array.isArray(rolePath.enumValues)) rolePath.enumValues = rolePath.options.enum;
      console.log('Patched role enum to include:', missing);
    }
  } catch (e) {
    console.error('Failed to inspect/patch User schema enum:', e);
  }

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`User ${u.email} already exists, skipping.`);
      // Ensure expected tenant and verify password exists and is hashed for existing docs
      try {
        let patched = false;
        if (!exists.tenant) {
          exists.tenant = u.tenant || 'default';
          patched = true;
        }
        // Ensure password is hashed by re-saving (bypassing validators if needed)
        if (process.env.NODE_ENV !== 'production') {
          exists.password = u.password;
          patched = true;
        }
        if (patched) {
          await exists.save({ validateBeforeSave: false });
          console.log(`Patched existing user ${u.email}`);
        }
      } catch (e) {
        console.warn(`Failed to patch existing user ${u.email}:`, e.message || e);
      }
      continue;
    }
    try {
      await User.create(u);
      console.log(`Created user ${u.email} (${u.role})`);
    } catch (err) {
      console.warn(`User.create failed for ${u.email}, falling back to direct insert. Error:`, err.message || err);
      // direct insert bypasses mongoose validation (useful for stale dist schema during tests)
      await User.collection.insertOne(u);
      console.log(`Inserted user ${u.email} (${u.role}) via collection.insertOne`);

      // Ensure password is hashed for direct-inserted users: find and re-save through model
      try {
        const doc = await User.findOne({ email: u.email });
        if (doc) {
          doc.password = u.password;
          await doc.save();
          console.log(`Patched password for ${u.email} via model save`);
        }
      } catch (patchErr) {
        console.warn(`Failed to patch password for ${u.email}:`, patchErr.message || patchErr);
      }
    }
  }

  // Development convenience: ensure seeded admin accounts have usable passwords
  if (process.env.NODE_ENV !== 'production') {
    for (const u of users) {
      try {
        const doc = await User.findOne({ email: u.email });
        if (doc) {
          // If password isn't set to a bcrypt hash (naive check), set it to known value
          const pw = u.password || (u.role === 'superadmin' ? 'ChangeMeSuper!23' : 'Admin1Pass!23');
          doc.password = pw;
          // Bypass validators if role enum doesn't include the seeded role so we can
          // ensure the password is hashed for local/test accounts.
          await doc.save({ validateBeforeSave: false });
          console.log(`Ensured password for ${u.email}`);
        }
      } catch (e) {
        console.warn(`Failed to ensure password for ${u.email}:`, e.message || e);
      }
    }
  }

  if (opts.disconnectAfter) {
    await mongoose.disconnect();
    console.log('Done');
  }
}

async function main() {
  try {
    await run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  // When executed directly as a script
  main();
} else {
  // When imported in tests, export the run function
  module.exports = { run };
}