'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  TypingSessionConfig,
  TypingResults,
  SessionStatus,
  LiveTypingStats,
} from '@keystra/shared';
import { TIME_MODE_OPTIONS, WORDS_MODE_OPTIONS } from '@keystra/shared';

const DEFAULT_CONFIG: TypingSessionConfig = {
  mode: 'time',
  duration: 60,
  wordCount: 50,
  language: 'english',
};

interface TypingState {
  // Immutable during an active session — set once at initSession
  config: TypingSessionConfig;
  /** Pre-computed word list for the session */
  words: string[];

  status: SessionStatus;
  /** Countdown value: 3 → 2 → 1 (only relevant in 'countdown' status) */
  countdown: number;

  results: TypingResults | null;

  liveStats: LiveTypingStats;


  /** Load a word list and configure the session. */
  initSession: (config: TypingSessionConfig, words: string[]) => void;

  /** Set session lifecycle status. */
  setStatus: (status: SessionStatus) => void;

  /** Update countdown digit. */
  setCountdown: (n: number) => void;

  /**
   * Called by the 500 ms interval in useTypingEngine.
   * Only the live stats slice changes — selector-subscribed components re-render.
   */
  updateLiveStats: (stats: Partial<LiveTypingStats>) => void;

  /** Called once when the session is complete. */
  completeSession: (results: TypingResults) => void;

  /** Full reset: clears words, results, and resets to idle. */
  resetSession: () => void;

  /** Change config option (only valid in idle state). */
  setConfig: (patch: Partial<TypingSessionConfig>) => void;
}

const INITIAL_LIVE_STATS: LiveTypingStats = {
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  timeRemaining: DEFAULT_CONFIG.duration,
  wordProgress: 0,
};

export const useTypingStore = create<TypingState>()(
  subscribeWithSelector((set) => ({
    config:    DEFAULT_CONFIG,
    words:     [],
    status:    'idle',
    countdown: 3,
    results:   null,
    liveStats: INITIAL_LIVE_STATS,

    initSession: (config, words) =>
      set({
        config,
        words,
        status:    'idle',
        countdown: 3,
        results:   null,
        liveStats: {
          wpm:           0,
          rawWpm:        0,
          accuracy:      100,
          timeRemaining: config.duration,
          wordProgress:  0,
        },
      }),

    setStatus: (status) => set({ status }),

    setCountdown: (n) => set({ countdown: n }),

    updateLiveStats: (patch) =>
      set((s) => ({ liveStats: { ...s.liveStats, ...patch } })),

    completeSession: (results) => set({ status: 'finished', results }),

    resetSession: () =>
      set((s) => ({
        status:    'idle',
        countdown: 3,
        results:   null,
        liveStats: {
          wpm:           0,
          rawWpm:        0,
          accuracy:      100,
          timeRemaining: s.config.duration,
          wordProgress:  0,
        },
      })),

    setConfig: (patch) =>
      set((s) => ({
        config: { ...s.config, ...patch },
        liveStats: {
          ...s.liveStats,
          timeRemaining: patch.duration ?? s.config.duration,
        },
      })),
  })),
);

export const selectConfig     = (s: TypingState) => s.config;
export const selectWords      = (s: TypingState) => s.words;
export const selectStatus     = (s: TypingState) => s.status;
export const selectCountdown  = (s: TypingState) => s.countdown;
export const selectResults    = (s: TypingState) => s.results;
export const selectLiveStats  = (s: TypingState) => s.liveStats;
export const selectLiveWpm    = (s: TypingState) => s.liveStats.wpm;
export const selectTimeLeft   = (s: TypingState) => s.liveStats.timeRemaining;

export { TIME_MODE_OPTIONS, WORDS_MODE_OPTIONS };
