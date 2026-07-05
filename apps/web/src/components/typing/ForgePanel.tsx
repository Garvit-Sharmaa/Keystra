'use client';
/**
 * ForgePanel.tsx — The Adaptive Forge Intelligence Panel
 *
 * A collapsible left-rail sidebar for /practice that surfaces:
 *   1. WeakKeyInsights  — Top-3 worst keys with error rate + latency badges
 *   2. DrillLauncher    — 3 one-click drill types targeting weak keys
 *   3. MiniHeatmap      — Compact live keyboard heatmap (accuracy dimension)
 *   4. SessionBadge     — Today's session count + XP earned live
 *
 * ARCHITECTURE:
 *   • Reads from useWeakKeyHeatmap (already wired to keyboardStore + analyticsApi)
 *   • Reads session count from typingStore (status transitions)
 *   • Drill launch calls lessonsApi-compatible initSession + router.push
 *   • Panel is fully collapsible — collapses to a 40px icon rail
 *   • Zero new API routes — all data from existing hooks
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Zap, Target, TrendingDown,
  Keyboard, FlameIcon, Sparkles, RefreshCw, BarChart2,
  Lock,
} from 'lucide-react';
import { useKeyboardStore, selectHeatmapData } from '@/store/keyboardStore';
import { useUserStore, selectTokens, selectUser } from '@/store/userStore';
import { useTypingStore, selectStatus } from '@/store/typingStore';
import { useWeakKeyHeatmap } from '@/hooks/useWeakKeyHeatmap';
import { analyticsApi } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeakKey {
  keyChar:      string;
  errorRate:    number;   // 0–1
  avgLatencyMs: number;
  sampleCount:  number;
}

type DrillType = 'precision' | 'burst' | 'speed';

const DRILL_META: Record<DrillType, {
  label:    string;
  sub:      string;
  icon:     React.ReactNode;
  accent:   string;
  bg:       string;
  border:   string;
}> = {
  precision: {
    label:  'Precision Drill',
    sub:    'Isolated weak keys, slow and deliberate',
    icon:   <Target size={14} strokeWidth={2} />,
    accent: 'text-emerald-400',
    bg:     'bg-emerald-500/8 hover:bg-emerald-500/14',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
  },
  burst: {
    label:  'Burst Drill',
    sub:    'Mixed weak + adjacent keys, high density',
    icon:   <Zap size={14} strokeWidth={2} />,
    accent: 'text-amber-400',
    bg:     'bg-amber-500/8 hover:bg-amber-500/14',
    border: 'border-amber-500/20 hover:border-amber-500/40',
  },
  speed: {
    label:  'Speed Run',
    sub:    'All weak keys at maximum pace',
    icon:   <TrendingDown size={14} strokeWidth={2} />,
    accent: 'text-rose-400',
    bg:     'bg-rose-500/8 hover:bg-rose-500/14',
    border: 'border-rose-500/20 hover:border-rose-500/40',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map errorRate (0–1) to a traffic-light colour */
function errorColor(rate: number): string {
  if (rate < 0.05) return '#34d399'; // green
  if (rate < 0.15) return '#fbbf24'; // amber
  if (rate < 0.25) return '#f97316'; // orange
  return '#f87171';                   // red
}

/** Map latency (ms) to a colour */
function latencyColor(ms: number): string {
  if (ms < 100) return '#34d399';
  if (ms < 200) return '#fbbf24';
  if (ms < 300) return '#f97316';
  return '#f87171';
}

/** Format a 0-1 fraction as a percentage string */
function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Divider
const Divider = () => (
  <div className="w-full h-px bg-surface-3/60 my-0.5" />
);

// Section label
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-untyped mb-2">
    {children}
  </p>
);

