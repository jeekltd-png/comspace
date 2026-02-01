#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nodeModules = path.join(root, 'node_modules');

if (!fs.existsSync(nodeModules)) {
  console.log('No node_modules directory found - nothing to scan');
  process.exit(0);
}

// Heuristics: look for files containing telltale words that indicate manual patches
const keywords = ['PATCH', 'patched', 'workaround', 'temporary', "Couldn't find next-intl config file", 'LOCAL EDIT'];

const results = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const p = path.join(dir, e);
    try {
      if (fs.statSync(p).isDirectory()) {
        scanDir(p);
      } else if (fs.statSync(p).isFile() && p.match(/\.(js|mjs|ts|json|md)$/)) {
        const content = fs.readFileSync(p, 'utf8');
        for (const k of keywords) {
          if (content.includes(k)) {
            results.push({ path: p, keyword: k });
            break;
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }
}

scanDir(nodeModules);

if (results.length === 0) {
  console.log('No suspicious patches found in node_modules (based on heuristic keywords).');
  process.exit(0);
}

console.log('Potential local edits found:');
for (const r of results) {
  console.log(` - ${r.path}  (keyword: ${r.keyword})`);
}
console.log('\nReview these files; if they contain local fixes, create an upstream PR or replace the workaround with configuration where possible.');
process.exit(1);
