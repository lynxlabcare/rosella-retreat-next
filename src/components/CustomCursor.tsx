"use client";
/**
 * CustomCursor — site-wide luxury two-layer cursor for Rosella Retreat.
 *
 * Architecture:
 *   Two elements share the same raw mouse position but use different springs,
 *   so the ring trails behind the dot, creating a high-end parallax feel.
 *
 *   • Outer ring  — stiffness 120 / damping 14  → noticeable lag
 *   • Inner dot   — stiffness 600 / damping 30  → near-instant follow
 *
 * Morphs:
 *   default  → 36 px ring, 5 px dot
 *   hover    → 52 px ring (filled, brighter border), 3 px dot (dimmed)
 *   click    → 26 px ring (scaled 0.8), 11 px dot (bloom)
 *
 * Safety:
 *   • Only rendered on fine-pointer (mouse) devices — touch screens are unaffected.
 *   • Fades out when the pointer leaves the viewport.
 *   • Rendered at z-9999 so it sits above the ThemeContext veil (z-9998).
 *   • pointer-events: none — never blocks interaction.
 *
 * Hover detection:
 *   Single `mouseover` delegation on document (one listener, no per-element
 *   wiring). Debounced via a ref to avoid redundant setState calls.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

// ─── Spring configs ───────────────────────────────────────────────────────────

const RING_SPRING = { stiffness: 120, damping: 14, mass: 0.1 } as const;
const DOT_SPRING  = { stiffness: 600, damping: 30 }             as const;

// ─── Interactive selector ─────────────────────────────────────────────────────

const INTERACTIVE =
  'a, button, [role="button"], input, label, select, textarea, [data-cursor-hover]';

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomCursor() {
  // ── Fine-pointer guard — deferred to useEffect so SSR + first client
  //    render both return null, avoiding hydration mismatch ──────────────
  const [isFinePointer, setIsFinePointer] = useState(false);

  useEffect(() => {
    setIsFinePointer(window.matchMedia('(pointer: fine)').matches);
  }, []);

  // ── Raw mouse position — updated synchronously, no React re-render ───────
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  // ── Ring: lagging spring ─────────────────────────────────────────────────
  const ringX = useSpring(mouseX, RING_SPRING);
  const ringY = useSpring(mouseY, RING_SPRING);

  // ── Dot: snappy spring ───────────────────────────────────────────────────
  const dotX = useSpring(mouseX, DOT_SPRING);
  const dotY = useSpring(mouseY, DOT_SPRING);

  // ── Cursor states ────────────────────────────────────────────────────────
  const [isVisible,  setIsVisible]  = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Ref for hover — prevents setState when value hasn't changed
  const hoverRef = useRef(false);

  // ── Event listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFinePointer) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsVisible(true);
    };

    const onLeave  = () => setIsVisible(false);
    const onEnter  = () => setIsVisible(true);

    const onOver = (e: MouseEvent) => {
      const hit = !!(e.target as Element).closest(INTERACTIVE);
      if (hit !== hoverRef.current) {
        hoverRef.current = hit;
        setIsHovering(hit);
      }
    };

    const onDown = () => setIsClicking(true);
    const onUp   = () => setIsClicking(false);

    document.addEventListener('mousemove',  onMove,  { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mouseover',  onOver,  { passive: true });
    document.addEventListener('mousedown',  onDown);
    document.addEventListener('mouseup',    onUp);

    return () => {
      document.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseover',  onOver);
      document.removeEventListener('mousedown',  onDown);
      document.removeEventListener('mouseup',    onUp);
    };
  }, [isFinePointer, mouseX, mouseY]);

  // ── Bail on touch devices ────────────────────────────────────────────────
  if (!isFinePointer) return null;

  // ── Shared base style (both elements use fixed + spring offset) ──────────
  const baseStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    pointerEvents: 'none' as const,
    zIndex: 9999,
    translateX: '-50%',
    translateY: '-50%',
    borderRadius: '50%',
  };

  return (
    <>
      {/* ── Outer Ring ─────────────────────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{ ...baseStyle, x: ringX, y: ringY }}
        animate={{
          width:           isClicking ? 26  : isHovering ? 52  : 36,
          height:          isClicking ? 26  : isHovering ? 52  : 36,
          opacity:         isVisible  ? (isHovering ? 0.9 : 0.6) : 0,
          scale:           isClicking ? 0.8 : 1,
          backgroundColor: isHovering
            ? 'rgba(197, 168, 128, 0.09)'
            : 'rgba(197, 168, 128, 0)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: isHovering
            ? 'rgba(197, 168, 128, 1)'
            : 'rgba(197, 168, 128, 0.65)',
        }}
        transition={{
          opacity:         { duration: 0.25, ease: 'easeOut' },
          backgroundColor: { duration: 0.25, ease: 'easeOut' },
          borderColor:     { duration: 0.25, ease: 'easeOut' },
          width:  { type: 'spring', stiffness: 300, damping: 22 },
          height: { type: 'spring', stiffness: 300, damping: 22 },
          scale:  { type: 'spring', stiffness: 400, damping: 28 },
        }}
      />

      {/* ── Inner Dot ──────────────────────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{ ...baseStyle, x: dotX, y: dotY, backgroundColor: '#C5A880' }}
        animate={{
          width:   isClicking ? 11 : isHovering ? 3  : 5,
          height:  isClicking ? 11 : isHovering ? 3  : 5,
          opacity: isVisible  ? (isHovering ? 0.45 : 1) : 0,
        }}
        transition={{
          opacity: { duration: 0.2, ease: 'easeOut' },
          width:   { type: 'spring', stiffness: 400, damping: 28 },
          height:  { type: 'spring', stiffness: 400, damping: 28 },
        }}
      />
    </>
  );
}
