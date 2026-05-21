"use client";
/**
 * MagneticWrapper — wraps any element with a luxury magnetic hover effect.
 *
 * How it works:
 *   1. An outer `<div>` acts as the expanded "attraction zone" via padding.
 *      Negative margin cancels the padding's layout footprint, so the
 *      surrounding layout is completely unaffected.
 *   2. As the cursor moves anywhere inside this zone, the inner `motion.div`
 *      shifts proportionally toward the cursor via spring physics.
 *   3. On mouse leave the spring snaps the content back to center (0, 0).
 *
 * Props:
 *   strength  — 0–1, how far the content shifts toward the cursor (default 0.38).
 *   hitPad    — px of extra interaction area beyond the content (default 44).
 *   className — forwarded to the outer wrapper.
 *
 * Usage:
 *   <MagneticWrapper>
 *     <button>Reserve</button>
 *   </MagneticWrapper>
 *
 * The wrapper is transparent and pointer-event-aware — it does not visually
 * interfere with the child's own hover/focus styles.
 */

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface MagneticWrapperProps {
  children: ReactNode;
  /** Proportional pull strength 0–1. */
  strength?: number;
  /** Extra interaction padding beyond the child's natural bounds (px). */
  hitPad?: number;
  className?: string;
}

const SPRING_CONFIG = { stiffness: 220, damping: 16, mass: 0.5 } as const;

export function MagneticWrapper({
  children,
  strength = 0.38,
  hitPad   = 44,
  className,
}: MagneticWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, SPRING_CONFIG);
  const springY = useSpring(y, SPRING_CONFIG);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    /*
     * Outer zone: padding expands the hit area; negative margin keeps the
     * surrounding layout pristine. `inline-flex` ensures the wrapper
     * hugs the child's intrinsic size.
     */
    <div
      ref={wrapperRef}
      style={{
        padding:  hitPad,
        margin:  -hitPad,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Inner spring container — only this element translates */}
      <motion.div style={{ x: springX, y: springY }}>
        {children}
      </motion.div>
    </div>
  );
}
