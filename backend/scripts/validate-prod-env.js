#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.production if present (but don't require it — CI will use secrets)
const envPath = path.join(__dirname, '..', '.env.production');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Also load .env for local convenience
  const envLocal = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
}

const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error('Missing required production environment variables: ' + missing.join(', '));
  console.error('Please copy backend/.env.production.example -> backend/.env.production and set these values or set them in your CI secrets.');
  process.exit(1);
}

console.log('All required production environment variables are present.');
process.exit(0);
