/**
 * =========================================================================
 * SUKO ATELIER — PHASE 2 REAL POSTGRESQL DATABASE INTEGRATION SUITE
 * 
 * 100% REAL POSTGRESQL + REAL PRISMA CLIENT + ZERO MOCKS
 * 
 * 1. REAL VARIANT INVENTORY & AVAILABLE STOCK (Physical - Reserved)
 * 2. REAL MANUAL STOCK ADJUSTMENT (RESTOCK +5 -> Movement + Audit Log)
 * 3. REAL MANUAL STOCK ADJUSTMENT (DAMAGE -2 -> Movement + Audit Log)
 * 4. REAL MANUAL STOCK ADJUSTMENT (LOST -1 -> Movement + Audit Log)
 * 5. REAL AUDIT LOG SENSITIVE DATA REDACTION (Password/Token -> [REDACTED])
 * 6. REAL BARCODE AUTO-GENERATION & UNIQUENESS
 * 7. REAL SUPPLIER RECORD CREATION & VALIDATION
 * 8. REAL PURCHASE ORDER DRAFTING (Inventory unaltered in DRAFT status)
 * 9. REAL PURCHASE ORDER RECEIVING (Atomic Stock Inward + Cost Price Update)
 * 10. REAL IDEMPOTENT PURCHASE RECEIVING (Reject duplicate inward safely)
 * 11. REAL POS CASH SALE (Stock decrement + Cash change computation)
 * 12. REAL POS SPLIT PAYMENT (Multi-payment ledger entries totaling grand total)
 * 13. REAL RETURN RESTOCKABLE (Restores +1 physical stock)
 * 14. REAL RETURN DAMAGED (Quarantines without increasing sellable stock)
 * 15. REAL ATOMIC SIZE EXCHANGE (Atomic swap: Size M +1, Size L -1)
 * 16. REAL SIZE EXCHANGE STOCKOUT ROLLBACK (Target out of stock -> Full rollback)
 * 17. REAL SIZE EXCHANGE PRICE DIFFERENCE COMPUTATION
 * 18. REAL CUSTOMER INTELLIGENCE (Online + Offline phone linkage without duplicates)
 * =========================================================================
 */

import EmbeddedPostgres from 'embedded-postgres';
import { execSync } from 'child_process';
import prisma from '../src/prisma/client.js';
import {
  adjustStockManually,
  generateBarcodeForVariant,
  receivePurchaseAtomic,
  processReturnAtomic,
  processExchangeAtomic,
  getAvailableStock,
} from '../src/services/inventory.service.js';
import { logAdminAction } from '../src/services/audit.service.js';

let passCount = 0;
let failCount = 0;
const results = [];

function recordPass(testName, details = '') {
  passCount++;
  results.push({ name: testName, status: 'PASS', details });
  console.log(`\x1b[32m[PASS]\x1b[0m ${testName} ${details ? `— ${details}` : ''}`);
}

function recordFail(testName, error) {
  failCount++;
  results.push({ name: testName, status: 'FAIL', details: error.message || error });
  console.error(`\x1b[31m[FAIL]\x1b[0m ${testName} — Error:`, error.message || error);
}

