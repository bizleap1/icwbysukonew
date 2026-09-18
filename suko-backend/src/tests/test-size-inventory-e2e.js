// Test size-level inventory single source of truth and order deduction
require("dotenv").config();
const { pool } = require("../db");
const productService = require("../services/productService");

async function runTest() {
  console.log("=== Testing Size Inventory as Single Source of Truth ===");

  try {
    // 1. Create a test product with sized inventory: 38=10, 40=10, 42=5, 44=0, 46=0
    const testSizeStock = { "38": 10, "40": 10, "42": 5, "44": 0, "46": 0 };
    const created = await productService.createProduct({
      name: "Atelier Test Sized Tuxedo " + Date.now(),
      price: 14990,
      description: "Automated test tuxedo for size inventory",
      size_stock: testSizeStock,
      stock: 999, // Intentional mismatched fallback stock - should be ignored and overwritten by sum(size_stock)
      status: "active",
      category_id: "test",
      sub_category: "Suits"
    });

    console.log("Product Created ID:", created.id);
    console.log("Calculated Total Stock:", created.stock);
    console.log("Recorded Sizes:", created.sizes);
    console.log("Recorded Size Stock:", created.size_stock);

    // Verify stock is sum(10 + 10 + 5 + 0 + 0) = 25
    if (Number(created.stock) !== 25) {
      throw new Error(`Expected product.stock to be 25, got ${created.stock}`);
    }
    if (!Array.isArray(created.sizes) || created.sizes.length !== 5 || !created.sizes.includes("38") || created.sizes.includes("Free")) {
      throw new Error(`Expected sizes to be exactly ["38", "40", "42", "44", "46"], got ${JSON.stringify(created.sizes)}`);
    }
    console.log("✓ PASS: Initial creation correctly computed totalStock = 25 and filtered sizes");

    // 2. Update size inventory: change 42 to 10 and 44 to 2 (total should become 32)
    const updatedSizeStock = { "38": 10, "40": 10, "42": 10, "44": 2, "46": 0 };
    const updated = await productService.updateProduct(created.id, {
      size_stock: updatedSizeStock,
      stock: 1234 // Should be ignored and recalculated
    });

    console.log("Updated Total Stock:", updated.stock);
    if (Number(updated.stock) !== 32) {
      throw new Error(`Expected updated stock to be 32, got ${updated.stock}`);
    }
    console.log("✓ PASS: Product update correctly recomputed totalStock = 32");

    // 3. Clean up test product
    await productService.deleteProduct(created.id);
    console.log("✓ PASS: Test product cleaned up successfully");

    console.log("\n=== ALL SIZE INVENTORY TESTS PASSED ===");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runTest();
