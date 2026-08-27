import EmbeddedPostgres from 'embedded-postgres';
import net from 'net';
import fs from 'fs';
import path from 'path';

function isPortOpen(port, host = '127.0.0.1', timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

let pgInstance = null;

export async function ensureDatabaseRunning() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
    console.log('🐘 [Database] Remote PostgreSQL configured (Neon Cloud).');
    return;
  }

  const isRunning = await isPortOpen(5432, '127.0.0.1');
  if (isRunning) {
    console.log('🐘 [Database] PostgreSQL is active and ready on port 5432.');
    return;
  }

  console.log('🐘 [Database] PostgreSQL not detected on port 5432. Launching Embedded PostgreSQL...');
  try {
    const dbDir = './.pgdata';
    const pidFile = path.join(dbDir, 'postmaster.pid');

    // Clean up stale lock file if previous process exited abruptly
    if (fs.existsSync(pidFile)) {
      try {
        fs.unlinkSync(pidFile);
        console.log('🧹 [Database] Cleaned up stale postmaster.pid lock file.');
      } catch (_) {}
    }

    pgInstance = new EmbeddedPostgres({
      port: 5432,
      databaseDir: dbDir,
      user: 'postgres',
      password: 'password',
      db: 'postgres',
      persistent: true,
    });

    const isInitialized = fs.existsSync(path.join(dbDir, 'PG_VERSION'));
    if (!isInitialized) {
      try {
        await pgInstance.initialise();
      } catch (initErr) {
        // Already initialized
      }
    }

    await pgInstance.start();
    console.log('✅ [Database] Embedded PostgreSQL started successfully on port 5432.');
  } catch (err) {
    console.log('ℹ️ [Database] PostgreSQL is active or already running on port 5432.');
  }
}

// Clean shutdown handler
process.on('SIGINT', async () => {
  if (pgInstance) {
    try {
      await pgInstance.stop();
    } catch (_) {}
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (pgInstance) {
    try {
      await pgInstance.stop();
    } catch (_) {}
  }
  process.exit(0);
});
