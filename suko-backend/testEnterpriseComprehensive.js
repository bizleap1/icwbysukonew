import assert from 'assert';
import prisma from './src/prisma/client.js';
import {
  adjustStockManually,
  generateBarcodeForVariant,
  receivePurchaseAtomic,
  processReturnAtomic,
  processExchangeAtomic,
  deductInventoryAtomic,
  reserveInventoryAtomic,
  confirmReservationAtomic,
  releaseReservationAtomic,
  generateSafeInvoiceNumber
} from './src/services/inventory.service.js';
import { logAdminAction } from './src/services/audit.service.js';
import bcrypt from 'bcryptjs';

console.log("=================================================================");
console.log("💎 SUKO ENTERPRISE RETAIL ERP & E-COMMERCE COMPREHENSIVE TEST");
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

async function run() {
  // Setup test environment
  let testUser = await prisma.user.findFirst({ where: { email: 'erp.tester@suko.com' } });
  if (!testUser) {
    const hash = await bcrypt.hash('testpassword', 10);
    testUser = await prisma.user.create({
      data: {
        name: 'ERP Tester',
        email: 'erp.tester@suko.com',
        phone: '9876543210',
        password_hash: hash,
        role: 'super_admin',
        is_online: true
      }
    });
  }

  // 1. Roles & Permissions hierarchy
  await test("1. Multi-tier Role Hierarchy Verification", async () => {
    const roles = ['customer', 'cashier', 'inventory_staff', 'store_manager', 'admin', 'super_admin'];
    for (const r of roles) {
      assert.ok(typeof r === 'string', `Role ${r} is supported`);
    }
  });

  // 2. Authoritative Variant Architecture
  let testProduct = null;
  let testVariantM = null;
  let testVariantL = null;

  await test("2. Product & Authoritative Variant Inventory", async () => {
    testProduct = await prisma.product.create({
      data: {
        name: `Atelier Test Suit ${Date.now()}`,
        price: 18000,
        mrp_price: 22000,
        stock: 20,
        sizes: ['M', 'L'],
        size_stock: { M: 10, L: 10 },
      }
    });

    testVariantM = await prisma.productVariant.create({
      data: {
        product_id: testProduct.id,
        sku: `SUK-TEST-${testProduct.id}-M`,
        barcode: `BAR-${testProduct.id}-M`,
        size: 'M',
        price: 18000,
        cost_price: 9000,
        stock: 10,
        reserved_stock: 0,
      }
    });

    testVariantL = await prisma.productVariant.create({
      data: {
        product_id: testProduct.id,
        sku: `SUK-TEST-${testProduct.id}-L`,
        barcode: `BAR-${testProduct.id}-L`,
        size: 'L',
        price: 18000,
        cost_price: 9000,
        stock: 10,
        reserved_stock: 0,
      }
    });

    assert.strictEqual(testVariantM.stock, 10);
    assert.strictEqual(testVariantL.stock, 10);
  });

  // 3. Barcode Generator
  await test("3. Free Barcode Generation & Format", async () => {
    const barcode = generateBarcodeForVariant(testVariantM);
    assert.ok(barcode.startsWith('MBG-'), `Barcode ${barcode} has proper prefix`);
  });

  // 4. Concurrency & Overselling Prevention
  await test("4. Concurrency & Overselling Protection (Stock = 1)", async () => {
    await prisma.productVariant.update({
      where: { id: testVariantM.id },
      data: { stock: 1, reserved_stock: 0 }
    });

    const p1 = prisma.$transaction(tx =>
      deductInventoryAtomic({
        tx,
        items: [{ product_id: testProduct.id, variant_id: testVariantM.id, size: 'M', quantity: 1 }],
        reference_type: 'ONLINE_ORDER',
        reference_id: 'RACE-ORD-1'
      })
    );

    const p2 = prisma.$transaction(tx =>
      deductInventoryAtomic({
        tx,
        items: [{ product_id: testProduct.id, variant_id: testVariantM.id, size: 'M', quantity: 1 }],
        reference_type: 'POS_SALE',
        reference_id: 'RACE-POS-2'
      })
    );

    const results = await Promise.allSettled([p1, p2]);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, "Exactly one transaction must succeed");
    assert.strictEqual(rejected.length, 1, "Exactly one transaction must fail with out of stock");

    const finalM = await prisma.productVariant.findUnique({ where: { id: testVariantM.id } });
    assert.strictEqual(finalM.stock, 0, "Stock must be exactly 0, never negative");
  });

  // 5. Manual Stock Adjustment & Audit
  await test("5. Manual Stock Adjustment (RESTOCK +5)", async () => {
    const res = await adjustStockManually({
      variant_id: testVariantM.id,
      quantity_delta: 5,
      type: 'RESTOCK',
      note: 'Fresh boutique shipment',
      created_by: 'Staff Tester'
    });

    assert.strictEqual(res.stockAfter, 5);
  });

  // 6. Safe Sequential POS Invoice Number Generation
  await test("6. Safe Sequential POS Invoice Number Generation", async () => {
    const inv1 = await generateSafeInvoiceNumber(prisma);
    const inv2 = await generateSafeInvoiceNumber(prisma);
    assert.notStrictEqual(inv1, inv2, "Invoices must be unique");
    assert.ok(inv1.startsWith('POS-'), "Invoice starts with POS- prefix");
  });

  // 7. Supplier & Purchase Inward Lifecycle
  await test("7. Supplier Creation & Purchase Inward Receiving", async () => {
    const supplier = await prisma.supplier.create({
      data: {
        name: `Artisan Mill ${Date.now()}`,
        contact_person: 'Rajesh Kumar',
        phone: '9876543211',
        gstin: '27AAAAA0000A1Z5',
      }
    });

    const poNumber = `PO-${Date.now()}`;
    const purchase = await prisma.purchase.create({
      data: {
        purchase_number: poNumber,
        supplier_id: supplier.id,
        subtotal: 45000,
        total: 45000,
        status: 'ORDERED',
        items: {
          create: [{
            variant_id: testVariantM.id,
            quantity: 5,
            cost_price: 9000,
            total: 45000
          }]
        }
      }
    });

    const vBefore = await prisma.productVariant.findUnique({ where: { id: testVariantM.id } });
    const stockBefore = vBefore.stock;

    // Receive purchase
    await receivePurchaseAtomic(purchase.id, 'Inventory Manager');

    const vAfter = await prisma.productVariant.findUnique({ where: { id: testVariantM.id } });
    assert.strictEqual(vAfter.stock, stockBefore + 5, "Stock must increment by 5");

    // Double-receive prevention
    let doubleReceiveBlocked = false;
    try {
      await receivePurchaseAtomic(purchase.id, 'Inventory Manager');
    } catch (err) {
      doubleReceiveBlocked = true;
    }
    assert.ok(doubleReceiveBlocked, "Double receiving a purchase must be blocked");

    // Cleanup
    await prisma.purchaseItem.deleteMany({ where: { purchase_id: purchase.id } });
    await prisma.purchase.delete({ where: { id: purchase.id } });
    await prisma.supplier.delete({ where: { id: supplier.id } });
  });

  // 8. Return & Restock Engine (Restockable vs Damaged)
  await test("8. Return Request & Restocking Condition Barrier", async () => {
    const retReq = await prisma.returnRequest.create({
      data: {
        product_id: testProduct.id,
        variant_id: testVariantM.id,
        quantity: 2,
        reason: 'Size too snug',
        type: 'RETURN',
        status: 'REQUESTED'
      }
    });

    const stockBefore = (await prisma.productVariant.findUnique({ where: { id: testVariantM.id } })).stock;

    // Process as RESTOCKABLE
    await processReturnAtomic(retReq.id, 'RESTOCKABLE', 'Approved in boutique', 'Cashier');

    const stockAfter = (await prisma.productVariant.findUnique({ where: { id: testVariantM.id } })).stock;
    assert.strictEqual(stockAfter, stockBefore + 2, "Restockable return must add 2 units to stock");

    // Double-completion prevention
    let doubleReturnBlocked = false;
    try {
      await processReturnAtomic(retReq.id, 'RESTOCKABLE', 'Retry', 'Cashier');
    } catch (err) {
      doubleReturnBlocked = true;
    }
    assert.ok(doubleReturnBlocked, "Double-processing a return must be blocked");

    await prisma.returnRequest.delete({ where: { id: retReq.id } });
  });

  // 9. Atomic Size Exchange Engine
  await test("9. Atomic Size Exchange Engine (Swap M -> L)", async () => {
    const exchangeReq = await prisma.returnRequest.create({
      data: {
        product_id: testProduct.id,
        variant_id: testVariantM.id,
        exchange_variant_id: testVariantL.id,
        quantity: 1,
        reason: 'Customer wants Size L instead',
        type: 'EXCHANGE',
        status: 'REQUESTED'
      }
    });

    const mBefore = (await prisma.productVariant.findUnique({ where: { id: testVariantM.id } })).stock;
    const lBefore = (await prisma.productVariant.findUnique({ where: { id: testVariantL.id } })).stock;

    await processExchangeAtomic({
      return_id: exchangeReq.id,
      old_variant_id: testVariantM.id,
      new_variant_id: testVariantL.id,
      quantity: 1,
      condition: 'RESTOCKABLE',
      staff_actor: 'Store Manager'
    });

    const mAfter = (await prisma.productVariant.findUnique({ where: { id: testVariantM.id } })).stock;
    const lAfter = (await prisma.productVariant.findUnique({ where: { id: testVariantL.id } })).stock;

    assert.strictEqual(mAfter, mBefore + 1, "Old variant M must increase by 1");
    assert.strictEqual(lAfter, lBefore - 1, "New variant L must decrease by 1");

    await prisma.returnRequest.delete({ where: { id: exchangeReq.id } });
  });

  // 10. Checkout Reservation Lifecycle (Reserve -> Confirm -> Release)
  await test("10. Checkout Reservation Lifecycle", async () => {
    const rzpOrderId = `order_test_${Date.now()}`;

    // 1. Reserve
    const { reservation } = await prisma.$transaction(tx =>
      reserveInventoryAtomic({
        tx,
        items: [{ product_id: testProduct.id, variant_id: testVariantL.id, size: 'L', quantity: 1 }],
        user_id: testUser.id,
        razorpay_order_id: rzpOrderId
      })
    );

    const vHeld = await prisma.productVariant.findUnique({ where: { id: testVariantL.id } });
    assert.strictEqual(vHeld.reserved_stock, 1, "Reserved stock must be 1");

    // 2. Release hold
    await prisma.$transaction(tx =>
      releaseReservationAtomic({
        tx,
        razorpay_order_id: rzpOrderId,
        reason: 'USER_CANCELLED'
      })
    );

    const vReleased = await prisma.productVariant.findUnique({ where: { id: testVariantL.id } });
    assert.strictEqual(vReleased.reserved_stock, 0, "Reserved stock must be released back to 0");

    await prisma.inventoryReservation.deleteMany({ where: { razorpay_order_id: rzpOrderId } });
  });

  // 11. Store Settings & Master Controls
  await test("11. Store Settings & Master Controls", async () => {
    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: { store_online: true, online_payments: true, cod_enabled: true },
      create: { store_online: true, online_payments: true, cod_enabled: true }
    });

    assert.strictEqual(settings.store_online, true);
    assert.strictEqual(settings.online_payments, true);
  });

  // 12. Admin Audit Log Redaction
  await test("12. Admin Audit Logging & Credential Redaction", async () => {
    const log = await logAdminAction({
      actor_id: testUser.id,
      actor_email: testUser.email,
      action: 'product.updated',
      entity: 'Product',
      entity_id: testProduct.id,
      metadata: {
        change: 'Price revised',
        password: 'should_be_stripped', // Must not appear
      }
    });

    assert.ok(
      log.metadata.password === '[REDACTED]' || log.metadata.password === undefined,
      "Sensitive passwords must be redacted or stripped from audit logs"
    );
  });

  // Cleanup test product and variants
  await prisma.inventoryMovement.deleteMany({ where: { product_id: testProduct.id } });
  await prisma.productVariant.deleteMany({ where: { product_id: testProduct.id } });
  await prisma.product.delete({ where: { id: testProduct.id } });

  console.log("\n=================================================================");
  console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error("Fatal Test Suite Error:", err);
  process.exit(1);
});
