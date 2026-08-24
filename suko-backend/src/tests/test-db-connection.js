require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log("Attempting connection to PostgreSQL database...");
  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  try {
    await prisma.$connect();
    console.log("✅ PRISMA CONNECTED TO DATABASE SUCCESSFULLY!");
    
    const result = await prisma.$queryRawUnsafe('SELECT current_database(), now() as server_time, version()');
    console.log("✅ QUERY RESULT:", result);
    
    const migrationCount = await prisma.$queryRawUnsafe('SELECT count(*) FROM "_prisma_migrations"').catch(() => 'No _prisma_migrations table yet');
    console.log("✅ MIGRATIONS TABLE CHECK:", migrationCount);
  } catch (err) {
    console.error("❌ DATABASE CONNECTION ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
