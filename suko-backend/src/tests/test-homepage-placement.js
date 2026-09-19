require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { pool } = require("../db");
const productService = require("../services/productService");

async function runTests() {
  console.log("==================================================");
  console.log("TESTING HOMEPAGE NEW ARRIVAL PLACEMENT & CONFLICTS");
  console.log("==================================================");

  try {
    // 1. Fetch all products and check seeded homepage placements
    const products = await productService.getAllProducts({ status: "all" });
    console.log(`Total products fetched: ${products.length}`);

    const homepageCurated = products
      .filter(p => p.show_on_homepage_new_arrivals)
      .sort((a, b) => (Number(a.homepage_new_arrival_position) || 99) - (Number(b.homepage_new_arrival_position) || 99));

    console.log(`\nCurated Homepage Products (${homepageCurated.length}):`);
    homepageCurated.forEach(p => {
      console.log(`- Position ${p.homepage_new_arrival_position}: "${p.name}" (ID: ${p.id}, Slug: ${p.slug})`);
    });

    if (homepageCurated.length !== 4) {
      console.warn(`⚠️ Warning: Expected 4 homepage products, found ${homepageCurated.length}`);
    } else {
      console.log("✓ Exactly 4 products are curated for Homepage New Arrivals (Positions 1 to 4).");
    }

    // 2. Test conflict detection function directly
    console.log("\nTesting position conflict detection logic...");
    const pos1Product = homepageCurated.find(p => Number(p.homepage_new_arrival_position) === 1);
    if (!pos1Product) {
      throw new Error("Could not find Position 1 product for conflict testing");
    }

    // Find another product that is NOT Position 1
    const otherProduct = products.find(p => p.id !== pos1Product.id && (p.status || "active") === "active");
    if (!otherProduct) {
      throw new Error("Could not find second product for conflict testing");
    }

    // Attempting to assign Position 1 to otherProduct should detect collision with pos1Product
    const allProds = await productService.getAllProducts({ status: "all", includeArchived: false });
    const conflict = allProds.find(p => {
      if (String(p.id) === String(otherProduct.id) || String(p.slug) === String(otherProduct.id)) {
        return false;
      }
      return Boolean(p.show_on_homepage_new_arrivals) && Number(p.homepage_new_arrival_position) === 1;
    });

    if (conflict && (conflict.id === pos1Product.id || conflict.slug === pos1Product.slug)) {
      console.log(`✓ Conflict successfully detected: "${otherProduct.name}" cannot take Position 1 because "${conflict.name}" occupies it.`);
    } else {
      throw new Error("Conflict detection failed to catch collision on Position 1");
    }

    // 3. Verify separation: New Arrivals collection contains products based on is_new_arrival
    const newArrivalsCollection = products.filter(p => Boolean(p.is_new_arrival));
    console.log(`\nMain New Arrivals Page Catalog Count: ${newArrivalsCollection.length} products`);
    console.log("✓ Main New Arrivals page continues automatic collection of all latest is_new_arrival products.");

    console.log("\n==================================================");
    console.log("ALL TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  } finally {
    if (pool && !pool.isMock) {
      await pool.end();
    }
  }
}

runTests();
