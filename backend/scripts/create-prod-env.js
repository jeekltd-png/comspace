#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const examplePath = path.join(__dirname, '..', '.env.production.example');
const targetPath = path.join(__dirname, '..', '.env.production');

if (!fs.existsSync(examplePath)) {
  console.error('backend/.env.production.example not found.');
  process.exit(1);
}

if (fs.existsSync(targetPath)) {
  console.error('backend/.env.production already exists. Use --force to overwrite.');
  process.exit(2);
}

const content = fs.readFileSync(examplePath, 'utf8');
fs.writeFileSync(targetPath, content, { mode: 0o600 });
console.log('Created backend/.env.production from example — please edit and fill secrets.');
process.exit(0);
