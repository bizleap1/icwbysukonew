require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { pool } = require("../db");
const productService = require("../services/productService");

async function runTests() {
  console.log("==================================================");
  console.log("TESTING GARMENT LABEL PERSISTENCE & CRUD");
  console.log("==================================================");

  try {
    // 1. Run DB Migration to ensure column exists
    if (!pool.isMock) {
      console.log("Ensuring garment_label column exists in Postgres...");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS garment_label VARCHAR(100)");
      console.log("✓ Database column garment_label is ready.");
    } else {
      console.log("Running in Mock Mode.");
    }

    // 2. Fetch all products
    const products = await productService.getAllProducts({ status: "all" });
    if (products.length === 0) {
      throw new Error("No products found to test with");
    }

    const testProduct = products[0];
    const originalLabel = testProduct.garment_label;
    console.log(`\nTesting on product: "${testProduct.name}" (ID: ${testProduct.id}, Slug: ${testProduct.slug})`);
    console.log(`Original garment_label: ${JSON.stringify(originalLabel)}`);

    // 3. Update with custom label: "Tailored Suit"
    console.log("\nUpdating garment_label to 'Tailored Suit'...");
    const updated1 = await productService.updateProduct(testProduct.id, {
      garment_label: "Tailored Suit"
    });
    console.log("Updated result garment_label:", updated1.garment_label);
    if (updated1.garment_label !== "Tailored Suit") {
      throw new Error(`Expected 'Tailored Suit', got '${updated1.garment_label}'`);
    }

    // 4. Verify fetch returns it
    const fetched1 = await productService.getProductById(testProduct.id);
    console.log("Fetched product garment_label:", fetched1.garment_label);
    if (fetched1.garment_label !== "Tailored Suit") {
      throw new Error(`Fetched product does not match 'Tailored Suit'`);
    }
    console.log("✓ Custom Garment Label successfully persisted and fetched!");

    // 5. Test another label: "Complete Set"
    console.log("\nUpdating garment_label to 'Complete Set'...");
    const updated2 = await productService.updateProduct(testProduct.id, {
      garment_label: "Complete Set"
    });
    console.log("Updated result garment_label:", updated2.garment_label);
    if (updated2.garment_label !== "Complete Set") {
      throw new Error(`Expected 'Complete Set', got '${updated2.garment_label}'`);
    }

    // 6. Test clearing label back to null (for automatic fallback)
    console.log("\nTesting clearing garment_label back to null (empty input)...");
    const updatedClear = await productService.updateProduct(testProduct.id, {
      garment_label: ""
    });
    console.log("Cleared result garment_label:", updatedClear.garment_label);
    if (updatedClear.garment_label !== null && updatedClear.garment_label !== "") {
      throw new Error(`Expected null or empty string, got '${updatedClear.garment_label}'`);
    }
    console.log("✓ Empty label successfully converted to null/fallback!");

    // Restore original if there was one
    if (originalLabel) {
      await productService.updateProduct(testProduct.id, { garment_label: originalLabel });
      console.log(`Restored original garment_label: ${originalLabel}`);
    }

    console.log("\n==================================================");
    console.log("ALL GARMENT LABEL BACKEND TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

runTests();
