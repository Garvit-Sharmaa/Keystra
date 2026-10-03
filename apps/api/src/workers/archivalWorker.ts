
import { pool }   from '../config/database';
import { logger } from '../utils/logger';
import type { ArchivalJobPayload } from '../config/bullmq';

/**
 * Nulls out keystroke_payload on sessions older than `olderThanDays` days.
 * Data is already aggregated into weak_keys — the raw payload is no longer
 * needed and keeping it inflates the typing_sessions table over time.
 *
 * Idempotent — safe to call multiple times; the WHERE clause prevents
 * already-archived rows from being touched again.
 */
export async function processArchival(olderThanDays: number): Promise<void> {
  const { rowCount } = await pool.query(
    `UPDATE typing_sessions
     SET    keystroke_payload = NULL,
            payload_archived  = true
     WHERE  payload_archived  = false
       AND  keystroke_payload IS NOT NULL
       AND  completed_at < NOW() - INTERVAL '${olderThanDays} days'
     RETURNING id`,
  );

  logger.info({ archivedCount: rowCount, olderThanDays }, 'Archival complete');
}


/* ═══════════════════════════════════════════════════════════════════════════
   === BACKUP: OLD BULLMQ ===
   BullMQ Worker consumer that polled Redis for archival jobs.
   Disabled in Phase 5 — no longer started from server.ts.
   To revert: uncomment this block, re-enable the Queue instances in
   bullmq.ts (COMPATIBILITY SHIM), and restore the imports in server.ts.
   ═══════════════════════════════════════════════════════════════════════════

import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { QUEUES } from '../config/bullmq';

async function processArchivalJob(job: Job<ArchivalJobPayload>): Promise<void> {
  const { olderThanDays } = job.data;
  await processArchival(olderThanDays);
}

export function startArchivalWorker(): Worker {
  const worker = new Worker<ArchivalJobPayload>(
    QUEUES.ARCHIVAL,
    processArchivalJob,
    { connection: redis, concurrency: 1, stalledInterval: 300000 },
  );
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err }, 'archivalWorker failed'),
  );
  logger.info('archivalWorker started');
  return worker;
}

   === END BACKUP: OLD BULLMQ ===
   ═══════════════════════════════════════════════════════════════════════════ */
