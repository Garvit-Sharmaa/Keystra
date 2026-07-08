import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Surface palette — wired to CSS variables in globals.css ──────────
        // Each token resolves to var(--surface-N), which switches value between
        // the :root (light) and html.dark blocks when next-themes toggles the class.
        surface: {
          DEFAULT: 'var(--surface-0)',
          1:       'var(--surface-1)',
          2:       'var(--surface-2)',
          3:       'var(--surface-3)',
        },
        // Brand (Now Teal based on new palette, but keeping the 'violet' token name to prevent massive refactoring)
        violet: {
          DEFAULT: 'var(--violet)',
          light:   'var(--violet-light)',
          dim:     'var(--violet-dim)',
        },
        // Typing states — switch between light/dark text and error colours
        correct:   'var(--correct)',
        incorrect: 'var(--incorrect)',
        untyped:   'var(--untyped)',
        caret:     'var(--caret-color)',
        // Status (static — no theme difference needed)
        success:   '#34d399',
        warning:   '#fbbf24',
        error:     '#f87171',
        muted:     '#6b7280',
      },
      animation: {
        'blink':        'blink 1.1s ease-in-out infinite',
        'slide-up':     'slideUp 0.3s ease-out',
        'fade-in':      'fadeIn 0.2s ease-out',
        'scale-in':     'scaleIn 0.15s ease-out',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(167, 139, 250, 0)' },
          '50%':      { boxShadow: '0 0 20px 4px rgba(167, 139, 250, 0.25)' },
        },
      },
      boxShadow: {
        'tactile':      '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
        // Premium card shadows
        'card':       '0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)',
        'card-inset': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
