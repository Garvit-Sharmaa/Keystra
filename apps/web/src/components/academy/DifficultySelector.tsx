'use client';
/**
 * DifficultySelector.tsx — The "Boss Fight" difficulty chooser modal.
 *
 * Renders as a full-screen backdrop blur overlay with a centered card.
 * Three difficulty options are displayed as large interactive cards:
 *   • Easy         → emerald gradient, 0.8× WPM / 90% accuracy
 *   • Intermediate → violet gradient, 1.0× WPM / 95% accuracy
 *   • Professional → rose-to-amber gradient, 1.5× WPM / 98% accuracy
 *
 * Props:
 *   chapter.basePassingWpm / chapter.basePassingAccuracy
 *   → scaled live by the selected difficulty before display.
 *
 * onConfirm(difficulty) is called when the user hits "Begin Test".
 * onCancel()            closes the modal without launching.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, X, Shield, Zap, Flame, ChevronRight } from 'lucide-react';
import type { Difficulty, Chapter } from '@typing-master/shared';
import { DifficultyModifiers } from '@typing-master/shared';

// ─── Difficulty card meta ─────────────────────────────────────────────────────

const DIFF_META: Record<Difficulty, {
  label:       string;
  sublabel:    string;
  icon:        React.ReactNode;
  gradient:    string;
  ring:        string;
  glow:        string;
  textAccent:  string;
  badgeStyle:  string;
}> = {
  easy: {
    label:      'Easy',
    sublabel:   'Warmup Mode',
    icon:       <Shield size={22} strokeWidth={2} />,
    gradient:   'from-emerald-500/20 via-emerald-500/10 to-transparent',
    ring:       'ring-emerald-500/60',
    glow:       'shadow-[0_0_30px_rgba(16,185,129,0.25)]',
    textAccent: 'text-emerald-400',
    badgeStyle: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  },
  intermediate: {
    label:      'Intermediate',
    sublabel:   'Forge Standard',
    icon:       <Zap size={22} strokeWidth={2} />,
    gradient:   'from-violet-500/20 via-violet-500/10 to-transparent',
    ring:       'ring-violet-500/60',
    glow:       'shadow-[0_0_30px_rgba(124,58,237,0.30)]',
    textAccent: 'text-violet-light',
    badgeStyle: 'bg-violet/15 border-violet/30 text-violet-light',
  },
  professional: {
    label:      'Professional',
    sublabel:   'Boss Fight',
    icon:       <Flame size={22} strokeWidth={2} />,
    gradient:   'from-rose-500/20 via-amber-500/10 to-transparent',
    ring:       'ring-rose-500/60',
    glow:       'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
    textAccent: 'text-rose-400',
    badgeStyle: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
  },
};

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'professional'];

// ─── Single difficulty card ────────────────────────────────────────────────────

function DiffCard({
  difficulty,
  chapter,
  isSelected,
  onSelect,
}: {
  difficulty: Difficulty;
  chapter:    Chapter;
  isSelected: boolean;
  onSelect:   (d: Difficulty) => void;
}) {
  const m   = DIFF_META[difficulty];
  const mod = DifficultyModifiers[difficulty];

  const requiredWpm = chapter.basePassingWpm
    ? Math.round(chapter.basePassingWpm * mod.wpmMultiplier)
    : null;
  const requiredAcc = mod.accuracyReq;

  return (
    <motion.button
      id={`diff-card-${difficulty}`}
      onClick={() => onSelect(difficulty)}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={[
        'relative flex flex-col gap-3 p-5 rounded-2xl text-left',
        'border transition-all duration-200',
        'bg-gradient-to-br',
        m.gradient,
        isSelected
          ? `ring-2 ${m.ring} ${m.glow} border-transparent`
          : 'border-surface-3/60 hover:border-surface-3',
      ].join(' ')}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-3">
        <span className={`${m.textAccent}`}>{m.icon}</span>
        <div>
          <p className={`font-mono font-bold text-sm ${m.textAccent}`}>{m.label}</p>
          <p className="font-mono text-[10px] text-untyped">{m.sublabel}</p>
        </div>

        {/* Selected check */}
        {isSelected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`ml-auto w-5 h-5 rounded-full flex items-center justify-center
                        text-[10px] font-bold border ${m.badgeStyle}`}
          >
            ✓
          </motion.span>
        )}
      </div>

      {/* Requirement badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {requiredWpm !== null && (
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${m.badgeStyle}`}>
            ≥ {requiredWpm} WPM
          </span>
        )}
        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${m.badgeStyle}`}>
          ≥ {requiredAcc}% accuracy
        </span>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full
                         border border-surface-3 text-untyped">
          {mod.wpmMultiplier}× speed
        </span>
      </div>
    </motion.button>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface DifficultySelectorProps {
  chapter:     Chapter;
  onConfirm:   (difficulty: Difficulty) => void;
  onCancel:    () => void;
  isLaunching: boolean;
}

export default function DifficultySelector({
  chapter,
  onConfirm,
  onCancel,
  isLaunching,
}: DifficultySelectorProps) {
  const [selected, setSelected] = useState<Difficulty>('intermediate');

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4
                   bg-black/60 backdrop-blur-md"
        onClick={onCancel}
      >
        {/* Modal card */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.96, y: 8  }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg
                     bg-surface-1 border border-surface-3
                     dark:bg-surface-1 dark:border-white/8
                     dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                     rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-surface-3/60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30
                                 flex items-center justify-center text-amber-400">
                  <Sword size={20} strokeWidth={2} />
                </span>
                <div>
                  <h2 className="font-mono font-bold text-base text-correct">
                    Choose Your Difficulty
                  </h2>
                  <p className="text-xs font-mono text-untyped mt-0.5">
                    {chapter.title}
                  </p>
                </div>
              </div>

              <button
                id="diff-close-btn"
                onClick={onCancel}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-untyped hover:text-correct hover:bg-surface-2
                           transition-all duration-150"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <p className="text-xs font-mono text-untyped mt-3 leading-relaxed">
              The difficulty you choose scales the required WPM and accuracy.
              Pass the test to unlock the next lesson.
            </p>
          </div>

          {/* Difficulty cards */}
          <div className="px-6 py-5 flex flex-col gap-3">
            {DIFFICULTY_ORDER.map((d) => (
              <DiffCard
                key={d}
                difficulty={d}
                chapter={chapter}
                isSelected={selected === d}
                onSelect={setSelected}
              />
            ))}
          </div>

          {/* Footer CTA */}
          <div className="px-6 pb-6">
            <motion.button
              id="diff-begin-btn"
              onClick={() => onConfirm(selected)}
              disabled={isLaunching}
              whileHover={isLaunching ? {} : { scale: 1.01 }}
              whileTap={isLaunching  ? {} : { scale: 0.98 }}
              className={[
                'w-full flex items-center justify-center gap-2',
                'py-3 rounded-xl font-mono font-semibold text-sm',
                'transition-all duration-150',
                isLaunching
                  ? 'bg-violet/50 text-white/60 cursor-not-allowed'
                  : 'bg-violet hover:bg-violet/85 text-white shadow-purple-glow/30 hover:shadow-purple-glow',
              ].join(' ')}
            >
              {isLaunching ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30
                                  border-t-white animate-spin" />
                  Generating test…
                </>
              ) : (
                <>
                  Begin Test
                  <ChevronRight size={16} strokeWidth={2.5} />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
