'use client';

import { useEffect, useRef } from 'react';
import { useKeyboardStore } from '@/store/keyboardStore';
import { useTypingStore, selectStatus, selectResults } from '@/store/typingStore';
import { KEYBOARD_BRIDGE_RELEASE_DELAY_MS } from '@keystra/shared';


export interface KeyPressEventDetail {
  code:      string;   // KeyboardEvent.code
  key:       string;   // KeyboardEvent.key
  isCorrect: boolean;
  targetChar:string;
}

/** Dispatch this from the typing engine on each character keystroke */
export const KEYPRESS_EVENT = 'tm:keypress' as const;

export function dispatchKeyPressEvent(detail: KeyPressEventDetail) {
  window.dispatchEvent(new CustomEvent(KEYPRESS_EVENT, { detail }));
}

/** Dispatch this from the engine when target character changes */
export const TARGET_CHANGE_EVENT = 'tm:targetchange' as const;

export interface TargetChangeEventDetail { code: string; }

export function dispatchTargetChangeEvent(detail: TargetChangeEventDetail) {
  window.dispatchEvent(new CustomEvent(TARGET_CHANGE_EVENT, { detail }));
}


export function useKeyboardBridge() {
  const { pressKey, releaseKey, clearKeyError, setTargetKey,
          resetKeyStates, setHeatmapData } = useKeyboardStore();
  const keyLookup = useKeyboardStore((s) => s.keyLookup);

  // Release timer map — one per keyId to handle overlapping presses
  const releaseTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handleKeyPress = (e: Event) => {
      const { code, isCorrect } = (e as CustomEvent<KeyPressEventDetail>).detail;
      if (!keyLookup) return;

      const keyDef = keyLookup[code];
      if (!keyDef) return;

      const keyId = keyDef.id;

      // Cancel any pending release for this key
      const existing = releaseTimers.current.get(keyId);
      if (existing) clearTimeout(existing);

      // Apply visual press
      pressKey(keyId, isCorrect);

      // Schedule release after KEYBOARD_BRIDGE_RELEASE_DELAY_MS
      const timer = setTimeout(() => {
        releaseKey(keyId);
        releaseTimers.current.delete(keyId);

        // Clear error state after the shake animation completes (~300ms)
        if (!isCorrect) {
          setTimeout(() => clearKeyError(keyId), 320);
        }
      }, KEYBOARD_BRIDGE_RELEASE_DELAY_MS);

      releaseTimers.current.set(keyId, timer);
    };

    window.addEventListener(KEYPRESS_EVENT, handleKeyPress);
    return () => window.removeEventListener(KEYPRESS_EVENT, handleKeyPress);
  }, [keyLookup, pressKey, releaseKey, clearKeyError]);

  useEffect(() => {
    const handleTargetChange = (e: Event) => {
      const { code } = (e as CustomEvent<TargetChangeEventDetail>).detail;
      if (!keyLookup) return;
      const keyDef = code === ' '
        ? keyLookup['key-Space']         // space char → Space key
        : keyLookup[code];               // code already is KeyboardEvent.code
      setTargetKey(keyDef?.id ?? null);
    };

    window.addEventListener(TARGET_CHANGE_EVENT, handleTargetChange);
    return () => window.removeEventListener(TARGET_CHANGE_EVENT, handleTargetChange);
  }, [keyLookup, setTargetKey]);

  useEffect(() => {
    return useTypingStore.subscribe(
      selectStatus,
      (status) => {
        if (status === 'idle' || status === 'countdown') {
          // Clear all timers and reset visual state
          releaseTimers.current.forEach(clearTimeout);
          releaseTimers.current.clear();
          resetKeyStates();
        }
      },
    );
  }, [resetKeyStates]);

  useEffect(() => {
    return useTypingStore.subscribe(
      selectResults,
      (results) => {
        if (!results) return;
        // Convert weakKeyMap to heatmap data format
        const entries = Object.entries(results.weakKeyMap).map(([keyChar, stats]) => ({
          keyChar,
          errorRate:    stats.total > 0 ? stats.errors / stats.total : 0,
          avgLatencyMs: 0, // not tracked at this level; analytics API has EWMA
          sampleCount:  stats.total,
        }));
        setHeatmapData(entries);
      },
    );
  }, [setHeatmapData]);
}
