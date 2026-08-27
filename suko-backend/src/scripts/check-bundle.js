const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`  Redirect: ${url} -> ${res.headers.location}`);
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

async function check() {
  console.log('=== Checking icwbysukonew.vercel.app ===');
  try {
    const r1 = await fetchText('https://icwbysukonew.vercel.app');
    console.log('Status:', r1.statusCode);
    const jsMatch = r1.body.match(/src="\/static\/js\/(main\.[a-f0-9]+\.js)"/);
    if (jsMatch) {
      console.log('Bundle file:', jsMatch[1]);
      const bundle = await fetchText('https://icwbysukonew.vercel.app/static/js/' + jsMatch[1]);
      const lc = (bundle.body.match(/localhost/g) || []).length;
      const rc = (bundle.body.match(/icwbysukonew\.onrender\.com/g) || []).length;
      console.log('localhost count:', lc);
      console.log('Render URL count:', rc);
      const ctx = bundle.body.match(/.{0,60}localhost.{0,60}/g);
      if (ctx) ctx.forEach((m, i) => console.log(`  ctx${i+1}: ...${m}...`));
    }
  } catch(e) { console.log('Error:', e.message); }

  console.log('\n=== Checking www.indiancorporatewear.com ===');
  try {
    const r2 = await fetchText('https://www.indiancorporatewear.com');
    console.log('Status:', r2.statusCode);
    console.log('Body length:', r2.body.length);
    console.log('First 200 chars:', r2.body.substring(0, 200));
  } catch(e) { console.log('Error:', e.message); }

  console.log('\n=== Checking Render CORS for icwbysukonew.vercel.app ===');
  try {
    const r3 = await fetchText('https://icwbysukonew.onrender.com/api/products');
    console.log('Products API Status:', r3.statusCode);
    const parsed = JSON.parse(r3.body);
    console.log('Products count:', Array.isArray(parsed) ? parsed.length : 'not array');
  } catch(e) { console.log('Error:', e.message); }
}

check();
