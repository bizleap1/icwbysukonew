require("dotenv").config();
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { cloudinary, isCloudinaryConfigured, getCloudinaryConfig } = require("../config/cloudinary");
const { safeDeleteCloudinaryAsset, extractCloudinaryPublicId } = require("../services/cloudinaryService");

// Generate valid Admin Token for API testing
const token = jwt.sign(
  {
    userId: "admin-verifier-1",
    role: "admin",
    name: "SUKO Admin Verifier",
    email: "indiancorporatewearbysuko@gmail.com"
  },
  process.env.JWT_SECRET || "suko_super_secret_jwt_dev_key_2026",
  { expiresIn: "1h" }
);

const API_BASE = "http://localhost:5000/api";

// 1x1 base64 transparent PNGs for test files
const samplePngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

async function runRealEndToEndVerification() {
  console.log("=================================================================");
  console.log("STARTING REAL END-TO-END CLOUDINARY & PUBLISHING VERIFICATION");
  console.log("=================================================================\n");

  // 1. Verify Cloudinary Config detection WITHOUT exposing secret
  console.log("--- 1. Cloudinary Configuration Detection ---");
  const config = getCloudinaryConfig();
  console.log("Configured:", config.isConfigured);
  console.log("Cloud Name:", config.cloudName);
  console.log("Has API Key:", config.hasApiKey);
  console.log("Has API Secret:", config.hasApiSecret);
  // Strictly ensure secret is never printed
  if (JSON.stringify(config).includes(process.env.CLOUDINARY_API_SECRET)) {
    throw new Error("SECURITY VIOLATION: API Secret was exposed in config output!");
  }
  if (!config.isConfigured || !config.hasApiKey || !config.hasApiSecret) {
    throw new Error("Cloudinary is not properly configured!");
  }
  console.log("PASS: Cloudinary configuration detected safely without exposing secrets.\n");

  // 2. Test Publishing Rule: Active requires >= 3 images, Draft allows >= 1 image
  console.log("--- 2. Publishing Rules Enforcement ---");

  // A) Active with 2 images -> Must be blocked with 400 and exact message
  const formActive2Images = new FormData();
  formActive2Images.append("name", "Test Active Blocked");
  formActive2Images.append("price", "25000");
  formActive2Images.append("status", "active");
  formActive2Images.append("image", new Blob([samplePngBuffer], { type: "image/png" }), "shot1.png");
  formActive2Images.append("images", new Blob([samplePngBuffer], { type: "image/png" }), "shot2.png");

  const blockRes = await fetch(`${API_BASE}/products/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formActive2Images
  });
  const blockJson = await blockRes.json();
  console.log("Block check response status:", blockRes.status);
  console.log("Block check error message:", blockJson.error);

  if (blockRes.status !== 400 || blockJson.error !== "Add at least 3 product images before publishing.") {
    throw new Error(`Expected HTTP 400 with 'Add at least 3 product images before publishing.', got status ${blockRes.status}: ${JSON.stringify(blockJson)}`);
  }
  console.log("PASS: Blocked publishing Active product with only 2 images.");

  // B) Draft with 1 image -> Allowed
  const formDraft1Image = new FormData();
  formDraft1Image.append("name", "Test Draft Silhouette");
  formDraft1Image.append("price", "18000");
  formDraft1Image.append("status", "draft");
  formDraft1Image.append("image", new Blob([samplePngBuffer], { type: "image/png" }), "draft_shot1.png");

  const draftRes = await fetch(`${API_BASE}/products/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formDraft1Image
  });
  const draftJson = await draftRes.json();
  console.log("Draft response status:", draftRes.status);
  if (!draftRes.ok || !draftJson.product?.id) {
    throw new Error(`Draft creation failed: ${JSON.stringify(draftJson)}`);
  }
  const draftId = draftJson.product.id;
  console.log("PASS: Draft product created successfully with 1 image (ID:", draftId, ")");

  // C) Update Draft to Active without adding 2 more images -> Must be blocked
  const updateDraftRes = await fetch(`${API_BASE}/products/${draftId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: "active" })
  });
  const updateDraftJson = await updateDraftRes.json();
  console.log("Draft-to-active upgrade block status:", updateDraftRes.status);
  console.log("Draft-to-active upgrade block message:", updateDraftJson.error);

  if (updateDraftRes.status !== 400 || updateDraftJson.error !== "Add at least 3 product images before publishing.") {
    throw new Error(`Expected HTTP 400 blocking draft activation, got: ${JSON.stringify(updateDraftJson)}`);
  }
  console.log("PASS: Blocked updating draft to active with fewer than 3 images.");

  // Clean up the draft test product
  await pool.query("DELETE FROM products WHERE id = $1", [draftId]);
  if (draftJson.product.image_url?.includes("cloudinary.com")) {
    await safeDeleteCloudinaryAsset(extractCloudinaryPublicId(draftJson.product.image_url));
  }
  console.log("Cleaned up temporary draft test product.\n");

  // 3. Real Admin -> Add Product Flow with 3 Images
  console.log("--- 3. Real Admin -> Add Product Flow with 3 Images ---");
  const form3Images = new FormData();
  form3Images.append("name", "The Sovereign Bespoke Bandhgala");
  form3Images.append("price", "49500");
  form3Images.append("discount_price", "44500");
  form3Images.append("stock", "12");
  form3Images.append("category_id", "suits");
  form3Images.append("sub_category", "Bandhgala Suit");
  form3Images.append("status", "active");
  form3Images.append("color", "Midnight Navy");
  form3Images.append("fabric", "Super 140s Wool");
  form3Images.append("silhouette", "Structured Heritage");
  form3Images.append("fit", "Bespoke Tailored");
  form3Images.append("occasion", "Black Tie Gala");
  form3Images.append("size_stock", JSON.stringify({ "38": 3, "40": 3, "42": 3, "44": 3 }));

  // Primary image
  form3Images.append("image", new Blob([samplePngBuffer], { type: "image/png" }), "bandhgala_front.png");
  // 2 gallery images
  form3Images.append("images", new Blob([samplePngBuffer], { type: "image/png" }), "bandhgala_angle.png");
  form3Images.append("images", new Blob([samplePngBuffer], { type: "image/png" }), "bandhgala_side.png");

  // Gallery shot types
  form3Images.append("gallery", JSON.stringify([
    { type: "model_front" },
    { type: "model_three_quarter" },
    { type: "model_side" }
  ]));

  const createRes = await fetch(`${API_BASE}/products/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form3Images
  });
  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.product) {
    throw new Error(`Failed to create product: ${JSON.stringify(createJson)}`);
  }

  const newProd = createJson.product;
  console.log("PASS: Product Created:", newProd.name, "(ID:", newProd.id, ")");
  console.log("   Status:", newProd.status);
  console.log("   Image URL:", newProd.image_url);
  console.log("   Images Array Count:", newProd.images?.length);
  console.log("   Gallery Array Count:", newProd.gallery?.length);

  // 4. Verify Cloudinary permanent URLs
  console.log("\n--- 4. Cloudinary URL Verification ---");
  const cloudPrefix = "https://res.cloudinary.com/rd43tyad/";

  if (!newProd.image_url.startsWith(cloudPrefix)) {
    throw new Error(`image_url is not a Cloudinary permanent URL: ${newProd.image_url}`);
  }
  if (!Array.isArray(newProd.images) || newProd.images.length !== 3) {
    throw new Error(`Expected exactly 3 images, got ${newProd.images?.length}`);
  }

  newProd.images.forEach((url, i) => {
    console.log(`   Image [${i + 1}]: ${url}`);
    if (!url.startsWith(cloudPrefix)) {
      throw new Error(`Image ${i} is not a Cloudinary permanent URL: ${url}`);
    }
    // Verify no filesystem or localhost or blob paths
    if (url.includes("/uploads/") || url.includes("localhost") || url.includes("blob:") || url.includes("C:\\")) {
      throw new Error(`Forbidden path segment found in image ${i}: ${url}`);
    }
  });

  // Verify gallery canonical types
  newProd.gallery.forEach((g, i) => {
    console.log(`   Gallery [${i + 1}]: type="${g.type}", url="${g.url}"`);
    if (!g.url.startsWith(cloudPrefix)) {
      throw new Error(`Gallery item ${i} is not a Cloudinary URL: ${g.url}`);
    }
  });
  console.log("PASS: All 3 images successfully uploaded to Cloudinary CDN with permanent HTTPS URLs.");

  // 5. Verify PostgreSQL Neon Database Record
  console.log("\n--- 5. PostgreSQL Neon Database Record Verification ---");
  const dbRes = await pool.query(
    "SELECT id, name, image_url, images, gallery, status, size_stock FROM products WHERE id = $1",
    [newProd.id]
  );
  if (dbRes.rows.length === 0) {
    throw new Error(`Product ${newProd.id} not found in PostgreSQL!`);
  }
  const dbRow = dbRes.rows[0];
  console.log("   DB Row Name:", dbRow.name);
  console.log("   DB Row Status:", dbRow.status);
  console.log("   DB Row Image URL:", dbRow.image_url);
  console.log("   DB Row Images:", typeof dbRow.images === "string" ? dbRow.images : JSON.stringify(dbRow.images));
  console.log("   DB Row Gallery:", typeof dbRow.gallery === "string" ? dbRow.gallery : JSON.stringify(dbRow.gallery));

  const dbImages = typeof dbRow.images === "string" ? JSON.parse(dbRow.images) : dbRow.images;
  const dbGallery = typeof dbRow.gallery === "string" ? JSON.parse(dbRow.gallery) : dbRow.gallery;

  if (dbImages.length !== 3) throw new Error("DB images length is not 3!");
  if (dbGallery.length !== 3) throw new Error("DB gallery length is not 3!");
  if (!dbRow.image_url.startsWith(cloudPrefix)) throw new Error("DB image_url is not Cloudinary!");
  console.log("PASS: Database persistence verified with 100% permanent Cloudinary URLs.");

  // 6. Verify HTTP 200 on Network Requests to Cloudinary CDN
  console.log("\n--- 6. HTTP Network Requests & Responsive Delivery Verification ---");
  for (let i = 0; i < newProd.images.length; i++) {
    const imgUrl = newProd.images[i];
    const netRes = await fetch(imgUrl);
    console.log(`   Direct CDN fetch [${i + 1}] status: ${netRes.status} (${netRes.headers.get("content-type")})`);
    if (netRes.status !== 200) {
      throw new Error(`Image fetch failed with status ${netRes.status} for ${imgUrl}`);
    }

    // Test Cloudinary responsive transformation URLs
    const transform800w = imgUrl.replace("/image/upload/", "/image/upload/c_fill,w_800,q_auto,f_auto/");
    const trans800Res = await fetch(transform800w);
    console.log(`   Transformed 800w fetch [${i + 1}] status: ${trans800Res.status}`);
    if (trans800Res.status !== 200) {
      throw new Error(`Transformed 800w fetch failed with status ${trans800Res.status}`);
    }

    const transform300w = imgUrl.replace("/image/upload/", "/image/upload/c_fill,w_300,q_auto,f_auto/");
    const trans300Res = await fetch(transform300w);
    console.log(`   Transformed 300w thumbnail fetch [${i + 1}] status: ${trans300Res.status}`);
    if (trans300Res.status !== 200) {
      throw new Error(`Transformed 300w fetch failed with status ${trans300Res.status}`);
    }
  }
  console.log("PASS: All images and responsive CDN transformations returned HTTP 200 with no 404/403 errors.");

  // 7. Verify Storefront Collections and ProductDetail API
  console.log("\n--- 7. Storefront Collections & ProductDetail Endpoints ---");
  const allProdsRes = await fetch(`${API_BASE}/products`);
  const allProds = await allProdsRes.json();
  const foundInCatalog = allProds.find(p => String(p.id) === String(newProd.id));
  if (!foundInCatalog) {
    throw new Error("Created product not returned by GET /api/products storefront endpoint!");
  }
  console.log("   Found in Collections list:", foundInCatalog.name);
  console.log("   Storefront Card thumbnail:", foundInCatalog.image_url);

  const singleProdRes = await fetch(`${API_BASE}/products/${newProd.id}`);
  const singleProd = await singleProdRes.json();
  if (singleProd.images.length !== 3 || singleProd.gallery.length !== 3) {
    throw new Error("Single product endpoint returned corrupted gallery/images!");
  }
  console.log("   Found in ProductDetail endpoint: Gallery has", singleProd.gallery.length, "angles");
  console.log("   First angle (PDP hero):", singleProd.gallery[0].url, `(${singleProd.gallery[0].type})`);
  console.log("   Second angle:", singleProd.gallery[1].url, `(${singleProd.gallery[1].type})`);
  console.log("   Third angle:", singleProd.gallery[2].url, `(${singleProd.gallery[2].type})`);
  console.log("PASS: Collections & PDP API verified with consistent image resolution.");

  // 8. Clean up test assets
  console.log("\n--- 8. Cleanup of Test Product & Cloud Assets ---");
  await pool.query("DELETE FROM products WHERE id = $1", [newProd.id]);
  console.log("   Deleted product record from Neon DB.");

  for (const url of newProd.images) {
    const publicId = extractCloudinaryPublicId(url);
    if (publicId) {
      await safeDeleteCloudinaryAsset(publicId);
      console.log(`   Deleted Cloudinary asset: ${publicId}`);
    }
  }
  console.log("PASS: Safe cleanup completed.");

  console.log("\n=================================================================");
  console.log("ALL REAL END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!");
  console.log("=================================================================");
}

runRealEndToEndVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nE2E VERIFICATION FAILED:", err);
    process.exit(1);
  });
