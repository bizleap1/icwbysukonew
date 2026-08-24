const https = require('https');

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function verifyHostedStaging() {
  console.log('=================================================================');
  console.log('🌐 STARTING REAL HOSTED STAGING VERIFICATION PASS');
  console.log('=================================================================');

  // 1. Backend /health on Render
  const health = await fetchUrl('https://icwbysukonew.onrender.com/health');
  console.log('\n1. Backend /health:');
  console.log(`   - HTTP Status: ${health.statusCode}`);
  console.log(`   - Response: ${health.body.trim()}`);
  console.log(`   - Server Ingress: ${health.headers['x-render-origin-server'] || health.headers['server']}`);

  // 2. Neon Database Queries via Render API
  const products = await fetchUrl('https://icwbysukonew.onrender.com/api/products');
  console.log('\n2. Neon PostgreSQL via Render (/api/products):');
  console.log(`   - HTTP Status: ${products.statusCode}`);
  try {
    const json = JSON.parse(products.body);
    const list = Array.isArray(json) ? json : (json.products || []);
    console.log(`   - Live Neon Product Count: ${list.length}`);
    if (list.length > 0) {
      console.log(`   - First Product Name: "${list[0].name}"`);
      console.log(`   - First Product Stock: ${list[0].stock}`);
    }
  } catch(e) {
    console.log(`   - Raw Body: ${products.body.substring(0, 150)}`);
  }

  // 3. Hosted CORS Whitelist Check (Vercel Origin)
  const approvedCors = await fetchUrl('https://icwbysukonew.onrender.com/api/products', {
    method: 'GET',
    headers: { 'Origin': 'https://icw-by-suko.vercel.app' }
  });
  console.log('\n3. Hosted CORS Allowlist (https://icw-by-suko.vercel.app):');
  console.log(`   - HTTP Status: ${approvedCors.statusCode}`);
  console.log(`   - Access-Control-Allow-Origin: ${approvedCors.headers['access-control-allow-origin']}`);

  // 4. Hosted CORS Block Check (Unapproved Origin)
  const blockedCors = await fetchUrl('https://icwbysukonew.onrender.com/api/products', {
    method: 'GET',
    headers: { 'Origin': 'https://unauthorized-attacker.com' }
  });
  console.log('\n4. Hosted CORS Rejection (https://unauthorized-attacker.com):');
  console.log(`   - HTTP Status: ${blockedCors.statusCode}`);

  // 5. Vercel Frontend Storefront
  const frontend = await fetchUrl('https://icw-by-suko.vercel.app');
  console.log('\n5. Vercel Frontend Storefront (https://icw-by-suko.vercel.app):');
  console.log(`   - HTTP Status: ${frontend.statusCode}`);
  console.log(`   - Vercel Edge Server: ${frontend.headers['server']}`);
  console.log(`   - Vercel Ray ID: ${frontend.headers['x-vercel-id']}`);

  console.log('\n=================================================================');
  console.log('🏁 INITIAL HOSTED STAGING VERIFICATION PASS COMPLETED');
  console.log('=================================================================');
}

verifyHostedStaging().catch(err => console.error('Verification failure:', err));