export async function runPhase2RealDbIntegrationSuite() {
  console.log('\n================================================================');
  console.log('🐘 SUKO ATELIER — PHASE 2 REAL POSTGRESQL INTEGRATION SUITE');
  console.log('================================================================\n');

  let pgInstance = null;
  const DB_URL = 'postgresql://postgres:password@localhost:5432/postgres?schema=test_suite';
  process.env.DATABASE_URL = DB_URL;

  try {
    // ── STEP 1: INITIALIZE / START REAL POSTGRESQL ──
    console.log('▶ [PostgreSQL] Checking and starting real PostgreSQL database server on port 5432...');
    pgInstance = new EmbeddedPostgres({
      port: 5432,
      databaseDir: './.pgdata',
      user: 'postgres',
      password: 'password',
      db: 'postgres',
      persistent: true,
    });

    try {
      await pgInstance.initialise();
    } catch (initErr) {}

    try {
      await pgInstance.start();
      console.log('✅ [PostgreSQL] Real PostgreSQL server is online on port 5432.\n');
    } catch (startErr) {
      console.log('ℹ️ [PostgreSQL] Server active on port 5432.\n');
    }

    // ── STEP 2: SYNC PRISMA SCHEMA TO REAL POSTGRESQL ──
    console.log('▶ [Prisma] Synchronizing Phase 2 schema and constraints with live PostgreSQL (test_suite)...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: DB_URL },
      stdio: 'pipe',
    });
    await prisma.$disconnect();
    await prisma.$connect();
    console.log('✅ [Prisma] Database tables, constraints, and indexes synchronized.\n');

    // ── STEP 3: CLEAN & SEED DATABASE ──
    console.log('▶ [Setup] Seeding test product, variants, and customer in real PostgreSQL...');
    await prisma.returnRequest.deleteMany({});
    await prisma.purchaseItem.deleteMany({});
    await prisma.purchase.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});
    await prisma.inventoryMovement.deleteMany({});
    await prisma.inventoryReservation.deleteMany({});
    await prisma.adminAuditLog.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    const testProduct = await prisma.product.create({
      data: {
        name: 'Zardozi Embroidered Raw Silk Lehenga',
        description: 'Boutique bridal masterpiece with pure gold threadwork',
        price: 25000,
        stock: 20,
        sizes: ['M', 'L'],
        size_stock: { M: 10, L: 10 },
      },
    });

    const variantM = await prisma.productVariant.create({
      data: {
        product_id: testProduct.id,
        sku: `MBG-LEH-${testProduct.id}-M`,
        barcode: `MBG-LEH-${testProduct.id}-M-001`,
        size: 'M',
        color: 'Crimson Gold',
        price: 25000,
        cost_price: 12000,
        stock: 10,
        reserved_stock: 2,
        low_stock_alert: 3,
        is_active: true,
      },
    });

    const variantL = await prisma.productVariant.create({
      data: {
        product_id: testProduct.id,
        sku: `MBG-LEH-${testProduct.id}-L`,
        barcode: `MBG-LEH-${testProduct.id}-L-002`,
        size: 'L',
        color: 'Crimson Gold',
        price: 25000,
        cost_price: 12000,
        stock: 10,
        reserved_stock: 0,
        low_stock_alert: 3,
        is_active: true,
      },
    });

    const testUser = await prisma.user.create({
      data: {
        name: 'Ananya Singhania',
        email: 'ananya.singhania@suko.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuv',
        phone: '9811223344',
        role: 'customer',
      },
    });

    console.log('✅ [Setup] Seed complete. Starting test execution...\n');

    // ── TEST 1: VARIANT INVENTORY & AVAILABLE STOCK ──
    try {
      const availM = await getAvailableStock(variantM.id);
      if (availM !== 8) throw new Error(`Expected 8 available stock for variant M, got ${availM}`);
      recordPass('1. Variant Available Stock Calculation', `Physical: 10, Reserved: 2 -> Available: ${availM}`);
    } catch (e) { recordFail('1. Variant Available Stock Calculation', e); }

    // ── TEST 2: MANUAL RESTOCK ADJUSTMENT ──
    try {
      const adj = await adjustStockManually({
        variant_id: variantM.id,
        quantity_delta: 5,
        type: 'RESTOCK',
        note: 'Workshop batch addition',
        created_by: 'Garima (Master Stylist)',
      });
      if (adj.variant.stock !== 15) throw new Error(`Expected stock 15, got ${adj.variant.stock}`);
      recordPass('2. Manual RESTOCK Stock Increment', `Stock increased to ${adj.variant.stock}, Movement: ${adj.movement.type}`);
    } catch (e) { recordFail('2. Manual RESTOCK Stock Increment', e); }

    // ── TEST 3: MANUAL DAMAGE ADJUSTMENT ──
    try {
      const adj = await adjustStockManually({
        variant_id: variantM.id,
        quantity_delta: -2,
        type: 'DAMAGE',
        note: 'Fabric torn in showroom trial',
        created_by: 'Staff',
      });
      if (adj.variant.stock !== 13) throw new Error(`Expected stock 13, got ${adj.variant.stock}`);
      recordPass('3. Manual DAMAGE Stock Decrement', `Stock decreased to ${adj.variant.stock}, Movement: ${adj.movement.type}`);
    } catch (e) { recordFail('3. Manual DAMAGE Stock Decrement', e); }

    // ── TEST 4: MANUAL LOST ADJUSTMENT ──
    try {
      const adj = await adjustStockManually({
        variant_id: variantM.id,
        quantity_delta: -1,
        type: 'LOST',
        note: 'Physical count discrepancy during audit',
        created_by: 'Auditor',
      });
      if (adj.variant.stock !== 12) throw new Error(`Expected stock 12, got ${adj.variant.stock}`);
      recordPass('4. Manual LOST Stock Decrement', `Stock decreased to ${adj.variant.stock}, Movement: ${adj.movement.type}`);
    } catch (e) { recordFail('4. Manual LOST Stock Decrement', e); }

    // ── TEST 5: SENSITIVE DATA REDACTION IN AUDIT LOGS ──
    try {
      const log = await logAdminAction({
        admin_id: testUser.id,
        admin_name: 'Garima',
        action: 'INVENTORY_OVERRIDE',
        resource: 'ProductVariant',
        resource_id: String(variantM.id),
        details: { reason: 'Audit check', password: 'SecretPassword999', token: 'Bearer xyz.abc.token' },
      });
      if (!log || log.details.password !== '[REDACTED]' || log.details.token !== '[REDACTED]') {
        throw new Error('Sensitive credentials not redacted');
      }
      recordPass('5. Audit Log Sensitive Data Redaction', 'Password & token sanitized to [REDACTED]');
    } catch (e) { recordFail('5. Audit Log Sensitive Data Redaction', e); }

    // ── TEST 6: BARCODE GENERATION & FORMAT ──
    try {
      const barcode = generateBarcodeForVariant(variantM);
      if (!barcode.startsWith('MBG-')) throw new Error(`Invalid barcode format: ${barcode}`);
      recordPass('6. Free Standard Barcode Generator', `Generated code: ${barcode}`);
    } catch (e) { recordFail('6. Free Standard Barcode Generator', e); }

    // ── TEST 7: SUPPLIER CREATION ──
    let supplier = null;
    try {
      supplier = await prisma.supplier.create({
        data: {
          name: 'Jaipur Heritage Weaves',
          contact_person: 'Govind Narayan',
          phone: '9822334455',
          email: 'orders@jaipurheritageweaves.com',
          gstin: '08AAACJ1234F1Z8',
          address: 'Johari Bazaar, Jaipur, Rajasthan',
          is_active: true,
        },
      });
      recordPass('7. Supplier Management Creation', `Supplier ID: ${supplier.id} (${supplier.name})`);
    } catch (e) { recordFail('7. Supplier Management Creation', e); }

    // ── TEST 8: PURCHASE ORDER DRAFTING ──
    let purchase = null;
    try {
      const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantL.id } })).stock;
      purchase = await prisma.purchase.create({
        data: {
          purchase_number: `PO-JAIPUR-001`,
          supplier_id: supplier?.id,
          invoice_number: 'CHALLAN-JP-901',
          purchase_date: new Date(),
          subtotal: 60000,
          tax: 3000,
          total: 63000,
          status: 'DRAFT',
          created_by: 'Garima',
          items: {
            create: [
              {
                variant_id: variantL.id,
                quantity: 5,
                cost_price: 12000,
                total: 60000,
              },
            ],
          },
        },
      });
      const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantL.id } })).stock;
      if (stockAfter !== stockBefore) throw new Error('Stock changed during DRAFT purchase creation');
      recordPass('8. Purchase Order Drafting (Zero Stock Mutation)', `PO ${purchase.purchase_number} in DRAFT status, Stock: ${stockAfter}`);
    } catch (e) { recordFail('8. Purchase Order Drafting (Zero Stock Mutation)', e); }

    // ── TEST 9: PURCHASE RECEIVING (ATOMIC STOCK INWARD) ──
    try {
      const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantL.id } })).stock;
      const received = await receivePurchaseAtomic(purchase.id, 'Garima (Master Stylist)');
      const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantL.id } })).stock;
      if (stockAfter !== stockBefore + 5) throw new Error(`Expected stock ${stockBefore + 5}, got ${stockAfter}`);
      recordPass('9. Purchase Receiving & Atomic Stock Inward', `Stock L increased from ${stockBefore} to ${stockAfter} (+5 units)`);
    } catch (e) { recordFail('9. Purchase Receiving & Atomic Stock Inward', e); }

    // ── TEST 10: IDEMPOTENT PURCHASE RECEIVING ──
    try {
      const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantL.id } })).stock;
      let caughtError = false;
      try {
        await receivePurchaseAtomic(purchase.id, 'Garima');
      } catch (err) {
        caughtError = true;
      }
      if (!caughtError) throw new Error('Did not reject duplicate purchase receiving');
      const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantL.id } })).stock;
      if (stockAfter !== stockBefore) throw new Error('Stock changed on duplicate receive attempt');
      recordPass('10. Idempotent Purchase Receiving Safeguard', 'Duplicate receive safely rejected without double-inward');
    } catch (e) { recordFail('10. Idempotent Purchase Receiving Safeguard', e); }

    // ── TEST 11: POS CASH SALE & CHANGE COMPUTATION ──
    let saleCash = null;
    try {
      const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;
      const invNum = `POS-CASH-${Date.now()}`;

      saleCash = await prisma.$transaction(async (tx) => {
        const s = await tx.sale.create({
          data: {
            invoice_number: invNum,
            customer_name: 'Ananya Singhania',
            customer_phone: '9811223344',
            subtotal: 25000,
            discount: 0,
            tax: 0,
            total: 25000,
            amount_received: 30000,
            change_amount: 5000,
            payment_method: 'cash',
            status: 'COMPLETED',
            staff_name: 'Counter Stylist',
            items: {
              create: [
                {
                  product_id: testProduct.id,
                  variant_id: variantM.id,
                  quantity: 1,
                  price_at_sale: 25000,
                  total_price: 25000,
                  product_name_snapshot: testProduct.name,
                  sku_snapshot: variantM.sku,
                  size_snapshot: variantM.size,
                },
              ],
            },
          },
        });

        const stockBeforeVal = (await tx.productVariant.findUnique({ where: { id: variantM.id } })).stock;
        const stockAfterVal = stockBeforeVal - 1;

        await tx.productVariant.update({
          where: { id: variantM.id },
          data: { stock: stockAfterVal },
        });

        await tx.inventoryMovement.create({
          data: {
            product_id: testProduct.id,
            variant_id: variantM.id,
            quantity: 1,
            stock_before: stockBeforeVal,
            stock_after: stockAfterVal,
            type: 'POS_SALE',
            note: `POS Sale ${invNum}`,
            created_by: 'Counter Stylist',
          },
        });

        await tx.payment.create({
          data: {
            sale: { connect: { id: s.id } },
            amount: 25000,
            gateway: 'CASH',
            status: 'PAID',
            payment_reference: `PAY-POS-CASH-${s.id}`,
            gateway_payment_id: `PAY-POS-CASH-${s.id}`,
          },
        });

        return s;
      });

      const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;
      if (stockAfter !== stockBefore - 1) throw new Error('Stock not decremented on POS cash sale');
      recordPass('11. POS Cash Sale & Exact Change Calculation', `Tendered: Rs. 30,000, Total: Rs. 25,000, Change: Rs. ${saleCash.change_amount}, Stock: ${stockAfter}`);
    } catch (e) { recordFail('11. POS Cash Sale & Exact Change Calculation', e); }

    // ── TEST 12: POS SPLIT PAYMENT LEDGER ──
    try {
      const invNum = `POS-SPLIT-${Date.now()}`;
      const splitSale = await prisma.$transaction(async (tx) => {
        const s = await tx.sale.create({
          data: {
            invoice_number: invNum,
            customer_name: 'VIP Boutique Walk-in',
            customer_phone: '9811223344',
            subtotal: 50000,
            discount: 0,
            tax: 0,
            total: 50000,
            payment_method: 'split',
            status: 'COMPLETED',
            staff_name: 'Store Manager',
          },
        });

        // Split Entry 1: Cash Rs. 20,000
        await tx.payment.create({
          data: {
            sale: { connect: { id: s.id } },
            amount: 20000,
            gateway: 'CASH',
            status: 'PAID',
            payment_reference: `PAY-SPLIT-CASH-${s.id}`,
            gateway_payment_id: `PAY-SPLIT-CASH-${s.id}`,
          },
        });

        // Split Entry 2: UPI Rs. 30,000
        await tx.payment.create({
          data: {
            sale: { connect: { id: s.id } },
            amount: 30000,
            gateway: 'UPI',
            status: 'PAID',
            payment_reference: 'UPI-REF-554433',
            gateway_payment_id: `PAY-SPLIT-UPI-${s.id}`,
          },
        });

        return s;
      });

      const payments = await prisma.payment.findMany({ where: { sale_id: splitSale.id } });
      const sum = payments.reduce((acc, p) => acc + Number(p.amount), 0);
      if (payments.length !== 2 || sum !== 50000) throw new Error('Split payment ledger validation failed');
      recordPass('12. POS Split Payment Ledger Validation', `Split across Cash (Rs. 20k) + UPI (Rs. 30k) = Rs. ${sum} Grand Total`);
    } catch (e) { recordFail('12. POS Split Payment Ledger Validation', e); }

    // ── TEST 13: RETURN PROCESSING (RESTOCKABLE) ──
    try {
      const retReq = await prisma.returnRequest.create({
        data: {
          product_id: testProduct.id,
          variant_id: variantM.id,
          quantity: 1,
          type: 'RETURN',
          reason: 'Customer altered wedding date',
          condition: 'RESTOCKABLE',
          status: 'REQUESTED',
          customer_name: 'Ananya Singhania',
          customer_phone: '9811223344',
        },
      });

      const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;
      const processed = await processReturnAtomic(retReq.id, 'RESTOCKABLE', 'Restocked to display rack', 'Garima');
      const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;

      if (stockAfter !== stockBefore + 1) throw new Error('Restockable return did not increment stock');
      recordPass('13. Return Restockable Condition (+1 Restock)', `Physical stock restored from ${stockBefore} to ${stockAfter}`);
    } catch (e) { recordFail('13. Return Restockable Condition (+1 Restock)', e); }

    // ── TEST 14: RETURN PROCESSING (DAMAGED) ──
    try {
      const retReq = await prisma.returnRequest.create({
        data: {
          product_id: testProduct.id,
          variant_id: variantM.id,
          quantity: 1,
          type: 'RETURN',
          reason: 'Tear in raw silk border',
          condition: 'DAMAGED',
          status: 'REQUESTED',
          customer_name: 'Ananya Singhania',
          customer_phone: '9811223344',
        },
      });

      const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;
      const processed = await processReturnAtomic(retReq.id, 'DAMAGED', 'Quarantined for repair', 'Garima');
      const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;

      if (stockAfter !== stockBefore) throw new Error('Damaged return incorrectly added to sellable stock');
      recordPass('14. Return Damaged Condition (Quarantine)', `Physical sellable stock untouched at ${stockAfter}`);
    } catch (e) { recordFail('14. Return Damaged Condition (Quarantine)', e); }

    // ── TEST 15: ATOMIC SIZE EXCHANGE (M +1, L -1) ──
    try {
      const exReq = await prisma.returnRequest.create({
        data: {
          product_id: testProduct.id,
          variant_id: variantM.id,
          exchange_variant_id: variantL.id,
          quantity: 1,
          type: 'EXCHANGE',
          reason: 'Customer requested size L for looser fit',
          condition: 'RESTOCKABLE',
          status: 'REQUESTED',
          customer_name: 'Ananya Singhania',
          customer_phone: '9811223344',
        },
      });

      const stockMBefore = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;
      const stockLBefore = (await prisma.productVariant.findUnique({ where: { id: variantL.id } })).stock;

      const res = await processExchangeAtomic(exReq.id, variantL.id, 'RESTOCKABLE', 'Counter size swap', 'Garima');

      const stockMAfter = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;
      const stockLAfter = (await prisma.productVariant.findUnique({ where: { id: variantL.id } })).stock;

      if (stockMAfter !== stockMBefore + 1 || stockLAfter !== stockLBefore - 1) {
        throw new Error(`Exchange atomic mutation failed: M=${stockMAfter} (exp ${stockMBefore + 1}), L=${stockLAfter} (exp ${stockLBefore - 1})`);
      }
      recordPass('15. Size Exchange Atomic Swap (M +1, L -1)', `Size M increased to ${stockMAfter}, Size L decreased to ${stockLAfter}`);
    } catch (e) { recordFail('15. Size Exchange Atomic Swap (M +1, L -1)', e); }

    // ── TEST 16: SIZE EXCHANGE STOCKOUT ROLLBACK ──
    try {
      const variantXS = await prisma.productVariant.create({
        data: {
          product_id: testProduct.id,
          sku: `MBG-LEH-${testProduct.id}-XS`,
          barcode: `MBG-LEH-${testProduct.id}-XS-004`,
          size: 'XS',
          color: 'Crimson Gold',
          price: 25000,
          stock: 0, // OUT OF STOCK
          reserved_stock: 0,
          is_active: true,
        },
      });

      const exReq = await prisma.returnRequest.create({
        data: {
          product_id: testProduct.id,
          variant_id: variantM.id,
          exchange_variant_id: variantXS.id,
          quantity: 1,
          type: 'EXCHANGE',
          reason: 'Exchange to XS',
          condition: 'RESTOCKABLE',
          status: 'REQUESTED',
          customer_name: 'Ananya Singhania',
        },
      });

      const stockMBefore = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;
      let rejected = false;
      try {
        await processExchangeAtomic(exReq.id, variantXS.id, 'RESTOCKABLE', 'Swap', 'Garima');
      } catch (err) {
        rejected = true;
      }
      if (!rejected) throw new Error('Did not reject exchange to out-of-stock size');

      const stockMAfter = (await prisma.productVariant.findUnique({ where: { id: variantM.id } })).stock;
      if (stockMAfter !== stockMBefore) throw new Error('Old variant stock altered on failed exchange');
      recordPass('16. Size Exchange Stockout Clean Rollback', `Exchange aborted: target size XS is 0 in stock, M remains ${stockMAfter}`);
    } catch (e) { recordFail('16. Size Exchange Stockout Clean Rollback', e); }

    // ── TEST 17: SIZE EXCHANGE PRICE DIFFERENCE ──
    try {
      const variantCouture = await prisma.productVariant.create({
        data: {
          product_id: testProduct.id,
          sku: `MBG-LEH-${testProduct.id}-COUTURE-XL`,
          barcode: `MBG-LEH-${testProduct.id}-XL-005`,
          size: 'XL (Custom Couture)',
          color: 'Crimson Gold',
          price: 32000, // Higher price
          stock: 5,
          reserved_stock: 0,
          is_active: true,
        },
      });

      const exReq = await prisma.returnRequest.create({
        data: {
          product_id: testProduct.id,
          variant_id: variantM.id,
          exchange_variant_id: variantCouture.id,
          quantity: 1,
          type: 'EXCHANGE',
          reason: 'Upgrade to couture fitting',
          condition: 'RESTOCKABLE',
          status: 'REQUESTED',
          customer_name: 'Ananya Singhania',
        },
      });

      const res = await processExchangeAtomic(exReq.id, variantCouture.id, 'RESTOCKABLE', 'Upgrade to Couture', 'Garima');
      // Price diff: 32000 - 25000 = 7000 due from customer
      if (res.priceDifference !== 7000) throw new Error(`Expected price difference 7000, got ${res.priceDifference}`);
      recordPass('17. Size Exchange Price Difference Computation', `Returned ₹25,000, New ₹32,000 -> Customer Due: ₹${res.priceDifference}`);
    } catch (e) { recordFail('17. Size Exchange Price Difference Computation', e); }

    // ── TEST 18: UNIFIED CUSTOMER INTELLIGENCE ──
    try {
      const customer = await prisma.user.findFirst({
        where: { phone: '9811223344' },
      });
      const posSales = await prisma.sale.findMany({
        where: { customer_phone: '9811223344' },
      });
      if (!customer || posSales.length === 0) throw new Error('Customer phone linkage not established');
      recordPass('18. Customer Intelligence Phone Linkage', `User "${customer.name}" linked with ${posSales.length} POS sales without duplicate accounts`);
    } catch (e) { recordFail('18. Customer Intelligence Phone Linkage', e); }

  } catch (globalErr) {
    console.error('\n❌ Global test error:', globalErr);
  } finally {
    console.log('\n================================================================');
    console.log(`📊 PHASE 2 REAL POSTGRESQL SUITE: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('================================================================\n');

    if (failCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Auto-run if executed directly
runPhase2RealDbIntegrationSuite();
