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

async function verifyHostedAuth() {
  console.log('=================================================================');
  console.log('🔐 HOSTED AUTHENTICATION & API SECURITY CHECK');
  console.log('=================================================================');

  // Test 1: Invalid login payload rejection
  const invalidLogin = await fetchUrl('https://icwbysukonew.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://icw-by-suko.vercel.app'
    },
    body: JSON.stringify({ email: 'nonexistent_test_user_xyz@suko.com', password: 'WrongPassword123!' })
  });
  console.log('1. Invalid credentials rejection on hosted backend:');
  console.log(`   - HTTP Status: ${invalidLogin.statusCode}`);
  console.log(`   - Error message returned: ${invalidLogin.body.trim()}`);

  // Test 2: Unauthenticated Admin API Access Block
  const adminBlock = await fetchUrl('https://icwbysukonew.onrender.com/api/admin/orders', {
    method: 'GET',
    headers: { 'Origin': 'https://icw-by-suko.vercel.app' }
  });
  console.log('\n2. Unauthenticated Admin API Access Block:');
  console.log(`   - HTTP Status: ${adminBlock.statusCode}`);
  console.log(`   - Response: ${adminBlock.body.trim()}`);

  // Test 3: Rate Limiting Enforcement on Hosted Auth
  console.log('\n3. Testing Auth Rate Limiter on Render Ingress:');
  let blocked = false;
  for (let i = 0; i < 7; i++) {
    const attempt = await fetchUrl('https://icwbysukonew.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://icw-by-suko.vercel.app'
      },
      body: JSON.stringify({ email: 'rate_test@suko.com', password: 'InvalidPassword!' })
    });
    if (attempt.statusCode === 429) {
      blocked = true;
      console.log(`   - Attempt #${i + 1} blocked by Rate Limiter: HTTP ${attempt.statusCode}`);
      break;
    }
  }
  if (!blocked) {
    console.log('   - Rate limiter within standard threshold.');
  }

  console.log('\n=================================================================');
}

verifyHostedAuth().catch(err => console.error('Auth verification error:', err));
