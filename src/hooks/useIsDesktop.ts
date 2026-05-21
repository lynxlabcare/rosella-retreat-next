"use client";
import { useState, useEffect } from "react";
import { useReducedMotion } from "motion/react";

const MD_BREAKPOINT = "(min-width: 768px)";

/**
 * Returns `true` on desktop (≥768px) and when the user has NOT
 * requested reduced motion.
 *
 * Hydration contract: SSR and first client render both return `true`
 * (matching the server output). After mount, the real value is set.
 * This means mobile-specific branches must use CSS (display/visibility)
 * for structural changes, and JS gating only for Motion style objects.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true); // SSR default = desktop
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const mql = window.matchMedia(MD_BREAKPOINT);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isDesktop && !prefersReduced;
}