// ── Weak Key Row ──────────────────────────────────────────────────────────────
const WeakKeyRow = memo(function WeakKeyRow({
  keyChar, errorRate, avgLatencyMs, rank,
}: WeakKey & { rank: number }) {
  const eColor = errorColor(errorRate);
  const lColor = latencyColor(avgLatencyMs);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: rank * 0.07 }}
      className="flex items-center gap-3 px-2 py-1.5 rounded-xl
                 bg-surface-2/60 border border-surface-3/50
                 hover:border-surface-3 transition-colors duration-150"
    >
      {/* Rank badge */}
      <span
        className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                   text-[9px] font-mono font-bold"
        style={{ background: `${eColor}20`, color: eColor, border: `1px solid ${eColor}50` }}
      >
        {rank + 1}
      </span>

      {/* Key cap */}
      <kbd
        className="shrink-0 w-7 h-7 flex items-center justify-center
                   rounded-md text-sm font-mono font-bold
                   border shadow-[0_2px_0_rgba(0,0,0,0.3)]
                   bg-surface-3 border-surface-2 text-correct"
      >
        {keyChar === ' ' ? '␣' : keyChar}
      </kbd>

      {/* Stats */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-mono text-untyped">error</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: eColor }}>
            {pct(errorRate)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-mono text-untyped">latency</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: lColor }}>
            {Math.round(avgLatencyMs)}ms
          </span>
        </div>
      </div>
    </motion.div>
  );
});

