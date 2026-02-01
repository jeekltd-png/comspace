#!/usr/bin/env node
const axios = require('axios');
const url = process.argv[2] || process.env.STAGING_URL;
if (!url) {
  console.error('Usage: node scripts/smoke-health.js <BASE_URL> (or set STAGING_URL env)');
  process.exit(2);
}
(async () => {
  try {
    const resp = await axios.get(`${url.replace(/\/$/, '')}/health`, { timeout: 10000 });
    if (resp.status !== 200) throw new Error('Non-200 status: ' + resp.status);
    const data = resp.data;
    if (!data || data.status !== 'healthy') throw new Error('Health check response not healthy: ' + JSON.stringify(data));
    console.log('Health check OK:', data);
    process.exit(0);
  } catch (err) {
    console.error('Health check failed:', err.message);
    process.exit(1);
  }
})();