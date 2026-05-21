"use client";
/**
 * SocialProof.tsx — Chapter IV · Guest Voices
 *
 * Interaction model (clean-testimonial pattern):
 *   • Click / tap anywhere on the quote stage → advance to next
 *   • Magnetic glassmorphism "Next" cursor follows mouse within the stage
 *   • Stacked initials circles (top-left) are individually clickable
 *
 * Anatomy:
 *   1. Editorial quote stage:
 *        • Ghost " glyph + dual ambient glows
 *        • Chapter IV eyebrow
 *        • Stacked initials mini-circles (top-left) + floating index counter (top-right)
 *        • Word-stagger quote (AnimatePresence mode="wait")
 *        • Attribution: large initials circle + scaleY accent line + name / stay
 *        • Index-based progress bar (Motion animate, no rAF)
 *        • "Tap anywhere" hint
 *        • Spring-damped magnetic cursor
 *   2. Marquee ribbon — two rows, opposing directions, italic micro-quotes
 *   3. Aggregate rating footer — score ticker + review count + platform badges
 *
 * Theme: all colours via var(--rr-*) tokens.
 */

import { useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "motion/react";
import { Star } from "lucide-react";
import { useTheme } from "./context/ThemeContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// ─── Testimonial data ──────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:
      "Beautiful property. Had a wonderful experience. Peaceful locality",
    name: "Shashank Khareta",
  },
  {
    quote:
      "It was a wonderful experience staying at the property, warm welcome gesture with a mocktail. The Room was spacious and clean with all the amenities. Food was amazing with freshly cooked and live barbeque.",
    name: "Tushar Puri",
  },
  {
    quote:
      "The place feels truly luxurious with a beautiful garden and top-notch interiors. It’s also very private and secure, which makes the stay even more comfortable.",
    name: "Tushar Tewatia",
  },
  {
    quote:
      "I recently stayed at Rosella Retreat Dehradun, and overall, it was a wonderful experience. The property itself is absolutely amazing—beautifully maintained, peaceful, and perfect for a relaxing getaway.",
    name: "Gaurav Bansal",
  },
];

// ─── Marquee micro-quotes ──────────────────────────────────────────────────────

const MARQUEE_A = [
  "Woke up to silence and sunlight",
  "The best sleep of my life",
  "A retreat that earns its name",
  "Worth every moment and more",
  "Like staying inside a dream",
  "Our anniversary, perfected",
  "The air alone is therapy",
  "Booked again before checkout",
  "Nothing prepares you for the view",
  "Stillness, rediscovered",
];

