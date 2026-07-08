import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TypeForge — Adaptive Keyboard Intelligence',
};

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-surface flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* 
        No radial glows or glassmorphism. Just a clean, structural, matte background 
        with subtle geometric patterns to hint at technical precision.
      */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--surface-3) 1px, transparent 1px), linear-gradient(90deg, var(--surface-3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center gap-8 text-center max-w-2xl mt-12">
        <div className="flex flex-col gap-2">
          <h1 className="font-mono text-6xl md:text-7xl font-bold tracking-tighter">
            <span className="text-violet-light">Type</span>
            <span className="text-correct">Forge</span>
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-violet-light/70 font-semibold">
            Keyboard Analytics Engine
          </p>
        </div>

        <p className="text-untyped text-lg leading-relaxed max-w-md">
          Adaptive real-time WPM tracking, AI-powered
          weak-key detection, and personalized drills that adapt to{' '}
          <em className="text-correct not-italic border-b border-violet/30 pb-0.5">your</em> patterns.
        </p>

        <Link
          id="start-typing-btn"
          href="/practice"
          className="mt-6 inline-flex items-center gap-3 bg-violet text-surface-0 font-mono font-bold uppercase tracking-widest px-10 py-4 rounded-md tactile-btn"
        >
          Start Typing
          <span className="opacity-80 font-mono text-sm">_</span>
        </Link>

        {/* Feature chips (Keycap aesthetic) */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-lg">
          {['Zero-Latency Engine', 'Weak-Key Heatmap', 'XP & Rankings', 'Daily Challenges', 'Multiplayer Races'].map((f) => (
            <span
              key={f}
              className="tactile-card text-untyped hover:text-correct transition-colors text-[11px] uppercase tracking-wider px-4 py-2.5 rounded shadow-sm font-mono"
            >
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Fake typing preview (Terminal / Structural look) */}
      <div
        aria-hidden="true"
        className="relative z-10 mt-20 tactile-card rounded-lg p-8 font-mono text-xl md:text-2xl
                   max-w-3xl w-full select-none"
      >
        <div className="flex items-center gap-2 mb-6 border-b border-surface-3/50 pb-4">
          <div className="w-3 h-3 rounded-full bg-surface-3" />
          <div className="w-3 h-3 rounded-full bg-surface-3" />
          <div className="w-3 h-3 rounded-full bg-surface-3" />
          <span className="ml-2 text-xs font-mono text-untyped/60">session_01.log</span>
        </div>
        <div className="leading-relaxed">
          <span className="text-correct">the quick brown </span>
          <span className="text-incorrect border-b-2 border-incorrect/50">f</span>
          <span className="text-correct">ox jumps over the </span>
          <span className="inline-block w-[2px] h-[1.2em] bg-violet-light animate-blink align-middle mx-[1px]" />
          <span className="text-untyped">lazy dog</span>
        </div>
      </div>
    </main>
  );
}
