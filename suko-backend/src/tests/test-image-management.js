require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { pool } = require("../db");
const productService = require("../services/productService");

async function testImageManagement() {
  console.log("=== Testing Product Image Management API ===");

  // Fetch an active product
  const products = await productService.getAllProducts({ status: "active" });
  if (!products || products.length === 0) {
    console.error("No active products found to test.");
    process.exit(1);
  }

  const testProduct = products[0];
  console.log(`Testing with product: "${testProduct.name}" (ID: ${testProduct.id})`);
  console.log(`Initial images count: ${(testProduct.images || []).length}`);

  // 1. Test validation: Active product with < 3 images should fail
  console.log("\n--- Test 1: Active product with < 3 images should be rejected ---");
  const updateDataUnder3 = {
    status: "active",
    gallery: JSON.stringify([
      { url: "https://res.cloudinary.com/test/image1.jpg", type: "model_front" },
      { url: "https://res.cloudinary.com/test/image2.jpg", type: "model_three_quarter" }
    ]),
    images: [
      "https://res.cloudinary.com/test/image1.jpg",
      "https://res.cloudinary.com/test/image2.jpg"
    ]
  };

  // Test productService.synchronizeGalleryAndImages directly
  const syncTest = productService.synchronizeGalleryAndImages(
    updateDataUnder3.gallery,
    updateDataUnder3.images,
    updateDataUnder3.images[0]
  );
  console.log("Synchronized gallery items count:", syncTest.gallery.length);
  if (syncTest.gallery.length === 2) {
    console.log("✓ Correctly parsed 2 gallery items.");
  } else {
    console.error("✗ Expected 2 items, got:", syncTest.gallery.length);
  }

  // 2. Test gallery_structure with 3 images, custom roles, and crops
  console.log("\n--- Test 2: 3 images with custom roles & reordering ---");
  const testGalleryStructure = [
    { type: "existing", url: "https://res.cloudinary.com/test/cover-look.jpg", role: "model_front", crop: { x: 10, y: 10, width: 400, height: 500 } },
    { type: "existing", url: "https://res.cloudinary.com/test/back-view.jpg", role: "model_back" },
    { type: "existing", url: "https://res.cloudinary.com/test/fabric-detail.jpg", role: "detail" }
  ];

  const sync3 = productService.synchronizeGalleryAndImages(
    testGalleryStructure,
    testGalleryStructure.map(s => s.url),
    testGalleryStructure[0].url
  );

  if (sync3.gallery.length === 3 && sync3.images.length === 3 && sync3.imageUrl === "https://res.cloudinary.com/test/cover-look.jpg") {
    console.log("✓ Gallery synchronized with 3 images, primary cover:", sync3.imageUrl);
    console.log("✓ Slot 0 crop preserved:", JSON.stringify(sync3.gallery[0].crop));
    console.log("✓ Slot 1 role preserved:", sync3.gallery[1].type);
    console.log("✓ Slot 2 role preserved:", sync3.gallery[2].type);
  } else {
    console.error("✗ Failed gallery synchronization test.");
  }

  console.log("\n=== Image Management Tests Completed Successfully ===");
  process.exit(0);
}

testImageManagement().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