const MARQUEE_B = [
  "Every morning felt like a gift",
  "The valley never looked more alive",
  "Architecture in conversation with nature",
  "Luxury without a single excess",
  "We didn't want to leave",
  "A place that changes how you breathe",
  "Curated down to the last detail",
  "Serenity with a spine",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract two-letter initials: "Rohan & Priya K." → "RK", "Aisha M." → "AM" */
function getInitials(name: string): string {
  const parts = name.replace(/[&.]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Split quote into word objects for stagger animation */
function splitWords(text: string) {
  return text.split(" ").map((w, i) => ({ text: w, idx: i }));
}

const WORD_DELAY = 0.036;
const WORD_DUR   = 0.68;
const WORD_EASE: [number, number, number, number] = [0.22, 0, 0.08, 1];

// ─── Component ────────────────────────────────────────────────────────────────

export function SocialProof() {
  const { isNight } = useTheme();
  const [activeIdx, setActiveIdx]   = useState(0);
  const [isHovered, setIsHovered]   = useState(false);
  const [ratingVal, setRatingVal]   = useState(0);
  const [ratingFired, setRatingFired] = useState(false);
  const stageRef    = useRef<HTMLDivElement>(null);
  const ratingRef   = useRef<HTMLDivElement>(null);
  const sectionRef  = useRef<HTMLElement>(null);

  // ── Scroll effects for mountain background ───────────────────────────────
  const { scrollYProgress: sectionScroll } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });

  const bgTop = useTransform(sectionScroll, [0, 1], ["calc(-50vh - 305px)", "0px"]);
  const bgLeft = useTransform(sectionScroll, [0, 1], ["calc(50vw - 240px)", "0px"]);
  const bgWidth = useTransform(sectionScroll, [0, 1], ["480px", "100%"]);
  const bgHeight = useTransform(sectionScroll, [0, 1], ["610px", "100vh"]);
  const bgRadius = useTransform(sectionScroll, [0, 1], ["4px", "0px"]);
  const bgBlur = useTransform(sectionScroll, [0, 1], ["blur(0px)", "blur(18px)"]);
  const bgOpacity = useTransform(sectionScroll, [0, 0.001], [0, 1]);
  const overlayOpacity = useTransform(sectionScroll, [0, 0.15], [1, 0]);
  const bgScale = useTransform(sectionScroll, [0, 1], [1, 1.05]);

  // ── Magnetic cursor motion values ──────────────────────────────────────────
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cursorX = useSpring(mouseX, { damping: 25, stiffness: 150 });
  const cursorY = useSpring(mouseY, { damping: 25, stiffness: 150 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    setActiveIdx(i => (i + 1) % TESTIMONIALS.length);
  }, []);

  const goTo = useCallback((i: number) => {
    setActiveIdx(((i % TESTIMONIALS.length) + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  // ── Rating ticker ──────────────────────────────────────────────────────────
  const handleRatingRef = useCallback((el: HTMLDivElement | null) => {
    (ratingRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el || ratingFired) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRatingFired(true);
          const TARGET = 4.9, TICK_MS = 1800;
          let start: number | null = null;
          const run = (now: number) => {
            if (!start) start = now;
            const t = Math.min((now - start) / TICK_MS, 1);
            setRatingVal(parseFloat(((1 - Math.pow(1 - t, 3)) * TARGET).toFixed(1)));
            if (t < 1) requestAnimationFrame(run);
          };
          requestAnimationFrame(run);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
  }, [ratingFired]);

  // ── Theme glows ───────────────────────────────────────────────────────────
  const glowA = isNight
    ? "radial-gradient(ellipse 80% 70% at 10% 60%, rgba(52,120,85,0.12) 0%, transparent 65%)"
    : "radial-gradient(ellipse 80% 70% at 10% 60%, rgba(197,168,128,0.13) 0%, transparent 65%)";
  const glowB = isNight
    ? "radial-gradient(ellipse 50% 60% at 85% 30%, rgba(44,97,80,0.09) 0%, transparent 65%)"
    : "radial-gradient(ellipse 50% 60% at 85% 30%, rgba(197,168,128,0.09) 0%, transparent 65%)";

  const current = TESTIMONIALS[activeIdx];
  const words   = splitWords(current.quote);

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className="relative w-full overflow-x-clip"
      style={{ backgroundColor: "var(--rr-bg)" }}
    >
      {/* ── Expanding Mountain Background ─────────────────────────────────── */}
      <motion.div
        style={{
          position: "absolute",
          top: bgTop,
          left: bgLeft,
          width: bgWidth,
          height: bgHeight,
          borderRadius: bgRadius,
          filter: bgBlur,
          opacity: bgOpacity,
          scale: bgScale,
          zIndex: 0,
          overflow: "hidden"
        }}
      >
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1610952861479-94ed16e2757e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXNoJTIwZ3JlZW4lMjBtb3VudGFpbiUyMGZvZ3xlbnwxfHx8fDE3Nzg0MjQ0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Rosella Retreat — Lush mountain fog"
          className="w-full h-full object-cover block"
        />
        
        {/* Gradient overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
        
        {/* Overlays that match Gallery.tsx to fade out smoothly */}
        <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(160deg, rgba(0,0,0,0.06) 0%, transparent 45%, rgba(0,0,0,0.62) 100%)",
            }}
          />
          <div className="absolute top-5 right-5 w-6 h-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
              <path d="M24 0 V24 H18" stroke="#C5A880" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
            <p
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: "10px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              Rosella Retreat — Lush mountain fog
            </p>
          </div>
          <div
            className="absolute inset-0"
            style={{ borderRadius: "4px", border: "1px dashed rgba(197,168,128,0.4)" }}
          />
        </motion.div>
      </motion.div>

      {/* Top hairline */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{ backgroundColor: "var(--rr-border)" }}
      />

      {/* ════════════════════════════════════════════════════════════════════
          1 · EDITORIAL QUOTE STAGE
          ════════════════════════════════════════════════════════════════════ */}
      <div
        ref={stageRef}
        className="relative w-full flex flex-col select-none z-10"
        style={{ minHeight: "82vh" }}
        onClick={handleNext}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ── Ambient glows ────────────────────────────────────────────────── */}
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: glowA }} />
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: glowB }} />

        {/* ── Ghost " glyph ────────────────────────────────────────────────── */}
        <div
          aria-hidden
          className="absolute pointer-events-none font-['Cormorant_Garamond']"
          style={{
            top: "-2%", left: "2%",
            fontSize: "clamp(12rem, 24vw, 26rem)",
            lineHeight: 1,
            color: "var(--rr-text)",
            opacity: 0.048,
            letterSpacing: "-0.05em",
          }}
        >
          "
        </div>

        {/* ── Magnetic cursor ──────────────────────────────────────────────── */}
        <motion.div
          className="pointer-events-none absolute z-50"
          style={{ x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }}
        >
          <motion.div
            className="rounded-full flex items-center justify-center overflow-hidden"
            animate={{
              width:   isHovered ? 76 : 0,
              height:  isHovered ? 76 : 0,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            style={{
              background: "rgba(197,168,128,0.18)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(197,168,128,0.45)",
            }}
          >
            <motion.span
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: "var(--rr-accent)" }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ delay: 0.08 }}
            >
              Next
            </motion.span>
          </motion.div>
        </motion.div>

        {/* ── Top row: stacked initials (left) + index counter (right) ─────── */}
        <div className="relative z-10 flex items-center justify-between px-8 md:px-16 lg:px-24 pt-10 pb-0">

          {/* Stacked mini initials */}
          <motion.div
            className="flex -space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.button
                key={t.name}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                aria-label={`Go to ${t.name}`}
                className="relative w-7 h-7 rounded-full flex items-center justify-center
                           border-2 transition-all duration-300"
                style={{
                  borderColor:  "var(--rr-bg)",
                  background:   i === activeIdx
                    ? "linear-gradient(135deg, rgba(197,168,128,0.3) 0%, rgba(44,61,48,0.15) 100%)"
                    : "rgba(197,168,128,0.08)",
                  boxShadow:    i === activeIdx ? "0 0 0 1.5px #C5A880" : "none",
                  opacity:      i === activeIdx ? 1 : 0.45,
                  filter:       i === activeIdx ? "none" : "grayscale(1)",
                }}
                whileHover={{ scale: 1.12, opacity: 1 }}
              >
                <span
                  className="font-['Cormorant_Garamond'] italic"
                  style={{
                    fontSize: "8px",
                    color: "var(--rr-accent)",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}
                >
                  {getInitials(t.name)}
                </span>
              </motion.button>
            ))}
          </motion.div>

          {/* Floating index counter */}
          <motion.div
            className="flex items-baseline gap-1 font-['Cormorant_Garamond']"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={activeIdx}
                style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                  color: "var(--rr-text)",
                  lineHeight: 1,
                }}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 0, 0.08, 1] }}
              >
                {String(activeIdx + 1).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
            <span
              className="font-['Cormorant_Garamond']"
              style={{
                fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)",
                color: "var(--rr-text-secondary)",
                opacity: 0.55,
              }}
            >
              /{String(TESTIMONIALS.length).padStart(2, "0")}
            </span>
          </motion.div>
        </div>

        {/* ── Chapter eyebrow ──────────────────────────────────────────────── */}
        <motion.div
          className="relative z-10 flex items-center gap-4 px-8 md:px-16 lg:px-24 mt-8"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.72, ease: [0.22, 0, 0.08, 1] }}
        >
          <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--rr-accent)" }} />
          <p
            className="uppercase tracking-[0.4em]"
            style={{ fontSize: "12px", color: "var(--rr-accent)" }}
          >
            Chapter IV — Guest Voices
          </p>
        </motion.div>

        {/* ── Quote ────────────────────────────────────────────────────────── */}
        <div className="relative z-10 px-8 md:px-16 lg:px-24 mt-8 max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={activeIdx}
              className="font-['Cormorant_Garamond'] italic"
              style={{
                fontSize: "clamp(1.65rem, 3.2vw, 3rem)",
                color: "#FFFFFF",
                lineHeight: 1.42,
                letterSpacing: "0.008em",
              }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
            >
              {words.map((w) => (
                <motion.span
                  key={`${activeIdx}-${w.idx}`}
                  className="inline-block"
                  style={{ marginRight: "0.27em" }}
                  initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: w.idx * WORD_DELAY, duration: WORD_DUR, ease: WORD_EASE }}
                >
                  {w.text}
                </motion.span>
              ))}
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* ── Attribution ──────────────────────────────────────────────────── */}
        <div className="relative z-10 px-8 md:px-16 lg:px-24 mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`attr-${activeIdx}`}
              className="flex items-center gap-5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
              transition={{
                delay: words.length * WORD_DELAY + 0.1,
                duration: 0.45,
                ease: [0.22, 0, 0.08, 1],
              }}
            >
              {/* Large initials circle */}
              <div className="relative flex-shrink-0">
                {/* Outer ring */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    inset: "-6px",
                    border: "1px solid rgba(197,168,128,0.35)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Circle container — all initials stacked, one visible */}
                <div className="relative w-12 h-12">
                  {TESTIMONIALS.map((t, i) => (
                    <motion.div
                      key={t.name}
                      className="absolute inset-0 w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgba(197,168,128,0.18) 0%, rgba(44,61,48,0.10) 100%)",
                        border: "1px solid rgba(197,168,128,0.28)",
                        backdropFilter: "blur(8px)",
                      }}
                      animate={{
                        opacity: i === activeIdx ? 1 : 0,
                        zIndex:  i === activeIdx ? 1 : 0,
                      }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      <span
                        className="font-['Cormorant_Garamond'] italic"
                        style={{
                          fontSize: "1rem",
                          color: "var(--rr-accent)",
                          letterSpacing: "0.06em",
                          lineHeight: 1,
                        }}
                      >
                        {getInitials(t.name)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Name + details with scaleY accent line */}
              <div className="relative pl-5">
                {/* Vertical accent line — scaleY reveal from top */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-px"
                  style={{
                    backgroundColor: "var(--rr-accent)",
                    transformOrigin: "top",
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                />
                <span
                  className="block uppercase tracking-[0.22em]"
                  style={{ fontSize: "11px", color: "#FFFFFF" }}
                >
                  {current.name}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Progress bar + hint ───────────────────────────────────────────── */}
        <div className="relative z-10 px-8 md:px-16 lg:px-24 mt-10 pb-8">
          {/* Index-based progress hairline */}
          <div
            className="w-full h-[1px] relative overflow-hidden"
            style={{ backgroundColor: "var(--rr-border)" }}
          >
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{ backgroundColor: "var(--rr-accent)" }}
              animate={{ width: `${((activeIdx + 1) / TESTIMONIALS.length) * 100}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* "Tap anywhere" hint */}
          <motion.p
            className="mt-4 text-[10px] uppercase tracking-[0.38em]"
            style={{ color: "var(--rr-text-secondary)" }}
            animate={{ opacity: isHovered ? 0.35 : 0.18 }}
            transition={{ duration: 0.3 }}
          >
            Tap anywhere · Next
          </motion.p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          2 · MARQUEE RIBBON
          ════════════════════════════════════════════════════════════════════ */}
      <div
        className="w-full overflow-hidden py-5 relative z-10"
        style={{
          borderTop:    "1px solid var(--rr-border)",
          borderBottom: "1px solid var(--rr-border)",
          backgroundColor: "var(--rr-bg)",
        }}
        aria-hidden
      >
        {/* Row 1 — scrolls left */}
        <div className="flex overflow-hidden mb-3">
          <div
            className="flex shrink-0 gap-6 items-center"
            style={{ animation: "rr-marquee-l 34s linear infinite" }}
          >
            {[...MARQUEE_A, ...MARQUEE_A].map((q, i) => (
              <MarqueeItem key={i} text={q} />
            ))}
          </div>
        </div>
        {/* Row 2 — scrolls right */}
        <div className="flex overflow-hidden">
          <div
            className="flex shrink-0 gap-6 items-center"
            style={{ animation: "rr-marquee-r 42s linear infinite" }}
          >
            {[...MARQUEE_B, ...MARQUEE_B].map((q, i) => (
              <MarqueeItem key={i} text={q} accent />
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          3 · AGGREGATE RATING FOOTER
          ════════════════════════════════════════════════════════════════════ */}
      <div
        ref={handleRatingRef}
        className="w-full flex flex-col md:flex-row items-center justify-center relative z-10
                   gap-10 md:gap-0 px-10 py-16 md:py-20"
        style={{ backgroundColor: "var(--rr-bg)" }}
      >
        {/* Score ticker */}
        <RatingBlock>
          <p
            className="font-['Cormorant_Garamond'] tabular-nums"
            style={{
              fontSize: "clamp(4rem, 9vw, 7rem)",
              color: "var(--rr-text)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {ratingVal.toFixed(1)}
          </p>
          <div className="flex gap-1 mt-2" style={{ color: "#C5A880" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
          <p
            className="uppercase tracking-[0.45em] mt-2"
            style={{ fontSize: "9px", color: "var(--rr-text-secondary)" }}
          >
            Average rating
          </p>
        </RatingBlock>

        <Divider />

        {/* Review count */}
        <RatingBlock>
          <p
            className="font-['Cormorant_Garamond']"
            style={{
              fontSize: "clamp(4rem, 9vw, 7rem)",
              color: "var(--rr-text)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            200<span style={{ color: "var(--rr-accent)" }}>+</span>
          </p>
          <p
            className="uppercase tracking-[0.45em] mt-4"
            style={{ fontSize: "9px", color: "var(--rr-text-secondary)" }}
          >
            Guest reviews
          </p>
        </RatingBlock>

        <Divider />

        {/* Platform badges */}
        <RatingBlock>
          <p
            className="uppercase tracking-[0.5em] mb-5"
            style={{ fontSize: "9px", color: "var(--rr-accent)" }}
          >
            Verified on
          </p>
          <div className="flex flex-col gap-2.5">
            {["Airbnb", "Google", "Booking.com"].map((name) => (
              <div
                key={name}
                className="flex items-center gap-2.5 px-5 py-2 rounded-full border"
                style={{
                  borderColor: "var(--rr-border)",
                  color: "var(--rr-text-secondary)",
                }}
              >
                <div
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--rr-accent)" }}
                />
                <span className="text-[10px] uppercase tracking-[0.25em]">{name}</span>
              </div>
            ))}
          </div>
        </RatingBlock>
      </div>

      {/* Bottom hairline */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] z-10"
        style={{ backgroundColor: "var(--rr-border)" }}
      />

      {/* Marquee keyframes */}
      <style>{`
        @keyframes rr-marquee-l {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes rr-marquee-r {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MarqueeItem({ text, accent = false }: { text: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-5 shrink-0">
      <span
        className="font-['Cormorant_Garamond'] italic whitespace-nowrap"
        style={{
          fontSize: "clamp(0.88rem, 1.25vw, 1.05rem)",
          color: accent ? "var(--rr-accent)" : "var(--rr-text-secondary)",
          opacity: 0.72,
        }}
      >
        {text}
      </span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="1.5" fill="#C5A880" opacity="0.38" />
      </svg>
    </div>
  );
}

function RatingBlock({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center flex-1 md:px-12 lg:px-20">
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      className="hidden md:block w-[1px] self-stretch my-4"
      style={{ backgroundColor: "var(--rr-border)" }}
    />
  );
}
