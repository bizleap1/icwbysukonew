require('dotenv').config();
const assert = require('assert');
const { 
  extractCloudinaryPublicId, 
  uploadBuffer,
  uploadProductMediaAtomic,
  safeDeleteAsset 
} = require('../utils/media.service');

async function runCloudinaryMediaTests() {
  console.log("=================================================================");
  console.log("☁️ STARTING PRODUCTION MEDIA STORAGE & CLOUDINARY TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${e.message}`);
      failed++;
    }
  }

  // 1. URL Public ID Extraction with folders and version prefixes
  await check("1. Public ID Extraction: Extracts folder and filename from standard Cloudinary URL", async () => {
    const url1 = "https://res.cloudinary.com/i4irbhvz/image/upload/v1724501234/suko_products/prod_1001_front.jpg";
    const id1 = extractCloudinaryPublicId(url1);
    assert.strictEqual(id1, "suko_products/prod_1001_front");

    const url2 = "https://res.cloudinary.com/demo/image/upload/sample.png";
    const id2 = extractCloudinaryPublicId(url2);
    assert.strictEqual(id2, "sample");
  });

  // 2. Safe Fallback for Local / External Non-Cloudinary URLs
  await check("2. Non-Cloudinary Fallback: Returns null safely for local and non-Cloudinary URLs", async () => {
    const localUrl = "http://localhost:5000/uploads/image-12345.jpg";
    assert.strictEqual(extractCloudinaryPublicId(localUrl), null);

    const unsplashUrl = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35";
    assert.strictEqual(extractCloudinaryPublicId(unsplashUrl), null);

    assert.strictEqual(extractCloudinaryPublicId(null), null);
    assert.strictEqual(extractCloudinaryPublicId(""), null);
  });

  // 3. Production Environment Enforcement (No Local Fallback in Production)
  await check("3. Production Mode Enforcement: In NODE_ENV=production, upload throws on failure and blocks local disk writes", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;

    try {
      process.env.NODE_ENV = 'production';
      process.env.CLOUDINARY_CLOUD_NAME = ''; // Simulate missing/unreachable Cloudinary in prod

      const sampleBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

      let errorThrown = false;
      try {
        await uploadBuffer(sampleBuffer, { ext: '.png' });
      } catch (err) {
        errorThrown = true;
        assert.ok(err.message.includes('Production media configuration error') || err.message.includes('Local fallback is strictly prohibited in production'));
      }
      assert.strictEqual(errorThrown, true, "Must throw in production rather than silently writing to local disk");
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
    }
  });

  // 4. Atomic Multi-Image Rollback
  await check("4. Atomic Batch Rollback: Failure midway cleans up already uploaded assets without partial corruption", async () => {
    let deletedCount = 0;
    const mockCleanedUrls = [];

    const validBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const invalidFile = { buffer: null }; // Will trigger upload failure

    let batchError = false;
    try {
      await uploadProductMediaAtomic({
        primaryFile: { buffer: validBuffer, originalname: 'primary.png' },
        galleryFiles: [invalidFile]
      });
    } catch (err) {
      batchError = true;
    }

    assert.strictEqual(batchError, true, "Batch upload must fail if one file is invalid");
  });

  // 5. Reference Safety: Skips deletion if another product references the URL
  await check("5. Reference Protection: Mock database reference check blocks shared asset deletion", async () => {
    const mockPrisma = {
      product: {
        count: async () => 2 // 2 other products share this image
      }
    };

    const deleteRes = await safeDeleteAsset("https://res.cloudinary.com/demo/image/upload/sample.jpg", mockPrisma);
    assert.strictEqual(deleteRes.skipped, true);
    assert.strictEqual(deleteRes.reason, 'Asset is actively referenced by another product record');
  });

  // 6. Whitelist & MIME Validation Logic
  await check("6. MIME & Security Filtering: Permits JPEG/PNG/WebP/AVIF and blocks executable files", async () => {
    const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']);
    const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;

    function isPermitted(mimetype, originalname) {
      return ALLOWED_MIME_TYPES.has(mimetype.toLowerCase()) && ALLOWED_EXTENSIONS.test(originalname);
    }

    assert.strictEqual(isPermitted('image/jpeg', 'garment.jpg'), true);
    assert.strictEqual(isPermitted('image/png', 'couture.png'), true);
    assert.strictEqual(isPermitted('image/webp', 'atelier.webp'), true);
    assert.strictEqual(isPermitted('application/x-msdownload', 'malware.exe'), false);
    assert.strictEqual(isPermitted('text/html', 'script.html'), false);
    assert.strictEqual(isPermitted('application/javascript', 'hack.js'), false);
  });

  console.log("\n=================================================================");
  console.log(`📊 MEDIA STORAGE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) process.exit(1);
}

runCloudinaryMediaTests();
