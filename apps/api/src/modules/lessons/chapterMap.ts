
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
  ['1.0', { type: 'tutorial' }],
  ['1.1', { type: 'drill'    }],
  ['1.2', { type: 'drill'    }],
  ['1.3', { type: 'drill'    }],
  ['1.4', { type: 'drill'    }],
  ['1.5', { type: 'drill'    }],
  ['1.6', { type: 'test',    basePassingWpm: 30 }],  // Final Boss L1

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

  ['3.0', { type: 'tutorial' }],
  ['3.1', { type: 'drill'    }],
  ['3.2', { type: 'drill'    }],
  ['3.3', { type: 'drill'    }],
  ['3.4', { type: 'drill'    }],
  ['3.5', { type: 'drill'    }],
  ['3.6', { type: 'drill'    }],
  ['3.7', { type: 'test',    basePassingWpm: 50 }],  // Final Boss L3

  ['4.0', { type: 'tutorial' }],
  ['4.1', { type: 'drill'    }],
  ['4.2', { type: 'drill'    }],
  ['4.3', { type: 'drill'    }],
  ['4.4', { type: 'test',    basePassingWpm: 45 }],

  ['5.0', { type: 'tutorial' }],
  ['5.1', { type: 'drill'    }],
  ['5.2', { type: 'drill'    }],
  ['5.3', { type: 'drill'    }],
  ['5.4', { type: 'test',    basePassingWpm: 50 }],

  ['6.0', { type: 'tutorial' }],
  ['6.1', { type: 'drill'    }],
  ['6.2', { type: 'drill'    }],
  ['6.3', { type: 'drill'    }],
  ['6.4', { type: 'drill'    }],
  ['6.5', { type: 'test',    basePassingWpm: 40 }],

  ['7.0', { type: 'tutorial' }],
  ['7.1', { type: 'drill'    }],
  ['7.2', { type: 'drill'    }],
  ['7.3', { type: 'drill'    }],
  ['7.4', { type: 'drill'    }],
  ['7.5', { type: 'test',    basePassingWpm: 70 }],

  ['8.0', { type: 'tutorial' }],
  ['8.1', { type: 'drill'    }],
  ['8.2', { type: 'drill'    }],
  ['8.3', { type: 'drill'    }],
  ['8.4', { type: 'test',    basePassingWpm: 75 }],

  ['9.0', { type: 'tutorial' }],
  ['9.1', { type: 'drill'    }],
  ['9.2', { type: 'drill'    }],
  ['9.3', { type: 'drill'    }],
  ['9.4', { type: 'test',    basePassingWpm: 80 }],
]);

/** Difficulty modifiers — mirrors DifficultyModifiers in @keystra/shared */
export const DIFFICULTY_MODIFIERS: Record<
  ApiDifficulty,
  { wpmMultiplier: number; accuracyReq: number }
> = {
  easy:         { wpmMultiplier: 0.8,  accuracyReq: 90 },
  intermediate: { wpmMultiplier: 1.0,  accuracyReq: 95 },
  professional: { wpmMultiplier: 1.5,  accuracyReq: 98 },
};
