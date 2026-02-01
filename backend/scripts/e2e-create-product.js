const { execSync } = require('child_process');
const axios = require('axios');

async function run() {
  try {
    console.log('Seeding admins...');
    execSync('npm run seed:admins', { cwd: __dirname + '/../', stdio: 'inherit' });

    const loginBody = {
      email: process.env.E2E_ADMIN_EMAIL || 'admin1@comspace.local',
      password: process.env.E2E_ADMIN_PASSWORD || 'Admin1Pass!23',
    };

    console.log('Logging in as admin:', loginBody.email);
    const loginResp = await axios.post('http://localhost:5000/api/auth/login', loginBody, {
      headers: { 'X-Tenant-ID': process.env.E2E_TENANT || 'default' },
    });

    const token = loginResp.data?.data?.token;
    if (!token) {
      console.error('Login did not return token', loginResp.data);
      process.exit(1);
    }

    console.log('Creating product via API...');
    const product = {
      title: process.env.E2E_PRODUCT_TITLE || `E2E Product ${Date.now()}`,
      price: 19.99,
      description: 'Created by e2e helper script',
      sku: `e2e-${Date.now()}`,
      category: 'E2E',
      inventory: 100,
    };

    const createResp = await axios.post('http://localhost:5000/api/products', product, {
      headers: { Authorization: `Bearer ${token}`, 'X-Tenant-ID': process.env.E2E_TENANT || 'default' },
    });

    console.log('Product create response:', createResp.data);
  } catch (err) {
    console.error('E2E create product failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

if (require.main === module) run();
module.exports = { run };
