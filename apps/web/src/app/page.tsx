import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TypeForge — Adaptive Keyboard Intelligence',
};

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-surface flex flex-col items-center justify-center px-4 relative">
      {/* Clean, simple background — no complex patterns */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, var(--violet) 0%, transparent 40%)',
        }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center gap-6 text-center max-w-2xl mt-8">
        <div className="flex flex-col gap-1 items-center">
          {/* Classic software icon/logo stand-in */}
          <div className="w-16 h-16 bg-violet rounded-2xl flex items-center justify-center shadow-md mb-2">
            <span className="font-mono text-3xl text-white font-bold">TF</span>
          </div>
          <h1 className="font-sans text-5xl md:text-6xl font-bold tracking-tight text-correct">
            TypeForge
          </h1>
          <p className="font-sans text-sm uppercase tracking-[0.2em] text-violet font-semibold mt-2">
            Professional Typing Tutor
          </p>
        </div>

        <p className="text-untyped text-lg leading-relaxed max-w-md mt-2">
          Master your keyboard skills with adaptive real-time WPM tracking,
          weak-key detection, and personalized drills.
        </p>

        <Link
          id="start-typing-btn"
          href="/practice"
          className="mt-6 inline-flex items-center justify-center gap-2 classic-btn font-sans font-medium px-8 py-3.5 rounded-lg text-lg w-full sm:w-auto min-w-[200px]"
        >
          Start Course
          <span className="font-mono text-sm opacity-80">→</span>
        </Link>

        {/* Feature chips (Classic Card aesthetic) */}
        <div className="flex flex-wrap justify-center gap-3 mt-10 max-w-lg">
          {['Zero-Latency Engine', 'Weak-Key Heatmap', 'XP & Rankings', 'Daily Challenges', 'Multiplayer Races'].map((f) => (
            <span
              key={f}
              className="classic-card text-untyped hover:text-correct transition-colors text-xs px-4 py-2 font-medium"
            >
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Fake typing preview (Classic Software Window look) */}
      <div
        aria-hidden="true"
        className="relative z-10 mt-16 classic-card p-8 font-mono text-xl md:text-2xl
                   max-w-3xl w-full select-none"
      >
        <div className="flex items-center gap-2 mb-6 border-b border-surface-2 pb-3">
          <span className="text-xs font-sans font-semibold text-untyped">Lesson 1: The Basics</span>
        </div>
        <div className="leading-relaxed bg-surface-0 p-6 rounded border border-surface-2">
          <span className="text-correct">the quick brown </span>
          <span className="text-incorrect bg-red-100 dark:bg-red-900/30">f</span>
          <span className="text-correct">ox jumps over the </span>
          <span className="inline-block w-[2px] h-[1.2em] bg-violet animate-blink align-middle mx-[1px]" />
          <span className="text-untyped">lazy dog</span>
        </div>
      </div>
    </main>
  );
}
