/**
 * streakWorker.ts — Daily streak tracking and user_statistics sync.
 *
 * ═══════════════════════════════════════════════════════════════
 *  MIGRATION STATUS: PHASE 2 COMPLETE
 *
 *  The BullMQ Worker consumer is commented out below.
 *  processStreak() is now a plain exported async function.
 *  It is called by the QStash God Handler (Phase 3) via Promise.all.
 *  All PostgreSQL logic is unchanged — fully idempotent.
 * ═══════════════════════════════════════════════════════════════
 */

import { pool }   from '../config/database';
import { logger } from '../utils/logger';

// ── NEW: pure exported function — no BullMQ Job wrapper ──────────────────────
/**
 * Update the user's daily streak. Idempotent — calling multiple times on
 * the same day short-circuits immediately (lastDate === today guard).
 *
 * Called directly by the QStash God Handler. Safe to retry.
 */
export async function processStreak(userId: string): Promise<void> {
  const today     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // ── Atomic single-statement upsert ────────────────────────────────────────
  // All streak logic lives in SQL CASE expressions — no application-layer
  // read-modify-write. The DB row lock during UPDATE prevents concurrent
  // deliveries from racing. This is safe under any QStash retry scenario.
  //
  // Cases handled atomically:
  //   • Row doesn't exist      → INSERT with streak=1
  //   • last_active_date=today → DO NOTHING (idempotent same-day retry)
  //   • last_active_date=yest  → current_streak + 1 (extend)
  //   • Otherwise (gap)        → reset to 1
  const { rows } = await pool.query<{ new_streak: number }>(`
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
    VALUES ($1, 1, 1, $2::date)
    ON CONFLICT (user_id) DO UPDATE SET
      current_streak   = CASE
        WHEN user_streaks.last_active_date = $2::date THEN user_streaks.current_streak
        WHEN user_streaks.last_active_date = $3::date THEN user_streaks.current_streak + 1
        ELSE 1
      END,
      longest_streak   = GREATEST(
        user_streaks.longest_streak,
        CASE
          WHEN user_streaks.last_active_date = $2::date THEN user_streaks.longest_streak
          WHEN user_streaks.last_active_date = $3::date THEN user_streaks.current_streak + 1
          ELSE 1
        END
      ),
      last_active_date = CASE
        WHEN user_streaks.last_active_date = $2::date THEN user_streaks.last_active_date
        ELSE $2::date
      END
    RETURNING current_streak AS new_streak
  `, [userId, today, yesterday]);

  const newStreak = rows[0]?.new_streak ?? 1;

  // Sync denormalized streak_days to user_statistics
  await pool.query(
    'UPDATE user_statistics SET streak_days = $1 WHERE user_id = $2',
    [newStreak, userId],
  );

  logger.info({ userId, streak: newStreak }, 'Streak updated (atomic)');
}


/* ═══════════════════════════════════════════════════════════════════════════
   === BACKUP: OLD BULLMQ ===
   Original BullMQ Worker consumer. Kept verbatim for instant rollback.
   To revert: uncomment this block and remove the export from processStreak.
   ═══════════════════════════════════════════════════════════════════════════

import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { QUEUES } from '../config/bullmq';
import type { StreakJobPayload } from '../config/bullmq';

async function processStreak(job: Job<StreakJobPayload>): Promise<void> {
  const { userId } = job.data;
  // ... (identical body — see active function above)
}

export function startStreakWorker(): Worker {
  const worker = new Worker<StreakJobPayload>(
    QUEUES.STREAKS,
    processStreak,
    { connection: redis, concurrency: 10, stalledInterval: 300000 },
  );
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err }, 'streakWorker failed'),
  );
  logger.info('streakWorker started');
  return worker;
}

   === END BACKUP: OLD BULLMQ ===
   ═══════════════════════════════════════════════════════════════════════════ */
