"use client";
/**
 * LenisContext — site-wide smooth scroll provider.
 *
 * Usage:
 *   import { useLenisScroll } from '../context/LenisContext';
 *   const { scrollY, scrollProgress, scrollTo, stop, start } = useLenisScroll();
 *
 * - `scrollY`        — MotionValue<number> tracking the smooth scroll offset (px).
 *                      Pipe directly into motion transforms without extra listeners.
 * - `scrollProgress` — MotionValue<number> normalised 0→1 across the full page.
 * - `scrollTo`       — programmatic scroll (accepts CSS selector, element, or px offset).
 * - `stop` / `start` — pause/resume Lenis (e.g. while a modal is open).
 *
 * Motion/React integration note:
 *   Lenis dispatches native `scroll` events on `window`, so `useScroll()` from
 *   motion/react works transparently. The `scrollY` MotionValue here is an
 *   alternative zero-overhead path that avoids an extra DOM listener.
 */

import Lenis from 'lenis';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useAnimationFrame, useMotionValue, type MotionValue } from 'motion/react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ScrollTarget = string | number | HTMLElement;

interface ScrollToOptions {
  /** Additional offset in pixels (e.g. to clear a sticky nav). */
  offset?: number;
  /** Skip animation and jump immediately. */
  immediate?: boolean;
  /** Override the instance duration for this scroll. */
  duration?: number;
  /** Override the instance easing for this scroll. */
  easing?: (t: number) => number;
  /** Lock scroll input while animating. */
  lock?: boolean;
  /** Callback when the scroll completes. */
  onComplete?: () => void;
}

interface LenisScrollEvent {
  scroll: number;
  limit: number;
  velocity: number;
  direction: number;
  progress: number;
}

interface LenisContextValue {
  /** The raw Lenis instance — use sparingly; prefer the helpers below. */
  lenis: Lenis | null;
  /** Smooth scroll offset in pixels, kept in sync with Lenis. */
  scrollY: MotionValue<number>;
  /** Normalised scroll progress 0 → 1. */
  scrollProgress: MotionValue<number>;
  /** Programmatic scroll to a target. */
  scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
  /** Pause smooth scrolling (e.g. modal open, drag active). */
  stop: () => void;
  /** Resume smooth scrolling. */
  start: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  scrollY: null as unknown as MotionValue<number>,
  scrollProgress: null as unknown as MotionValue<number>,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

// ─── Easing ──────────────────────────────────────────────────────────────────

/**
 * Exponential ease-out — the canonical "luxury" Lenis easing.
 * Starts fast, decelerates into a buttery halt.
 */
const luxuryEase = (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t));

// ─── Provider ────────────────────────────────────────────────────────────────

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  // MotionValues updated synchronously inside the Lenis scroll callback —
  // no extra RAF or state update required downstream.
  const scrollY = useMotionValue(0);
  const scrollProgress = useMotionValue(0);

  // ── Initialise Lenis once ────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: luxuryEase,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    const onScroll = ({ scroll, progress }: LenisScrollEvent) => {
      scrollY.set(scroll);
      scrollProgress.set(progress);
    };

    lenis.on('scroll', onScroll);
    lenisRef.current = lenis;

    return () => {
      lenis.off('scroll', onScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [scrollY, scrollProgress]);

  // ── Drive Lenis via Motion's animation loop ──────────────────────────────
  // Using useAnimationFrame keeps Lenis perfectly in sync with Motion's
  // internal scheduler — no duplicate RAF, no dropped frames.
  useAnimationFrame((time) => {
    lenisRef.current?.raf(time);
  });

  // ── Stable helpers ───────────────────────────────────────────────────────
  const stop = useCallback(() => lenisRef.current?.stop(), []);
  const start = useCallback(() => lenisRef.current?.start(), []);

  const scrollTo = useCallback(
    (target: ScrollTarget, options?: ScrollToOptions) => {
      lenisRef.current?.scrollTo(target as Parameters<Lenis['scrollTo']>[0], options);
    },
    [],
  );

  const value = useMemo<LenisContextValue>(
    () => ({
      get lenis() {
        return lenisRef.current;
      },
      scrollY,
      scrollProgress,
      scrollTo,
      stop,
      start,
    }),
    [scrollY, scrollProgress, scrollTo, stop, start],
  );

  return <LenisContext.Provider value={value}>{children}</LenisContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the Lenis scroll context.
 *
 * @example
 * const { scrollY, scrollTo } = useLenisScroll();
 * // Scroll to the booking section, clearing a 80px nav bar
 * scrollTo('#booking', { offset: -80 });
 */
export function useLenisScroll(): LenisContextValue {
  return useContext(LenisContext);
}
