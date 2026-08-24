#!/usr/bin/env node
const dotenv = require('dotenv');
dotenv.config();

const { sweepExpiredReservations } = require('../utils/inventory.service');
const prisma = require('../prisma/client');

async function main() {
  console.log(`[${new Date().toISOString()}] 🕒 Starting standalone inventory reservation sweep...`);
  try {
    const result = await sweepExpiredReservations();
    console.log(`[${new Date().toISOString()}] ✅ Standalone sweep completed: ${result.sweptCount} expired reservations released.`);
    if (result.errors.length > 0) {
      console.warn(`[${new Date().toISOString()}] ⚠️ Encountered ${result.errors.length} errors during sweep.`, result.errors);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Standalone sweep failed:`, err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
