/**
 * chapterProgress.service.ts
 *
 * Server-side persistence for chapter-level completion.
 * Writes to the chapter_progress table (migration 009).
 *
 * DESIGN:
 *   • markChapterComplete is idempotent (ON CONFLICT DO UPDATE):
 *     re-completing at a higher difficulty overwrites the row.
 *   • listCompletedChapters is a bulk fetch — one DB round-trip
 *     for the entire academy page load.
 *   • No QStash dispatched here: chapter completion is a fast
 *     synchronous write (< 5ms). Heavy XP/achievement processing
 *     is already handled by the session submission webhook.
 */

import { pool } from '../../config/database';

export interface ChapterProgressRow {
  chapterId:       string;
  difficulty:      'easy' | 'intermediate' | 'professional';
  wpmAchieved:     number;
  accuracyAchieved:number;
  completedAt:     string; // ISO timestamp
}

export interface MarkChapterInput {
  userId:          string;
  chapterId:       string;
  difficulty:      'easy' | 'intermediate' | 'professional';
  wpmAchieved:     number;
  accuracyAchieved:number;
}

/**
 * Bulk-fetch all completed chapters for a user.
 * Called once on /learn page load.
 */
export async function listCompletedChapters(
  userId: string,
): Promise<ChapterProgressRow[]> {
  const { rows } = await pool.query<{
    chapter_id:       string;
    difficulty:       string;
    wpm_achieved:     number;
    accuracy_achieved:number;
    completed_at:     Date;
  }>(
    `SELECT chapter_id, difficulty, wpm_achieved, accuracy_achieved, completed_at
       FROM chapter_progress
      WHERE user_id = $1
      ORDER BY completed_at ASC`,
    [userId],
  );

  return rows.map((r) => ({
    chapterId:        r.chapter_id,
    difficulty:       r.difficulty as ChapterProgressRow['difficulty'],
    wpmAchieved:      r.wpm_achieved,
    accuracyAchieved: r.accuracy_achieved,
    completedAt:      r.completed_at.toISOString(),
  }));
}

/**
 * Mark a chapter as complete (or upgrade the difficulty record).
 *
 * Idempotent: ON CONFLICT updates the row so a user who re-takes a
 * chapter at Professional difficulty gets credit for the harder run.
 */
export async function markChapterComplete(
  input: MarkChapterInput,
): Promise<void> {
  await pool.query(
    `INSERT INTO chapter_progress
       (user_id, chapter_id, difficulty, wpm_achieved, accuracy_achieved, completed_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (user_id, chapter_id)
     DO UPDATE SET
       difficulty        = EXCLUDED.difficulty,
       wpm_achieved      = EXCLUDED.wpm_achieved,
       accuracy_achieved = EXCLUDED.accuracy_achieved,
       completed_at      = NOW()`,
    [
      input.userId,
      input.chapterId,
      input.difficulty,
      input.wpmAchieved,
      input.accuracyAchieved,
    ],
  );
}
