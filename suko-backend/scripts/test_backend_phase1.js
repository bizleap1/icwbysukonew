require('dotenv').config();
const productService = require('../src/services/productService');
const { pool } = require('../src/db');

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING BACKEND PHASE 1 INTEGRATION TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Unique SKU generation
    console.log("TEST 1: Strict SKU Engine Generation");
    const testSku = await productService.generateUniqueSKU("suits", "The Executive Double Breasted Suit");
    assert(testSku && testSku.startsWith("SUKO-SUIT-"), `Generated SKU starts with prefix: ${testSku}`);
    assert(/SUKO-[A-Z]+-[A-Z]+-\d{3}/.test(testSku), `SKU follows format SUKO-CATEGORY-STYLE-NUMBER: ${testSku}`);

    // TEST 2: Collection Management CRUD & Reordering
    console.log("\nTEST 2: Collection Management CRUD & Reordering");
    const testCatSlug = `test-coll-${Date.now()}`;
    const newCat = await productService.createCategory({
      name: "Test Executive Drop",
      slug: testCatSlug,
      tagline: "Ultra Bespoke Executive Attire",
      description: "Exclusive boardroom luxury capsules.",
      cover_image_url: "/placeholder.png",
      sort_order: 99
    });
    assert(newCat && newCat.name === "Test Executive Drop", `Created collection: ${newCat.name} (${newCat.slug})`);

    const updatedCat = await productService.updateCategory(newCat.id, {
      name: "Test Executive Drop Renamed",
      tagline: "Updated Tagline"
    });
    assert(updatedCat && updatedCat.name === "Test Executive Drop Renamed", `Updated collection name: ${updatedCat.name}`);

    const archivedCat = await productService.archiveCategory(newCat.id, true);
    assert(archivedCat && archivedCat.is_archived === true, `Archived collection: is_archived = ${archivedCat.is_archived}`);

    const restoredCat = await productService.archiveCategory(newCat.id, false);
    assert(restoredCat && restoredCat.is_archived === false, `Restored collection: is_archived = ${restoredCat.is_archived}`);

    // TEST 3: Product Creation with SEO & Auto-SKU
    console.log("\nTEST 3: Product Creation with SEO & Auto-SKU");
    const testProd = await productService.createProduct({
      name: "Test Royal Tuxedo",
      price: 34500,
      stock: 12,
      category_id: newCat.id,
      color: "Obsidian Black",
      fabric: "Italian Super 150s Merino Wool",
      description: "Mastercrafted tuxedo for gala events.",
      seo_title: "Custom Royal Tuxedo | SUKO Atelier",
      seo_description: "Discover bespoke luxury royal tuxedos handcrafted in Mumbai.",
      seo_keywords: "royal tuxedo, black tie suit, luxury evening wear"
    });
    assert(testProd && testProd.id, `Product created with ID: ${testProd.id}`);
    assert(testProd.sku && testProd.sku.startsWith("SUKO-"), `SKU automatically assigned: ${testProd.sku}`);
    assert(testProd.seo_title === "Custom Royal Tuxedo | SUKO Atelier", `SEO Title persisted: ${testProd.seo_title}`);
    assert(testProd.seo_keywords === "royal tuxedo, black tie suit, luxury evening wear", `SEO Keywords persisted: ${testProd.seo_keywords}`);

    // TEST 4: Duplicate Product (Silhouette Cloner)
    console.log("\nTEST 4: Duplicate Product (Silhouette Cloner)");
    const cloned = await productService.duplicateProduct(testProd.id, "test@admin.com");
    assert(cloned && cloned.id !== testProd.id, `Cloned product has distinct ID: ${cloned.id}`);
    assert(cloned.sku !== testProd.sku, `Cloned product has new unique SKU: ${cloned.sku} (vs ${testProd.sku})`);
    assert(Number(cloned.stock) === 0, `Cloned product inventory reset to 0: ${cloned.stock}`);
    assert(cloned.status === "draft", `Cloned product status is draft: ${cloned.status}`);
    assert(cloned.fabric === testProd.fabric, `Fabric specs preserved from parent silhouette: ${cloned.fabric}`);

    // TEST 5: Collection Deletion Safety Guard
    console.log("\nTEST 5: Collection Deletion Safety Guard");
    const safety = await productService.checkCategoryDeletionSafety(newCat.id);
    assert(safety.safe === false, `Blocked deletion because registered garments exist: count = ${safety.count}`);
    assert(safety.count >= 1, `Accurately counted child garments attached to collection`);

    // Clean up test products
    await pool.query("DELETE FROM products WHERE id IN ($1, $2)", [testProd.id, cloned.id]);
    await pool.query("DELETE FROM categories WHERE id = $1", [newCat.id]);
    console.log("\nTest artifacts cleaned up successfully.");

    console.log("\n==================================================");
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("\n❌ Unhandled Test Error:", err);
    process.exit(1);
  }
}

runTests();
