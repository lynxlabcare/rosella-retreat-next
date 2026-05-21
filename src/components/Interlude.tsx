"use client";
/**
 * Interlude.tsx — ~70vh poetic transition section.
 *
 * Sits between TheVibe (horizontal-pin) and Amenities (sticky clip-path stack).
 * Acts as a breath — a chapter marker, a pull-quote, and ambient movement.
 *
 * Anatomy:
 *   1. Parallax glow blobs (two, opposing movement vectors)
 *   2. Chapter eyebrow: vertical accent line → "Chapter Two" → decorative "II"
 *   3. Italic serif pull-quote with word-by-word stagger + blur reveal
 *   4. Bottom attribution: short rule + estate credit
 *
 * Theme: fully driven by var(--rr-*) tokens; glow colour shifts via useTheme.
 */

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "motion/react";
import { useTheme } from "./context/ThemeContext";

// ─── Pull-quote copy ──────────────────────────────────────────────────────────

const QUOTE_LINES = [
  "Where the mountain air becomes memory,",
  "and stillness becomes its own",
  "kind of luxury.",
];

// Flatten to word objects carrying their line index for stagger
const WORDS = QUOTE_LINES.flatMap((line, li) =>
  line.split(" ").map((word, wi, arr) => ({
    text: word,
    // Append a soft non-breaking-space at line end so spans don't merge
    isLineEnd: wi === arr.length - 1,
    key: `${li}-${wi}`,
  }))
);

// ─── Stagger constants ────────────────────────────────────────────────────────

const WORD_DELAY_STEP = 0.055; // seconds between each word reveal
const WORD_DURATION = 0.70;
const WORD_EASE: [number, number, number, number] = [0.22, 0, 0.08, 1];

// ─── Component ────────────────────────────────────────────────────────────────

export function Interlude() {
  const sectionRef = useRef<HTMLElement>(null);
  const { isNight } = useTheme();

  // Scroll progress over the full section (enter → leave)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 18,
    restDelta: 0.001,
  });

  // ── Glow blob parallax transforms ──────────────────────────────────────────
  // Primary blob drifts up
  const blobAY = useTransform(smooth, [0, 1], ["15%", "-15%"]);
  const blobAX = useTransform(smooth, [0, 1], ["-4%", "4%"]);
  // Secondary blob drifts down-right
  const blobBY = useTransform(smooth, [0, 1], ["-10%", "10%"]);
  const blobBX = useTransform(smooth, [0, 1], ["3%", "-3%"]);

  // ── Theme-reactive glow colours ────────────────────────────────────────────
  const glowA = isNight
    ? "radial-gradient(ellipse at center, rgba(60,130,90,0.20) 0%, transparent 68%)"
    : "radial-gradient(ellipse at center, rgba(197,168,128,0.22) 0%, transparent 68%)";

  const glowB = isNight
    ? "radial-gradient(ellipse at center, rgba(44,97,80,0.14) 0%, transparent 65%)"
    : "radial-gradient(ellipse at center, rgba(197,168,128,0.12) 0%, transparent 65%)";

  // ── Total word count for attribution delay ─────────────────────────────────
  const totalWordDelay = WORDS.length * WORD_DELAY_STEP + 0.2;

  return (
    <section
      id="interlude"
      ref={sectionRef}
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{
        minHeight: "70vh",
        backgroundColor: "var(--rr-bg)",
      }}
    >

      {/* ── Parallax glow blob A (large, centred-left) ───────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{
          y: blobAY,
          x: blobAX,
          position: "absolute",
          width: "70vw",
          height: "70vw",
          maxWidth: 900,
          maxHeight: 900,
          borderRadius: "50%",
          background: glowA,
          top: "50%",
          left: "15%",
          translateY: "-50%",
          pointerEvents: "none",
        }}
      />

      {/* ── Parallax glow blob B (small, right) ─────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{
          y: blobBY,
          x: blobBX,
          position: "absolute",
          width: "40vw",
          height: "40vw",
          maxWidth: 520,
          maxHeight: 520,
          borderRadius: "50%",
          background: glowB,
          top: "40%",
          right: "5%",
          translateY: "-50%",
          pointerEvents: "none",
        }}
      />

      {/* ── Hair-line top rule ────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ backgroundColor: "var(--rr-border)" }}
      />

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 md:px-20 py-24 gap-10 w-full max-w-4xl mx-auto">

        {/* ── Chapter eyebrow ────────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.7, ease: [0.22, 0, 0.08, 1] }}
        >
          {/* Accent vertical line */}
          <div
            className="w-[1px] h-10"
            style={{ backgroundColor: "var(--rr-accent)" }}
          />

          {/* Eyebrow text */}
          <p
            className="text-[10px] uppercase tracking-[0.45em]"
            style={{ color: "var(--rr-accent)" }}
          >
            Chapter Two
          </p>

          {/* Decorative Roman numeral */}
          <div
            aria-hidden="true"
            className="font-['Cormorant_Garamond'] select-none leading-none"
            style={{
              fontSize: "clamp(4rem, 10vw, 8rem)",
              color: "var(--rr-text)",
              opacity: 0.07,
              letterSpacing: "0.15em",
              lineHeight: 1,
            }}
          >
            II
          </div>
        </motion.div>

        {/* ── Pull-quote — word-by-word stagger ──────────────────────────────── */}
        <blockquote
          className="font-['Cormorant_Garamond'] italic leading-[1.35]"
          style={{
            fontSize: "clamp(1.65rem, 3.4vw, 3rem)",
            color: "var(--rr-text)",
            // No max-width here so words reflow naturally at every breakpoint
          }}
        >
          {WORDS.map((w, i) => (
            <motion.span
              key={w.key}
              // inline-block so y transform works; trailing margin gives word-spacing
              className="inline-block"
              style={{ marginRight: "0.26em" }}
              initial={{ opacity: 0, y: 22, filter: "blur(5px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                delay: i * WORD_DELAY_STEP,
                duration: WORD_DURATION,
                ease: WORD_EASE,
              }}
            >
              {w.text}
            </motion.span>
          ))}
        </blockquote>

        {/* ── Attribution ────────────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{
            delay: totalWordDelay,
            duration: 0.65,
            ease: [0.22, 0, 0.08, 1],
          }}
        >
          {/* Short horizontal ornament */}
          <svg
            width="72"
            height="10"
            viewBox="0 0 72 10"
            fill="none"
            aria-hidden="true"
          >
            <line
              x1="0" y1="5" x2="26" y2="5"
              stroke="#C5A880"
              strokeWidth="0.75"
            />
            <circle cx="36" cy="5" r="2.5" fill="#C5A880" opacity="0.6" />
            <line
              x1="46" y1="5" x2="72" y2="5"
              stroke="#C5A880"
              strokeWidth="0.75"
            />
          </svg>

          <p
            className="text-[10px] uppercase tracking-[0.38em]"
            style={{ color: "var(--rr-text-secondary)" }}
          >
            Rosella Retreat — Est. 2024
          </p>
        </motion.div>

      </div>

      {/* ── Hair-line bottom rule ─────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ backgroundColor: "var(--rr-border)" }}
      />

    </section>
  );
}
