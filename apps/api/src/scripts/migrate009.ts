/**
 * migrate009.ts — Run only migration 009_chapter_progress.sql
 * Usage (from apps/api):
 *   npx dotenv-cli -e .env -- tsx src/scripts/migrate009.ts
 *
 * This script is idempotent: it uses IF NOT EXISTS so it is safe
 * to run multiple times against an existing database.
 */

import { readFile } from 'fs/promises';
import { join }     from 'path';
import { pool }     from '../config/database';
import { logger }   from '../utils/logger';

async function run(): Promise<void> {
  const migrationFile = join(__dirname, '../../migrations/009_chapter_progress.sql');
  const sql           = await readFile(migrationFile, 'utf-8');

  logger.info('Running migration: 009_chapter_progress.sql');
  await pool.query(sql);
  logger.info('✅ Migration 009 complete — chapter_progress table created');

  // Verify the table exists
  const { rows } = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename  = 'chapter_progress'`,
  );

  if (rows.length > 0) {
    logger.info('✅ Verified: chapter_progress table is present in pg_tables');
  } else {
    logger.error('❌ Table chapter_progress not found after migration — check for errors above');
    process.exitCode = 1;
  }

  await pool.end();
}

run().catch((err) => {
  logger.error({ err }, '❌ Migration 009 failed');
  process.exit(1);
});
