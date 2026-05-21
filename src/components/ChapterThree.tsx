"use client";
/**
 * ChapterThree.tsx — ~65vh poetic bridge section.
 *
 * Sits between Amenities (sticky clip-path stack) and the rooms/suites section.
 * Quieter than the Interlude — a single breath before the personal spaces.
 *
 * Anatomy:
 *   1. Single centred pulsing glow blob
 *   2. Full-width hairline top rule
 *   3. Short centred hairline divider → directly above the chapter eyebrow
 *   4. Chapter eyebrow: "Chapter Three" + ghost roman numeral "III"
 *   5. Italic serif pull-quote with word-by-word stagger + blur reveal
 *   6. Accent diamond ornament + estate credit
 *   7. Full-width hairline bottom rule
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
  "Each suite,",
  "a different silence.",
];

// Flatten to word objects carrying their line index for stagger
const WORDS = QUOTE_LINES.flatMap((line, li) =>
  line.split(" ").map((word, wi) => ({
    text: word,
    key: `${li}-${wi}`,
  }))
);

// ─── Stagger constants ────────────────────────────────────────────────────────

const WORD_DELAY_STEP = 0.07;  // slightly slower — fewer words, more weight
const WORD_DURATION   = 0.75;
const WORD_EASE: [number, number, number, number] = [0.22, 0, 0.08, 1];

// ─── Component ────────────────────────────────────────────────────────────────

export function ChapterThree() {
  const sectionRef = useRef<HTMLElement>(null);
  const { isNight } = useTheme();

  // Scroll progress over the full section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 45,
    damping: 16,
    restDelta: 0.001,
  });

  // ── Single centred glow blob — gentle vertical drift ──────────────────────
  const blobY = useTransform(smooth, [0, 1], ["8%", "-8%"]);
  const blobScale = useTransform(smooth, [0, 0.5, 1], [0.92, 1.04, 0.95]);

  // ── Theme-reactive glow colour ─────────────────────────────────────────────
  // Night: cooler emerald-teal; Dusk: warm amber-gold
  const glowColor = isNight
    ? "radial-gradient(ellipse at center, rgba(52, 120, 85, 0.18) 0%, rgba(44, 97, 80, 0.10) 40%, transparent 70%)"
    : "radial-gradient(ellipse at center, rgba(197, 168, 128, 0.20) 0%, rgba(197, 168, 128, 0.10) 40%, transparent 70%)";

  // Attribution delay — after all words have revealed
  const totalWordDelay = WORDS.length * WORD_DELAY_STEP + 0.15;

  return (
    <section
      id="chapter-three"
      ref={sectionRef}
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{
        minHeight: "65vh",
        backgroundColor: "var(--rr-bg)",
      }}
    >

      {/* ── Full-width hairline top rule ──────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ backgroundColor: "var(--rr-border)" }}
      />

      {/* ── Single centred glow blob ──────────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{
          y: blobY,
          scale: blobScale,
          position: "absolute",
          width: "60vw",
          height: "60vw",
          maxWidth: 720,
          maxHeight: 720,
          borderRadius: "50%",
          background: glowColor,
          top: "50%",
          left: "50%",
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
        }}
      />

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 md:px-20 py-20 gap-8 w-full max-w-3xl mx-auto">

        {/* ── Hairline divider + Chapter eyebrow ──────────────────────────────── */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-14%" }}
          transition={{ duration: 0.72, ease: [0.22, 0, 0.08, 1] }}
        >
          {/* Short centred hairline divider — sits directly above the eyebrow */}
          <div
            className="w-12 h-[1px]"
            style={{ backgroundColor: "var(--rr-accent)", opacity: 0.55 }}
          />

          {/* Eyebrow label */}
          <p
            className="text-[9px] uppercase tracking-[0.50em]"
            style={{ color: "var(--rr-accent)" }}
          >
            Chapter Three
          </p>

          {/* Ghost roman numeral */}
          <div
            aria-hidden="true"
            className="font-['Cormorant_Garamond'] select-none"
            style={{
              fontSize: "clamp(3.5rem, 8vw, 6.5rem)",
              color: "var(--rr-text)",
              opacity: 0.06,
              letterSpacing: "0.18em",
              lineHeight: 1,
            }}
          >
            III
          </div>
        </motion.div>

        {/* ── Pull-quote — word-by-word stagger reveal ──────────────────────── */}
        <blockquote
          className="font-['Cormorant_Garamond'] italic"
          style={{
            fontSize: "clamp(1.85rem, 4.2vw, 3.6rem)",
            color: "var(--rr-text)",
            lineHeight: 1.25,
            letterSpacing: "0.01em",
          }}
        >
          {WORDS.map((w, i) => (
            <motion.span
              key={w.key}
              className="inline-block"
              style={{ marginRight: "0.28em" }}
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
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

        {/* ── Attribution ──────────────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{
            delay: totalWordDelay,
            duration: 0.60,
            ease: [0.22, 0, 0.08, 1],
          }}
        >
          {/* Diamond ornament */}
          <svg
            width="48"
            height="12"
            viewBox="0 0 48 12"
            fill="none"
            aria-hidden="true"
          >
            <line
              x1="0" y1="6" x2="17" y2="6"
              stroke="#C5A880"
              strokeWidth="0.65"
            />
            <rect
              x="21.5" y="3.5"
              width="5" height="5"
              transform="rotate(45 24 6)"
              fill="none"
              stroke="#C5A880"
              strokeWidth="0.75"
              opacity="0.65"
            />
            <line
              x1="31" y1="6" x2="48" y2="6"
              stroke="#C5A880"
              strokeWidth="0.65"
            />
          </svg>

          <p
            className="text-[9px] uppercase tracking-[0.42em]"
            style={{ color: "var(--rr-text-secondary)" }}
          >
            The Suites — Rosella Retreat
          </p>
        </motion.div>

      </div>

      {/* ── Full-width hairline bottom rule ──────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ backgroundColor: "var(--rr-border)" }}
      />

    </section>
  );
}
