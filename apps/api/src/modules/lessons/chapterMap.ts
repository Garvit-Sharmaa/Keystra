/**
 * chapterMap.ts — Server-side authority map of all chapter test thresholds.
 *
 * WHY THIS EXISTS:
 *   The frontend curriculum.ts defines chapter metadata for the UI.
 *   The API cannot import from apps/web, so this file duplicates *only*
 *   the security-critical fields (type, basePassingWpm) for server-side
 *   pass/fail enforcement in chapterProgress.controller.ts.
 *
 *   Only `type: 'test'` chapters are in this map — drill/tutorial chapters
 *   have no pass/fail thresholds and are always markable as complete.
 *
 * MAINTENANCE:
 *   When you add a new Lesson/Chapter to apps/web/src/lib/curriculum.ts,
 *   update this file if the new chapter has type: 'test'.
 */

export type ApiChapterType = 'tutorial' | 'drill' | 'game' | 'test';
export type ApiDifficulty  = 'easy' | 'intermediate' | 'professional';

export interface ApiChapterMeta {
  type:           ApiChapterType;
  /** Base WPM threshold before difficulty scaling. undefined = no WPM gate */
  basePassingWpm?: number;
}

/**
 * All chapter IDs → their server-side meta.
 * Keys are localized IDs (e.g. "1.6", "2.9").
 */
export const CHAPTER_MAP = new Map<string, ApiChapterMeta>([
  // ── Lesson 1 — Home Row Foundations ──────────────────────────────────────
  ['1.0', { type: 'tutorial' }],
  ['1.1', { type: 'drill'    }],
  ['1.2', { type: 'drill'    }],
  ['1.3', { type: 'drill'    }],
  ['1.4', { type: 'drill'    }],
  ['1.5', { type: 'drill'    }],
  ['1.6', { type: 'test',    basePassingWpm: 30 }],  // Final Boss L1

  // ── Lesson 2 — Upper Row Expansion ────────────────────────────────────────
  ['2.0', { type: 'tutorial' }],
  ['2.1', { type: 'drill'    }],
  ['2.2', { type: 'drill'    }],
  ['2.3', { type: 'drill'    }],
  ['2.4', { type: 'drill'    }],
  ['2.5', { type: 'drill'    }],
  ['2.6', { type: 'drill'    }],
  ['2.7', { type: 'drill'    }],
  ['2.8', { type: 'drill'    }],
  ['2.9', { type: 'test',    basePassingWpm: 40 }],  // Final Boss L2

  // ── Lesson 3 — Bottom Row & Completion ───────────────────────────────────
  ['3.0', { type: 'tutorial' }],
  ['3.1', { type: 'drill'    }],
  ['3.2', { type: 'drill'    }],
  ['3.3', { type: 'drill'    }],
  ['3.4', { type: 'drill'    }],
  ['3.5', { type: 'drill'    }],
  ['3.6', { type: 'drill'    }],
  ['3.7', { type: 'test',    basePassingWpm: 50 }],  // Final Boss L3

  // ── Lesson 4 — Symbols & Peak Mastery ────────────────────────────────────
  ['4.0', { type: 'tutorial' }],
  ['4.1', { type: 'drill'    }],
  ['4.2', { type: 'drill'    }],
  ['4.3', { type: 'drill'    }],
  ['4.4', { type: 'drill'    }],
  ['4.5', { type: 'drill'    }],
  ['4.6', { type: 'drill'    }],
  ['4.7', { type: 'test',    basePassingWpm: 65 }],  // Final Boss L4 — Grandmaster
]);

/** Difficulty modifiers — mirrors DifficultyModifiers in @typing-master/shared */
export const DIFFICULTY_MODIFIERS: Record<
  ApiDifficulty,
  { wpmMultiplier: number; accuracyReq: number }
> = {
  easy:         { wpmMultiplier: 0.8,  accuracyReq: 90 },
  intermediate: { wpmMultiplier: 1.0,  accuracyReq: 95 },
  professional: { wpmMultiplier: 1.5,  accuracyReq: 98 },
};
