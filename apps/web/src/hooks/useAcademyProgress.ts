'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams }   from 'next/navigation';
import { useTypingStore, selectStatus, selectResults } from '@/store/typingStore';
import { useUserStore, selectTokens }                  from '@/store/userStore';
import { lessonsApi }                                  from '@/lib/api';

export function useAcademyProgress() {
  const searchParams = useSearchParams();
  const status       = useTypingStore(selectStatus);
  const results      = useTypingStore(selectResults);
  const tokens       = useUserStore(selectTokens);

  // Guard against double-fire on the same session
  const handledResultsRef = useRef<object | null>(null);

  // Read Academy context from URL params (stable on mount, don't change mid-session)
  const isAcademy  = searchParams.get('isAcademy') === '1';
  const chapterId  = searchParams.get('chapterId')  ?? '';
  const difficulty = (searchParams.get('difficulty') ?? 'easy') as 'easy' | 'intermediate' | 'professional';
  const reqWpm     = parseInt(searchParams.get('reqWpm') ?? '0', 10);
  const reqAcc     = parseInt(searchParams.get('reqAcc') ?? '0', 10);
  const hasGate    = reqWpm > 0 || reqAcc > 0;

  useEffect(() => {
    // Only act when a new session just finished
    if (status !== 'finished' || !results)                return;
    if (!isAcademy || !chapterId)                         return;
    if (!tokens?.accessToken)                             return;
    // Prevent double-submission if effect re-runs
    if (handledResultsRef.current === results)            return;

    handledResultsRef.current = results;

    const achievedWpm = Math.round(results.wpm);
    const achievedAcc = Math.round(results.accuracy);

    // For test chapters: only mark complete if the user passed the gate
    if (hasGate) {
      const passed = achievedWpm >= reqWpm && achievedAcc >= reqAcc;
      if (!passed) {
        console.info('[Academy] Chapter test not passed — progress NOT marked.', {
          chapterId, achievedWpm, reqWpm, achievedAcc, reqAcc,
        });
        return;
      }
    }

    // All non-test chapters (tutorial, drill, game) pass automatically
    console.info('[Academy] Marking chapter complete:', { chapterId, difficulty, achievedWpm, achievedAcc });

    lessonsApi.markProgress(
      {
        chapterId,
        difficulty,
        wpmAchieved:      achievedWpm,
        accuracyAchieved: achievedAcc,
      },
      tokens.accessToken,
    ).then(() => {
      console.info('[Academy] ✓ Chapter progress saved:', chapterId);
    }).catch((err: Error) => {
      console.error('[Academy] Failed to save chapter progress:', err.message);
    });

  // We intentionally only re-run when results or status change (not on token/param changes
  // mid-session, which would be a bug). ESLint is suppressed for the stable params.
  }, [status, results]); // eslint-disable-line react-hooks/exhaustive-deps
}
