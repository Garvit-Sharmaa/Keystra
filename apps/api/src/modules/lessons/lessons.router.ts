import { Router }     from 'express';
import { requireAuth, optionalAuth } from '../../middleware/authMiddleware';
import {
  handleListLessons,
  handleGenerateLesson,
} from './lessons.controller';
import {
  handleListProgress,
  handleMarkProgress,
} from './chapterProgress.controller';

const router = Router();

/**
 * GET /api/lessons
 * Returns the full curriculum with per-user lesson lock status.
 * Optional auth: guests see only Lesson 1 unlocked.
 */
router.get('/', optionalAuth, handleListLessons);

/**
 * GET /api/lessons/progress
 * Returns all completed chapter IDs for the authenticated user.
 * Used by the /learn page to hydrate server-persisted completion state.
 *
 * IMPORTANT: this route MUST be registered before /:id/generate so that
 * Express doesn't interpret "progress" as a lesson ID.
 */
router.get('/progress', requireAuth, handleListProgress);

/**
 * POST /api/lessons/progress
 * Marks a chapter complete (idempotent upsert).
 * Body: { chapterId, difficulty, wpmAchieved, accuracyAchieved }
 *
 * The client validates pass/fail against difficulty thresholds before
 * calling this endpoint. The server persists what the client reports.
 */
router.post('/progress', requireAuth, handleMarkProgress);

/**
 * GET /api/lessons/:id/generate
 * Generate an adaptive word payload for a given LessonConfig ID.
 * Protected: JWT required — weak key data fetched for personalisation.
 */
router.get('/:id/generate', requireAuth, handleGenerateLesson);

export default router;
