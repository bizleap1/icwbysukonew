require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

function splitSqlStatements(sqlText) {
  // Simple parser to split on semicolons while keeping DO $$ ... END $$; blocks intact
  const statements = [];
  let current = '';
  let inDollarBlock = false;

  const lines = sqlText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue; // skip full comment lines

    if (trimmed.includes('$$')) {
      // Toggle dollar block
      const count = (trimmed.match(/\$\$/g) || []).length;
      if (count % 2 === 1) inDollarBlock = !inDollarBlock;
    }

    current += line + '\n';

    if (!inDollarBlock && trimmed.endsWith(';')) {
      const cleanStmt = current.trim();
      if (cleanStmt.length > 0) {
        statements.push(cleanStmt);
      }
      current = '';
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

async function deployMigrations() {
  console.log("🚀 Starting forward migration deployment to Neon PostgreSQL...\n");
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log("✅ Connected to Neon PostgreSQL database successfully.");

    // 1. Ensure _prisma_migrations table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 2. Fetch already applied migrations
    const appliedRows = await prisma.$queryRawUnsafe(`SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL`);
    const appliedNames = new Set(appliedRows.map(r => r.migration_name));
    console.log(`📋 Found ${appliedNames.size} already applied migration(s) in database.\n`);

    // 3. Scan prisma/migrations directory in sequential order
    const migrationsDir = path.join(__dirname, '../../prisma/migrations');
    const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

    for (const migrationName of entries) {
      if (appliedNames.has(migrationName)) {
        console.log(`⏭️  Already applied: ${migrationName}`);
        continue;
      }

      const sqlPath = path.join(migrationsDir, migrationName, 'migration.sql');
      if (!fs.existsSync(sqlPath)) {
        console.warn(`⚠️  No migration.sql found in ${migrationName}, skipping.`);
        continue;
      }

      console.log(`⏳ Applying migration: ${migrationName}...`);
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');
      const migrationId = crypto.randomUUID();

      const startTime = new Date();
      const statements = splitSqlStatements(sqlContent);

      for (const stmt of statements) {
        if (stmt.trim()) {
          await prisma.$executeRawUnsafe(stmt);
        }
      }

      const finishTime = new Date();

      // Record migration in _prisma_migrations
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
        VALUES ($1, $2, $3, $4, $5, 1)
      `, migrationId, checksum, finishTime, migrationName, startTime);

      console.log(`✅ Successfully applied: ${migrationName} (${finishTime - startTime}ms)`);
    }

    console.log("\n🎉 ALL MIGRATIONS SUCCESSFULLY DEPLOYED TO NEON POSTGRESQL!\n");

    // Verify current database tables
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("📊 Live PostgreSQL Tables:", tables.map(t => t.table_name));

  } catch (err) {
    console.error("❌ Migration Deployment Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deployMigrations();
