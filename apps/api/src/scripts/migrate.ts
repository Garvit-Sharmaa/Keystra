/**
 * migrate.ts — Run all SQL migration files in order, idempotently.
 *
 * Uses a `migrations_log` table to track which files have already run.
 * Safe to run multiple times — already-applied migrations are skipped.
 *
 * Usage: npm run migrate
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

async function migrate(): Promise<void> {
  // Bootstrap the migrations log table (idempotent)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations_log (
      filename    TEXT        PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = join(__dirname, '../../migrations');
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort(); // lexicographic order ensures 001_ before 002_

  // Fetch already-applied files in one round-trip
  const { rows: applied } = await pool.query<{ filename: string }>(
    `SELECT filename FROM migrations_log`,
  );
  const appliedSet = new Set(applied.map((r) => r.filename));

  logger.info(`Found ${files.length} migration file(s) — ${appliedSet.size} already applied`);

  let ran = 0;
  for (const file of files) {
    if (appliedSet.has(file)) {
      logger.info(`⏭  Skipping (already applied): ${file}`);
      continue;
    }

    const sql = await readFile(join(migrationsDir, file), 'utf-8');
    logger.info(`Running: ${file}`);

    // Wrap in a transaction so a half-run migration doesn't corrupt state
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO migrations_log (filename) VALUES ($1)`,
        [file],
      );
      await client.query('COMMIT');
      logger.info(`✅ ${file} complete`);
      ran++;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ err, file }, `❌ Migration failed: ${file}`);
      throw err;
    } finally {
      client.release();
    }
  }

  if (ran === 0) {
    logger.info('No new migrations to apply — database is up to date');
  } else {
    logger.info(`All ${ran} new migration(s) applied successfully`);
  }

  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
