"use client";
/**
 * ThemeContext — global Dusk / Night atmosphere system.
 *
 * Usage:
 *   import { useTheme } from '../context/ThemeContext';
 *   const { isNight, toggle, mode } = useTheme();
 *
 * How it works:
 *   - `toggle()` directly flips the `data-theme` attribute on <html>.
 *     The hero's two stacked videos crossfade via Motion's animate (opacity),
 *     while all other themed elements transition via CSS (background-color,
 *     color, border-color) defined in globals.css.
 *   - `setMode()` is an instant programmatic switch (no animation).
 *
 * CSS contract:
 *   Components must use `var(--rr-*)` tokens defined in globals.css,
 *   NOT hardcoded hex values, so the theme swap propagates everywhere.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ThemeMode = 'dusk' | 'night';

interface ThemeContextValue {
  mode: ThemeMode;
  /** Shorthand boolean — true when mode === 'night'. */
  isNight: boolean;
  /** Directly toggles mode; hero videos crossfade, CSS tokens transition. */
  toggle: () => void;
  /** Instant programmatic switch (no animation). */
  setMode: (mode: ThemeMode) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dusk',
  isNight: false,
  toggle: () => {},
  setMode: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dusk');

  // ── Apply data-theme to <html> whenever mode changes ─────────────────────
  useEffect(() => {
    const html = document.documentElement;
    if (mode === 'night') {
      html.setAttribute('data-theme', 'night');
    } else {
      html.removeAttribute('data-theme');
    }
  }, [mode]);

  // ── Stable helpers ────────────────────────────────────────────────────────

  /** Direct toggle — no overlay. Hero videos crossfade via Motion animate. */
  const toggle = useCallback(() => {
    setModeState(prev => (prev === 'night' ? 'dusk' : 'night'));
  }, []);

  /** Instant mode set — no animation, for programmatic / init use. */
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, isNight: mode === 'night', toggle, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the site-wide Dusk / Night theme context.
 *
 * @example
 * const { isNight, toggle } = useTheme();
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}