const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function inspectVercelBundle() {
  console.log('=================================================================');
  console.log('🔍 INSPECTING DEPLOYED VERCEL PRODUCTION JS BUNDLE');
  console.log('=================================================================');

  const htmlRes = await fetchText('https://icw-by-suko.vercel.app');
  console.log('HTML Status:', htmlRes.statusCode);

  // Extract JS bundle filenames from HTML
  const matches = htmlRes.body.match(/\/static\/js\/main\.[a-f0-9]+\.js/g);
  if (!matches || matches.length === 0) {
    console.error('❌ Could not find main JS bundle path in HTML');
    return;
  }

  const bundlePath = matches[0];
  const bundleUrl = `https://icw-by-suko.vercel.app${bundlePath}`;
  console.log('Downloading deployed JS bundle:', bundleUrl);

  const bundleRes = await fetchText(bundleUrl);
  console.log(`Bundle Size: ${(bundleRes.body.length / 1024).toFixed(2)} KB`);

  // Inspect for backend URLs
  const hasRenderBackend = bundleRes.body.includes('icwbysukonew.onrender.com');
  const hasLocalhost = bundleRes.body.includes('localhost:5000') || bundleRes.body.includes('127.0.0.1:5000');
  const hasLanIp = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:5000/.test(bundleRes.body);

  console.log('\n--- BUNDLE AUDIT FINDINGS ---');
  console.log('1. Contains "https://icwbysukonew.onrender.com":', hasRenderBackend);
  console.log('2. Contains "localhost:5000" / "127.0.0.1":', hasLocalhost);
  console.log('3. Contains LAN IP address binding:', hasLanIp);

  // Look for other URLs in bundle
  const allUrls = [...bundleRes.body.matchAll(/https?:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?(?:\/[^\s"']*)?/g)]
    .map(m => m[0])
    .filter(u => u.includes('render.com') || u.includes('localhost') || u.includes('vercel.app'));

  console.log('\nTarget URLs found in compiled production JS bundle:');
  [...new Set(allUrls)].forEach(u => console.log('  -', u));

  console.log('=================================================================');
}

inspectVercelBundle().catch(err => console.error('Bundle inspection error:', err));
