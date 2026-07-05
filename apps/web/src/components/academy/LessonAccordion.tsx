'use client';
/**
 * LessonAccordion.tsx — A collapsible Lesson folder card.
 *
 * States:
 *   LOCKED    — padlock overlay, greyed text, no hover interaction
 *   CLOSED    — clickable header, progress ring, chapter count
 *   OPEN      — chapter list slides down via AnimatePresence
 *
 * The progress ring animates from 0 to (completedChapters/total * 360°)
 * on mount. When all chapters are complete, the ring glows green.
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import type { Lesson, Chapter } from '@typing-master/shared';
import ChapterRow from './ChapterRow';

// ─── Progress ring (SVG) ──────────────────────────────────────────────────────

function ProgressRing({
  completed, total,
}: { completed: number; total: number }) {
  const pct        = total === 0 ? 0 : completed / total;
  const radius     = 14;
  const circ       = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - pct);
  const isComplete = completed === total;

  return (
    <svg width={36} height={36} viewBox="0 0 36 36" className="shrink-0 -rotate-90">
      {/* Track */}
      <circle cx={18} cy={18} r={radius}
        fill="none" stroke="currentColor" strokeWidth={2.5}
        className="text-surface-3" />
      {/* Fill */}
      <motion.circle
        cx={18} cy={18} r={radius}
        fill="none" strokeWidth={2.5} strokeLinecap="round"
        stroke={isComplete ? '#34d399' : 'currentColor'}
        className={isComplete ? '' : 'text-violet-light'}
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
      />
      {/* Center count (rendered back in normal orientation via inner rotation) */}
      <text
        x={18} y={18}
        dominantBaseline="central"
        textAnchor="middle"
        className="rotate-90"
        style={{
          fontSize: 8,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700,
          fill: isComplete ? '#34d399' : '#a78bfa',
          transform: 'rotate(90deg)',
          transformOrigin: '18px 18px',
        }}
      >
        {completed}/{total}
      </text>
    </svg>
  );
}

// ─── Difficulty tier dots ─────────────────────────────────────────────────────

const DIFF_COLORS = ['#34d399','#60a5fa','#fbbf24','#f87171','#a78bfa'];

function DiffDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: i < level ? DIFF_COLORS[level - 1] : 'var(--surface-3)' }} />
      ))}
    </div>
  );
}

// ─── Main accordion ───────────────────────────────────────────────────────────

interface LessonAccordionProps {
  lesson:      Lesson;
  defaultOpen: boolean;
  startingId:  string | null;   // chapter ID currently launching
  onStart:     (chapter: Chapter, lesson: Lesson) => void;
}

const LessonAccordion = memo(function LessonAccordion({
  lesson,
  defaultOpen,
  startingId,
  onStart,
}: LessonAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen && !lesson.isLocked);

  const completedCount = lesson.chapters.filter((c) => c.isCompleted).length;
  const totalCount     = lesson.chapters.length;
  const isAllDone      = completedCount === totalCount;

  // Max difficulty across chapters — used for diff dots
  const maxDiff = lesson.number; // Lesson N = difficulty tier N (1–4)

  // Card border state
  const borderClass = lesson.isLocked
    ? 'border-surface-3/30'
    : isAllDone
      ? 'border-correct/25 shadow-[0_0_20px_rgba(52,211,153,0.08)]'
      : isOpen
        ? 'border-violet/30 shadow-[0_0_20px_rgba(124,58,237,0.10)]'
        : 'border-surface-3/60 hover:border-surface-3';

  return (
    <motion.div
      id={`lesson-accordion-${lesson.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: (lesson.number - 1) * 0.07 }}
      className={[
        'rounded-2xl border overflow-hidden transition-all duration-200',
        'bg-surface-1 dark:bg-surface-1/80',
        borderClass,
      ].join(' ')}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <button
        id={`lesson-header-${lesson.id}`}
        disabled={lesson.isLocked}
        onClick={() => !lesson.isLocked && setIsOpen((o) => !o)}
        className={[
          'w-full flex items-center gap-4 px-5 py-4 text-left',
          'transition-colors duration-150',
          lesson.isLocked
            ? 'cursor-not-allowed'
            : 'cursor-pointer hover:bg-surface-2/40',
        ].join(' ')}
      >
        {/* Progress ring */}
        <ProgressRing completed={completedCount} total={totalCount} />

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Lesson number badge */}
            <span className={[
              'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md',
              lesson.isLocked
                ? 'bg-surface-3 text-untyped'
                : isAllDone
                  ? 'bg-correct/15 text-correct'
                  : 'bg-violet/15 text-violet-light',
            ].join(' ')}>
              L{lesson.number}
            </span>

            <h3 className={[
              'font-mono font-semibold text-sm',
              lesson.isLocked ? 'text-untyped' : 'text-correct',
            ].join(' ')}>
              {lesson.title}
            </h3>

            {isAllDone && (
              <CheckCircle2 size={14} className="text-correct/70" strokeWidth={2} />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] font-mono text-untyped/70 line-clamp-1">
              {lesson.description}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <DiffDots level={maxDiff} />
            <span className="text-[9px] font-mono text-untyped/50">
              {totalCount} chapters
            </span>
            <span className="text-[9px] font-mono text-untyped/50">
              {lesson.chapters.reduce((s, c) => s + c.estimatedMinutes, 0)} min total
            </span>
          </div>
        </div>

        {/* Lock or chevron */}
        {lesson.isLocked ? (
          <div className="shrink-0 flex flex-col items-center gap-1">
            <Lock size={20} className="text-untyped/40" strokeWidth={2} />
            <span className="text-[8px] font-mono text-untyped/30 text-center leading-tight">
              complete<br/>L{lesson.number - 1}
            </span>
          </div>
        ) : (
          <span className="shrink-0 text-untyped">
            {isOpen
              ? <ChevronUp  size={16} strokeWidth={2.5} />
              : <ChevronDown size={16} strokeWidth={2.5} />}
          </span>
        )}
      </button>

      {/* ── Locked overlay bar ─────────────────────────────────────────────── */}
      {lesson.isLocked && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                          bg-surface-2/60 border border-surface-3/40">
            <Lock size={11} className="text-untyped/40" strokeWidth={2} />
            <span className="text-[10px] font-mono text-untyped/50">
              Complete all chapters in Lesson {lesson.number - 1} — including the Final Boss — to unlock.
            </span>
          </div>
        </div>
      )}

      {/* ── Chapter list ───────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isOpen && !lesson.isLocked && (
          <motion.div
            key="chapters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 px-4 pb-4">
              {lesson.chapters.map((ch, i) => (
                <ChapterRow
                  key={ch.id}
                  chapter={ch}
                  index={i}
                  isLocked={lesson.isLocked}
                  isStarting={startingId === ch.id}
                  onStart={(chapter) => onStart(chapter, lesson)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

LessonAccordion.displayName = 'LessonAccordion';
export default LessonAccordion;
