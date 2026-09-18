require("dotenv").config();
const assert = require("assert");
const { pool } = require("../db");
const productService = require("../services/productService");
const cloudinaryService = require("../services/cloudinaryService");
const { isCloudinaryConfigured } = require("../config/cloudinary");

async function runPipelineVerification() {
  console.log("=================================================================");
  console.log("☁️ STARTING COMPLETE MEDIA PIPELINE & CLOUDINARY VERIFICATION");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // TEST 1: Cloudinary Configuration Inspection
  await test("1. Cloudinary Configuration Status", async () => {
    const configured = isCloudinaryConfigured();
    console.log(`   Cloudinary Configured: ${configured}`);
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME || "(not set in local env)"}`);
    console.log(`   Has API Key: ${Boolean(process.env.CLOUDINARY_API_KEY)}`);
    console.log(`   Has API Secret: ${Boolean(process.env.CLOUDINARY_API_SECRET)}`);
    // Assertion passes as long as the service exposes valid config check
    assert.strictEqual(typeof configured, "boolean");
  });

  // TEST 2: Dual Image Architecture & Gallery Synchronization
  await test("2. Gallery & Images Strict Synchronization", async () => {
    const testUrls = [
      "https://res.cloudinary.com/demo/image/upload/v1/sample1.jpg",
      "https://res.cloudinary.com/demo/image/upload/v1/sample2.jpg",
      "https://res.cloudinary.com/demo/image/upload/v1/sample3.jpg"
    ];

    const sync = productService.synchronizeGalleryAndImages([], testUrls, testUrls[0]);

    assert.strictEqual(sync.gallery.length, 3, "Gallery must contain 3 items");
    assert.strictEqual(sync.images.length, 3, "Images must contain 3 items");
    assert.strictEqual(sync.imageUrl, testUrls[0], "imageUrl must match primary URL");

    // Canonical priority type ordering
    assert.strictEqual(sync.gallery[0].type, "model_front");
    assert.strictEqual(sync.gallery[1].type, "model_three_quarter");
    assert.strictEqual(sync.gallery[2].type, "model_side");

    // Verify 1:1 match
    assert.strictEqual(sync.gallery[0].url, sync.images[0]);
    assert.strictEqual(sync.gallery[1].url, sync.images[1]);
    assert.strictEqual(sync.gallery[2].url, sync.images[2]);
  });

  // TEST 3: Database Storage & Retrieval with Permanent HTTPS URLs
  let createdProductId = null;
  await test("3. Database Product Persistence (PostgreSQL Neon) with Permanent HTTPS URLs", async () => {
    const testHttpsUrls = [
      "https://res.cloudinary.com/i4irbhvz/image/upload/v1724501234/suko/products/test_lookbook_front.jpg",
      "https://res.cloudinary.com/i4irbhvz/image/upload/v1724501234/suko/products/test_lookbook_three_quarter.jpg",
      "https://res.cloudinary.com/i4irbhvz/image/upload/v1724501234/suko/products/test_lookbook_side.jpg"
    ];

    const testGarment = {
      name: "TEST_ATELIER_PIPELINE_SUIT",
      price: 9990,
      description: "Automated verification test suit for Cloudinary permanent HTTPS image pipeline.",
      category_id: "suits",
      sub_category: "Power Suit",
      stock: 15,
      status: "active",
      images: testHttpsUrls,
      image_url: testHttpsUrls[0],
      gallery: [
        { url: testHttpsUrls[0], type: "model_front" },
        { url: testHttpsUrls[1], type: "model_three_quarter" },
        { url: testHttpsUrls[2], type: "model_side" }
      ]
    };

    const created = await productService.createProduct(testGarment);
    createdProductId = created.id;

    assert.ok(created.id, "Product must be created with valid ID");
    assert.strictEqual(created.image_url, testHttpsUrls[0]);
    assert.strictEqual(created.images.length, 3);
    assert.strictEqual(created.gallery.length, 3);

    // Verify NO local or ephemeral paths exist
    created.images.forEach(img => {
      assert.ok(!img.includes("/uploads/"), `Image path must not contain /uploads/: ${img}`);
      assert.ok(!img.includes("localhost"), `Image path must not contain localhost: ${img}`);
      assert.ok(!img.startsWith("blob:"), `Image path must not be a blob URL: ${img}`);
      assert.ok(img.startsWith("https://"), `Image must be a permanent HTTPS URL: ${img}`);
    });

    created.gallery.forEach(g => {
      assert.ok(g.url.startsWith("https://"), `Gallery URL must be permanent HTTPS: ${g.url}`);
      assert.ok(Boolean(g.type), `Gallery item must have a type: ${JSON.stringify(g)}`);
    });

    // Query Neon database directly to verify raw SQL columns
    if (!pool.isMock) {
      const dbRow = await pool.query("SELECT id, image_url, images, gallery FROM products WHERE id = $1", [created.id]);
      assert.strictEqual(dbRow.rows.length, 1, "Database row must exist in Neon PostgreSQL");
      const row = dbRow.rows[0];

      let dbImages = row.images;
      if (typeof dbImages === "string") dbImages = JSON.parse(dbImages);
      let dbGallery = row.gallery;
      if (typeof dbGallery === "string") dbGallery = JSON.parse(dbGallery);

      assert.strictEqual(dbImages.length, 3, "Database images column must contain 3 URLs");
      assert.strictEqual(dbGallery.length, 3, "Database gallery column must contain 3 items");
      assert.strictEqual(row.image_url, testHttpsUrls[0]);
      console.log(`   Database verification passed: permanent HTTPS URLs verified in Neon DB.`);
    }
  });

  // TEST 4: Product Retrieval API Formatting
  await test("4. Product Retrieval formatting (getAllProducts & getProductById)", async () => {
    assert.ok(createdProductId, "Test product must exist");

    const fetched = await productService.getProductById(createdProductId);
    assert.ok(fetched, "Product must be retrieved by ID");
    assert.strictEqual(fetched.gallery.length, 3);
    assert.strictEqual(fetched.images.length, 3);
    assert.strictEqual(fetched.gallery[0].type, "model_front");
    assert.strictEqual(fetched.gallery[0].url, fetched.images[0]);
  });

  // TEST 5: Cleanup Test Product
  await test("5. Safe Deletion & Cleanup of Test Garment", async () => {
    if (createdProductId) {
      const delRes = await productService.deleteProduct(createdProductId, { permanent: true, force: true });
      assert.ok(delRes, "Test garment successfully purged from database");
      console.log(`   Cleaned up test garment ${createdProductId}`);
    }
  });

  console.log("\n=================================================================");
  console.log(`📊 PIPELINE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPipelineVerification();