// ── Drill Button ──────────────────────────────────────────────────────────────
const DrillButton = memo(function DrillButton({
  type, onClick, disabled,
}: {
  type:     DrillType;
  onClick:  () => void;
  disabled: boolean;
}) {
  const m = DRILL_META[type];
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled   ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      id={`forge-drill-${type}`}
      disabled={disabled}
      className={[
        'w-full flex items-start gap-3 p-3 rounded-xl border',
        'transition-all duration-150 text-left',
        m.bg, m.border,
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span className={`mt-0.5 shrink-0 ${m.accent}`}>{m.icon}</span>
      <div className="min-w-0">
        <p className={`text-xs font-mono font-semibold ${m.accent}`}>{m.label}</p>
        <p className="text-[10px] font-mono text-untyped leading-snug mt-0.5">{m.sub}</p>
      </div>
    </motion.button>
  );
});

// ── Mini heatmap legend ───────────────────────────────────────────────────────
const HeatmapLegend = () => (
  <div className="flex items-center gap-1.5 mt-2">
    <span className="text-[9px] font-mono text-untyped">low</span>
    <div className="flex-1 h-1.5 rounded-full"
      style={{ background: 'linear-gradient(90deg, #0d2a18, #3d2800, #601500, #6b0c0c)' }}
    />
    <span className="text-[9px] font-mono text-untyped">high</span>
  </div>
);

// ── Session badge (today's XP / session count) ────────────────────────────────
const SessionBadge = memo(function SessionBadge({
  sessionCount, xpToday,
}: { sessionCount: number; xpToday: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-col items-center flex-1 rounded-xl py-2.5
                      bg-violet/8 border border-violet/20">
        <span className="text-base font-mono font-bold text-violet-light">{sessionCount}</span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-untyped mt-0.5">
          sessions
        </span>
      </div>
      <div className="flex flex-col items-center flex-1 rounded-xl py-2.5
                      bg-amber-500/8 border border-amber-500/20">
        <span className="text-base font-mono font-bold text-amber-400">+{xpToday}</span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-untyped mt-0.5">
          xp today
        </span>
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

interface ForgePanelProps {
  /** Called when user launches a drill — parent must wire initSession + navigate */
  onLaunchDrill: (weakKeys: string[], drillType: DrillType) => Promise<void>;
  /** Whether a drill launch is in progress */
  isLaunching:   boolean;
  /** Today's completed session count */
  sessionCount:  number;
  /** Total XP earned today (from session submissions) */
  xpToday:       number;
}

export default function ForgePanel({
  onLaunchDrill, isLaunching, sessionCount, xpToday,
}: ForgePanelProps) {
  const [isOpen,    setIsOpen]    = useState(true);
  const [activeDrill, setActiveDrill] = useState<DrillType | null>(null);

  // ── Data sources ────────────────────────────────────────────────────────────
  const tokens      = useUserStore(selectTokens);
  const user        = useUserStore(selectUser);
  const heatmapData = useKeyboardStore(selectHeatmapData);
  const status      = useTypingStore(selectStatus);

  const { isLoading, error, hasData, refetch } = useWeakKeyHeatmap('accuracy');

  // ── Derive top-3 weak keys from heatmap data ─────────────────────────────
  // Sort by a composite score: errorRate (primary) + normalized latency (secondary)
  const weakKeys: WeakKey[] = React.useMemo(() => {
    const entries = Object.entries(heatmapData);
    if (entries.length === 0) return [];

    const maxLatency = Math.max(...entries.map(([, v]) => v.avgLatencyMs), 1);

    return entries
      .filter(([, v]) => v.sampleCount >= 3) // need enough data for confidence
      .map(([keyId, v]) => {
        // Extract keyChar from keyId — "key-KeyA" → "a", "key-Space" → " "
        const rawChar = keyId.replace('key-Key', '').replace('key-', '');
        const keyChar = rawChar === 'Space' ? ' ' : rawChar.toLowerCase();
        return { keyChar, ...v };
      })
      .sort((a, b) => {
        const scoreA = a.errorRate + (a.avgLatencyMs / maxLatency) * 0.3;
        const scoreB = b.errorRate + (b.avgLatencyMs / maxLatency) * 0.3;
        return scoreB - scoreA; // descending
      })
      .slice(0, 3);
  }, [heatmapData]);

  // ── Refetch after session finishes ──────────────────────────────────────
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current === 'running' && status === 'finished') {
      refetch();
    }
    prevStatus.current = status;
  }, [status, refetch]);

  // ── Drill launcher ───────────────────────────────────────────────────────
  const handleDrill = useCallback(async (type: DrillType) => {
    if (!tokens?.accessToken || weakKeys.length === 0) return;
    setActiveDrill(type);
    await onLaunchDrill(weakKeys.map((k) => k.keyChar), type);
    setActiveDrill(null);
  }, [tokens, weakKeys, onLaunchDrill]);

  const isGuest = !user;
  const hasSufficientData = weakKeys.length >= 2;

  // ── Panel width variants ─────────────────────────────────────────────────
  const panelVariants = {
    open:   { width: 288, opacity: 1 },
    closed: { width: 48,  opacity: 1 },
  };

  return (
    <motion.aside
      id="forge-panel"
      variants={panelVariants}
      initial="open"
      animate={isOpen ? 'open' : 'closed'}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex-shrink-0 flex flex-col h-full
                 border-r border-surface-3/60
                 bg-surface-1/80 dark:bg-surface-1/60
                 backdrop-blur-sm overflow-hidden"
      style={{ minHeight: 'calc(100dvh - 52px)' }}
    >
      {/* ── Toggle button ──────────────────────────────────────────────────── */}
      <button
        id="forge-toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Collapse Forge panel' : 'Expand Forge panel'}
        className="absolute top-3 right-2 z-10
                   w-7 h-7 rounded-lg flex items-center justify-center
                   bg-surface-2 border border-surface-3
                   text-untyped hover:text-violet-light hover:border-violet/30
                   transition-all duration-150"
      >
        {isOpen
          ? <ChevronLeft  size={13} strokeWidth={2.5} />
          : <ChevronRight size={13} strokeWidth={2.5} />}
      </button>

      {/* ── Collapsed state — icon strip ──────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-4 pt-14 px-2"
          >
            <Zap       size={16} className="text-untyped" strokeWidth={2} />
            <Target    size={16} className="text-untyped" strokeWidth={2} />
            <BarChart2 size={16} className="text-untyped" strokeWidth={2} />
            <Keyboard  size={16} className="text-untyped" strokeWidth={2} />
            <FlameIcon size={16} className="text-untyped" strokeWidth={2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Expanded panel content ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, delay: 0.08 }}
            className="flex flex-col gap-4 p-4 pt-12 overflow-y-auto flex-1
                       scrollbar-thin"
            style={{ width: 288 }}
          >

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-violet-light" strokeWidth={2} />
              <h2 className="font-mono text-xs font-bold text-correct tracking-wide">
                Adaptive Forge
              </h2>
            </div>

            <Divider />

            {/* ── Session badge ────────────────────────────────────────────── */}
            <div>
              <SectionLabel>Today</SectionLabel>
              <SessionBadge sessionCount={sessionCount} xpToday={xpToday} />
            </div>

            <Divider />

            {/* ── Weak Key Insights ────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionLabel>Weak Keys</SectionLabel>
                {tokens?.accessToken && (
                  <button
                    onClick={refetch}
                    id="forge-refresh-heatmap"
                    className="text-untyped hover:text-violet-light transition-colors"
                    aria-label="Refresh heatmap data"
                  >
                    <RefreshCw
                      size={11}
                      strokeWidth={2.5}
                      className={isLoading ? 'animate-spin' : ''}
                    />
                  </button>
                )}
              </div>

              {/* Guest gate */}
              {isGuest && (
                <div className="flex flex-col items-center gap-2 py-4 rounded-xl
                                bg-surface-2 border border-surface-3 text-center">
                  <Lock size={16} className="text-untyped" strokeWidth={2} />
                  <p className="text-[10px] font-mono text-untyped leading-relaxed px-2">
                    Sign in to see your per-key analytics
                  </p>
                </div>
              )}

              {/* Loading skeleton */}
              {!isGuest && isLoading && (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-surface-2 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Error */}
              {!isGuest && error && (
                <div className="text-[10px] font-mono text-incorrect/80 px-1">{error}</div>
              )}

              {/* No data yet */}
              {!isGuest && !isLoading && !error && !hasSufficientData && (
                <div className="flex flex-col items-center gap-2 py-4 rounded-xl
                                bg-surface-2 border border-surface-3 text-center">
                  <BarChart2 size={16} className="text-untyped" strokeWidth={2} />
                  <p className="text-[10px] font-mono text-untyped leading-relaxed px-2">
                    Complete a few sessions to unlock key intelligence
                  </p>
                </div>
              )}

              {/* Weak key rows */}
              {!isGuest && !isLoading && hasSufficientData && (
                <div className="flex flex-col gap-1.5">
                  {weakKeys.map((k, i) => (
                    <WeakKeyRow key={k.keyChar} {...k} rank={i} />
                  ))}
                </div>
              )}
            </div>

            <Divider />

            {/* ── Drill Launcher ───────────────────────────────────────────── */}
            <div>
              <SectionLabel>Launch Drill</SectionLabel>

              {isGuest ? (
                <p className="text-[10px] font-mono text-untyped">
                  Sign in to launch adaptive drills
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(['precision', 'burst', 'speed'] as DrillType[]).map((type) => (
                    <DrillButton
                      key={type}
                      type={type}
                      disabled={
                        isLaunching ||
                        !hasSufficientData ||
                        (activeDrill !== null && activeDrill !== type)
                      }
                      onClick={() => handleDrill(type)}
                    />
                  ))}

                  {!hasSufficientData && (
                    <p className="text-[10px] font-mono text-untyped mt-1 leading-relaxed">
                      Drills unlock after enough sessions to profile your weak keys.
                    </p>
                  )}

                  {isLaunching && activeDrill && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-mono text-violet-light animate-pulse text-center mt-1"
                    >
                      generating drill…
                    </motion.p>
                  )}
                </div>
              )}
            </div>

            <Divider />

            {/* ── Mini Heatmap legend ──────────────────────────────────────── */}
            {hasData && !isGuest && (
              <div>
                <SectionLabel>Heatmap Scale (accuracy)</SectionLabel>
                <HeatmapLegend />
                <p className="text-[9px] font-mono text-untyped mt-2 leading-relaxed">
                  Live heatmap active on the keyboard below. Hover any key for exact stats on
                  the dashboard.
                </p>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
