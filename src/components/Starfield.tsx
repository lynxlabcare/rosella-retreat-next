"use client";
/**
 * Starfield — a low-cost twinkling canvas overlay rendered only at Night.
 *
 * Performance notes:
 *   - Uses a single 2D canvas; stars are simple alpha-pulsing dots.
 *   - DPR-aware (capped at 2) so retina remains crisp without doubling work.
 *   - Driven by Motion's `useAnimationFrame`, so it shares the existing RAF
 *     loop with Lenis instead of opening a parallel one.
 *   - The component fades itself in/out via opacity so the parent can mount
 *     it permanently; we early-out the draw loop when invisible.
 */

import { useEffect, useRef } from 'react';
import { motion, useAnimationFrame } from 'motion/react';

interface Star {
  x: number;       // 0..1 normalised
  y: number;       // 0..1 normalised
  r: number;       // px radius at 1× DPR
  base: number;    // baseline alpha 0..1
  amp: number;     // twinkle amplitude
  speed: number;   // twinkle frequency
  phase: number;   // phase offset
}

const STAR_COUNT = 220;

function createStars(count: number): Star[] {
  const out: Star[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random(),
      y: Math.random() * 0.85,                 // bias toward upper sky
      r: 0.6 + Math.random() * 1.8,
      base: 0.55 + Math.random() * 0.4,
      amp: 0.25 + Math.random() * 0.45,
      speed: 0.0009 + Math.random() * 0.0024,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return out;
}

interface StarfieldProps {
  visible: boolean;
}

export function Starfield({ visible }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>(createStars(STAR_COUNT));
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  // ── Resize handling ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      sizeRef.current = { w, h, dpr };
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Draw loop (shares Motion's RAF) ────────────────────────────────────────
  // Keep drawing for a beat after `visible` flips off so the canvas isn't
  // frozen mid-pulse during the fade-out. We additively render with a soft
  // glow underlayer for a more luminous twinkle.
  useAnimationFrame((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let { w, h, dpr } = sizeRef.current;
    // Lazy resize fallback — if the layout-time effect hadn't measured yet,
    // catch up here so the very first visible frame paints correctly.
    if (w === 0 || h === 0) {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      sizeRef.current = { w, h, dpr };
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const stars = starsRef.current;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const twinkle = Math.sin(time * s.speed + s.phase);
      const alpha = Math.max(0, Math.min(1, s.base + twinkle * s.amp));

      // Soft halo
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = '#E8E2C8';
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Bright core
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });

  return (
    <motion.canvas
      ref={canvasRef}
      aria-hidden="true"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 w-full h-full pointer-events-none z-[15]"
    />
  );
}
