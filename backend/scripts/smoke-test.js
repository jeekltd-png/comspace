const http = require('http');

function get(path) {
  return new Promise((res, rej) => {
    http
      .get({ hostname: 'localhost', port: process.env.PORT || 5000, path }, (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => res({ status: r.statusCode, body: d }));
      })
      .on('error', rej);
  });
}

function post(path, body) {
  return new Promise((res, rej) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: 'localhost', port: process.env.PORT || 5000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => res({ status: r.statusCode, body: d }));
      }
    );
    req.on('error', rej);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('Health:', await get('/health'));

    const email = `smoke+${Date.now()}@example.com`;
    console.log('Register:', await post('/api/auth/register', { email, password: 'Password123!', firstName: 'Smoke', lastName: 'Test' }));

    console.log('Login:', await post('/api/auth/login', { email, password: 'Password123!' }));

    console.log('Products:', await get('/api/products'));

    console.log('White-label:', await get('/api/white-label'));
  } catch (err) {
    console.error('Smoke test error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();