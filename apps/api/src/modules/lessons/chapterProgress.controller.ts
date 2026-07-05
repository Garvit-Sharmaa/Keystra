import { Request, Response, NextFunction } from 'express';
import { z }                               from 'zod';
import {
  listCompletedChapters,
  markChapterComplete,
} from './chapterProgress.service';
import {
  CHAPTER_MAP,
  DIFFICULTY_MODIFIERS,
  type ApiDifficulty,
} from './chapterMap';

// ── Validation schema for POST /api/lessons/progress ─────────────────────────
const MarkProgressSchema = z.object({
  chapterId:        z.string().regex(
    /^\d+\.\d+$/,
    'chapterId must be in "lessonNumber.chapterIndex" format, e.g. "1.4"',
  ),
  difficulty:       z.enum(['easy', 'intermediate', 'professional']),
  wpmAchieved:      z.number().int().min(0).max(500),
  accuracyAchieved: z.number().int().min(0).max(100),
});

// GET /api/lessons/progress
// Returns all completed chapter IDs for the authenticated user.
export async function handleListProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId  = req.user!.sub;
    const chapters = await listCompletedChapters(userId);

    res.json({
      success: true,
      data: { chapters, total: chapters.length },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/lessons/progress
// Marks a chapter as complete — but ONLY after server-side pass/fail
// verification against the authority map in chapterMap.ts.
// The client CANNOT mark a test chapter as complete by calling this endpoint
// directly; the server enforces the WPM and accuracy thresholds independently.
export async function handleMarkProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = MarkProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid progress payload',
          code:    'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const userId = req.user!.sub;
    const { chapterId, difficulty, wpmAchieved, accuracyAchieved } = parsed.data;

    // ── 1. Look up server-side chapter authority ──────────────────────────────
    const chapter = CHAPTER_MAP.get(chapterId);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: {
          message: `Chapter "${chapterId}" does not exist in the curriculum`,
          code:    'CHAPTER_NOT_FOUND',
        },
      });
      return;
    }

    // ── 2. Enforce pass/fail for test chapters ────────────────────────────────
    // Non-test chapters (tutorial, drill, game) are always markable complete.
    if (chapter.type === 'test' && chapter.basePassingWpm !== undefined) {
      const mod      = DIFFICULTY_MODIFIERS[difficulty as ApiDifficulty];
      const reqWpm   = Math.round(chapter.basePassingWpm * mod.wpmMultiplier);
      const reqAcc   = mod.accuracyReq;

      const passed   = wpmAchieved >= reqWpm && accuracyAchieved >= reqAcc;

      if (!passed) {
        res.status(422).json({
          success: false,
          error: {
            message:  `Chapter test not passed`,
            code:     'CHAPTER_TEST_FAILED',
            required: { wpm: reqWpm, accuracy: reqAcc },
            achieved: { wpm: wpmAchieved, accuracy: accuracyAchieved },
          },
        });
        return;
      }
    }

    // ── 3. Idempotent upsert ──────────────────────────────────────────────────
    await markChapterComplete({ userId, chapterId, difficulty, wpmAchieved, accuracyAchieved });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

