'use client';

import { useEffect, useState } from 'react';
import { useTheme }            from 'next-themes';
import { Sun, Moon }           from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only run on client — signals that hydration is complete
  useEffect(() => { setMounted(true); }, []);

  // Must match the button's w/h so layout does not shift on mount.
  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden="true" />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        // Base
        'flex items-center justify-center w-9 h-9 rounded-lg',
        'border transition-all duration-200',
        // Colours — adapts to current theme
        'border-surface-3 text-muted',
        'hover:border-violet/40 hover:text-violet-light hover:bg-violet/8',
        // Focus ring for keyboard navigation
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-violet/50 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-surface',
        // Active scale micro-animation
        'active:scale-95',
      ].join(' ')}
    >
      {isDark
        ? <Sun  size={16} strokeWidth={2} aria-hidden="true" />
        : <Moon size={16} strokeWidth={2} aria-hidden="true" />
      }
    </button>
  );
}
