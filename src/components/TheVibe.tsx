"use client";
/**
 * TheVibe.tsx — Horizontal-pinned scroll section.
 *
 * Three panels (300 vw total) translate along X as the user scrolls
 * through a 300 vh outer section. The inner container is sticky so
 * the panels pass through the viewport without the page reflowing.
 *
 * Panel 1 — Manifesto copy + CTA
 * Panel 2 — Full-bleed photography + floating stat card
 * Panel 3 — Atmospheric quote + key estate stats
 *
 * Mobile: Panels stack vertically in natural document flow — no sticky,
 * no horizontal translation, no forced viewport heights.
 */

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { MagneticWrapper } from "./MagneticWrapper";
import Image from "next/image";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const PANEL_COUNT = 3;

// ─── Panel 1 — Manifesto ─────────────────────────────────────────────────────

function ManifestoPanel({
  progress,
  isDesktop,
}: {
  progress: MotionValue<number>;
  isDesktop: boolean;
}) {
  // First panel is always visible on enter; fades out as we scroll to panel 2
  const opacity = useTransform(progress, [0, 0.75, 1], [1, 1, 0]);
  const y = useTransform(progress, [0, 0.75, 1], [0, 0, -24]);

  return (
    <div
      className="w-screen shrink-0 snap-center relative overflow-hidden md:w-[100vw] md:h-full max-md:!transform-none md:flex md:items-center h-[100svh] md:h-auto"
      style={{ backgroundColor: "var(--rr-bg)" }}
    >
      {/* ── Desktop: absolute right image ── */}
      <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[50vw] lg:w-[55vw] h-full overflow-hidden pointer-events-none">
        <Image
          src="/Symphony.webp"
          alt="A Symphony of Light and Space"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, var(--rr-bg) 0%, transparent 25%)" }}
        />
      </div>

      {/* ── Mobile: image on top, text below ── */}
      <div className="md:hidden w-full h-full flex flex-col">
        {/* Image slot — tall enough to push text near the bottom */}
        <div className="relative w-full flex-1 min-h-0 overflow-hidden">
          <Image
            src="/Symphony.webp"
            alt="A Symphony of Light and Space"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1vw"
          />
          {/* bottom fade into bg */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 55%, var(--rr-bg) 100%)" }}
          />
        </div>
        {/* Text slot — compact, sits at the bottom */}
        <div className="px-8 pt-4 pb-4 flex flex-col flex-shrink-0" style={{ backgroundColor: "var(--rr-bg)" }}>
          <p className="text-[#C5A880] text-[11px] uppercase tracking-[0.35em] mb-2">The Vibe</p>
          <h2
            className="font-['Cormorant_Garamond'] leading-[1.07] mb-3"
            style={{ fontSize: "clamp(1.6rem, 6vw, 2.2rem)", color: "var(--rr-text)" }}
          >
            A Symphony of<br />
            <em style={{ color: "var(--rr-accent)", fontStyle: "italic" }}>Light</em>{" "}and Space
          </h2>
          <p className="text-sm leading-relaxed mb-2 font-light" style={{ color: "var(--rr-text-secondary)" }}>
            Accommodating up to 12 esteemed guests, Rosella Retreat is a sanctuary of modern refinement.
          </p>
          <p className="text-sm leading-relaxed mb-4 font-light" style={{ color: "var(--rr-text-secondary)" }}>
            From dawn-lit coffees on the expansive patio to twilight gatherings — staycation luxury, redefined.
          </p>
          <button className="flex items-center gap-4 group w-fit">
            <span
              className="text-xs uppercase tracking-widest font-semibold border-b pb-1"
              style={{ color: "var(--rr-text)", borderColor: "var(--rr-text)" }}
            >
              Discover the Estate
            </span>
            <span className="h-[1px] w-8" style={{ backgroundColor: "var(--rr-text)" }} />
          </button>
        </div>
      </div>

      {/* ── Desktop: text overlay (left side) ── */}
      <motion.div
        style={isDesktop ? { opacity, y } : {}}
        className="hidden md:flex relative z-10 w-full max-w-2xl px-10 md:px-20 lg:px-28 flex-col"
      >
        <p className="text-[#C5A880] text-[11px] uppercase tracking-[0.35em] mb-8">The Vibe</p>
        <h2
          className="font-['Cormorant_Garamond'] leading-[1.07] mb-10"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)", color: "var(--rr-text)" }}
        >
          A Symphony of<br />
          <em style={{ color: "var(--rr-accent)", fontStyle: "italic" }}>Light</em>{" "}and Space
        </h2>
        <p className="text-lg leading-relaxed mb-6 font-light" style={{ color: "var(--rr-text-secondary)" }}>
          Accommodating up to 13 esteemed guests, Rosella Retreat is a sanctuary of modern refinement. Every corner in this 3BHK mansion is meticulously crafted to offer unparalleled privacy while embracing the natural splendour of Uttarakhand.
        </p>
        <p className="text-lg leading-relaxed mb-12 font-light" style={{ color: "var(--rr-text-secondary)" }}>
          From dawn-lit coffees on the expansive patio to twilight gatherings in our acoustically treated living spaces — staycation luxury, redefined.
        </p>
        <MagneticWrapper hitPad={32} strength={0.32}>
          <button className="flex items-center gap-4 group w-fit">
            <span
              className="text-sm uppercase tracking-widest font-semibold border-b pb-1 group-hover:text-[#C5A880] group-hover:border-[#C5A880] transition-colors duration-300"
              style={{ color: "var(--rr-text)", borderColor: "var(--rr-text)" }}
            >
              Discover the Estate
            </span>
            <span className="h-[1px] w-10 group-hover:bg-[#C5A880] group-hover:w-16 transition-all duration-300" style={{ backgroundColor: "var(--rr-text)" }} />
          </button>
        </MagneticWrapper>
      </motion.div>

      {/* Right separator (desktop only) */}
      <div
        className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-1/3"
        style={{ backgroundColor: "var(--rr-border)" }}
      />
    </div>
  );
}

// ─── Panel 2 — Full-bleed imagery ────────────────────────────────────────────

function ImageryPanel({
  progress,
  isDesktop,
}: {
  progress: MotionValue<number>;
  isDesktop: boolean;
}) {
  const imgScale = useTransform(progress, [0, 0.15, 0.85, 1], [1.08, 1, 1, 1.05]);
  const cardOpacity = useTransform(progress, [0.1, 0.3, 0.75, 0.95], [0, 1, 1, 0]);
  const cardY = useTransform(progress, [0.1, 0.3, 0.75, 0.95], [28, 0, 0, -18]);

  return (
    <div
      className="w-screen shrink-0 snap-center relative overflow-hidden md:w-[100vw] md:h-full max-md:!transform-none"
    >
      {/* Full-bleed photo */}
      <motion.div
        style={isDesktop ? { scale: imgScale } : {}}
        className="absolute inset-0 w-full h-full origin-center max-md:!transform-none"
      >
        <Image
          src="/Exterior_Full.webp"
          alt="Rosella Retreat infinity pool at dusk"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />

      {/* Bottom content */}
      <motion.div
        style={isDesktop ? { opacity: cardOpacity, y: cardY } : {}}
        className="absolute bottom-12 left-10 md:left-20 right-10 md:right-20
                   flex flex-col md:flex-row items-end justify-between gap-8 max-md:!transform-none max-md:!opacity-100"
      >
        {/* Left label */}
        <div>
          <p className="text-[#C5A880] text-[11px] uppercase tracking-[0.3em] mb-2">
            Rosella Retreat
          </p>
          <p
            className="font-['Cormorant_Garamond'] leading-[1.1]"
            style={{ fontSize: "clamp(1.6rem, 3vw, 3rem)", color: "#F9F8F6" }}
          >
            Uttarakhand, India
            <br />
            <span style={{ opacity: 0.65, fontSize: "0.55em" }}>
              3,800 ft above sea level
            </span>
          </p>
        </div>

        {/* Right floating stat card */}
        <div
          className="border-l-4 border-[#C5A880] pl-6 py-2 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(197,168,128,0.06)" }}
        >
          <p className="font-['Cormorant_Garamond'] text-4xl text-white mb-[2px]">10 + 3</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/65">
            Guests maximum
          </p>
          <div className="mt-4">
            <p className="font-['Cormorant_Garamond'] text-4xl text-white mb-[2px]">3</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/65">
              Luxury bedrooms
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Panel 3 — Essence ────────────────────────────────────────────────────────

const STATS = [
  { value: "3", label: "Bedrooms" },
  { value: "3", label: "Bathrooms" },
  { value: "13", label: "Guests" },
  { value: "∞", label: "Views" },
];

function EssencePanel({
  progress,
  isDesktop,
}: {
  progress: MotionValue<number>;
  isDesktop: boolean;
}) {
  const opacity = useTransform(progress, [0, 0.2, 1], [0, 1, 1]);
  const y = useTransform(progress, [0, 0.2, 1], [44, 0, 0]);

  return (
    <div
      className="w-screen shrink-0 snap-center relative overflow-hidden md:w-[100vw] md:h-full md:grid md:grid-cols-2 flex flex-col max-md:!transform-none h-[100svh] md:h-auto"
      style={{ backgroundColor: "var(--rr-bg)" }}
    >
      {/* Left photo */}
      <div
        className="relative overflow-hidden w-full h-[45svh] md:h-full flex-shrink-0"
      >
        <Image
          src="/Night Patio.webp"
          alt="Rosella dining experience"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div
          className="absolute inset-0 hidden md:block"
          style={{ background: "linear-gradient(to right, transparent 55%, var(--rr-bg) 100%)" }}
        />
        <div
          className="absolute inset-0 md:hidden"
          style={{ background: "linear-gradient(to bottom, transparent 65%, var(--rr-bg) 100%)" }}
        />
      </div>

      {/* Right copy */}
      <motion.div
        style={isDesktop ? { opacity, y } : {}}
        className="flex flex-col justify-center px-10 md:px-14 lg:px-20 py-16 max-md:!transform-none max-md:!opacity-100"
      >
        <p className="text-[#C5A880] text-[11px] uppercase tracking-[0.35em] mb-8">
          The Essence
        </p>

        <blockquote
          className="font-['Cormorant_Garamond'] leading-[1.15] mb-10"
          style={{
            fontSize: "clamp(1.6rem, 3.2vw, 2.8rem)",
            color: "var(--rr-text)",
          }}
        >
          "Not a hotel.
          <br />
          Not a resort.
          <br />
          <em style={{ color: "var(--rr-accent)" }}>A private world."</em>
        </blockquote>

        <p
          className="text-base leading-relaxed mb-14 max-w-sm font-light"
          style={{ color: "var(--rr-text-secondary)" }}
        >
          No crowds. No schedules. No compromises. Rosella Retreat exists solely
          for you and your chosen few — an estate designed around the luxury of
          absolute exclusivity.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              className="max-md:!transform-none max-md:!opacity-100"
            >
              <p
                className="font-['Cormorant_Garamond'] mb-1 leading-none"
                style={{
                  fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
                  color: "var(--rr-text)",
                }}
              >
                {s.value}
              </p>
              <p
                className="text-[10px] uppercase tracking-[0.22em]"
                style={{ color: "var(--rr-text-secondary)" }}
              >
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Scroll arrow hint ────────────────────────────────────────────────────────

function ScrollArrowHint() {
  return (
    <motion.svg
      width="34"
      height="14"
      viewBox="0 0 34 14"
      fill="none"
      animate={{ x: [0, 7, 0] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
    >
      <path
        d="M0 7H32M26 1L32 7L26 13"
        stroke="#C5A880"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TheVibe() {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.001,
  });

  // Translate the strip using plateaus
  // Wider sliding windows (0.30) to make the transition smoother and less abrupt
  const x = useTransform(
    smooth,
    [0, 0.18, 0.48, 0.66, 0.96, 1],
    ["0vw", "0vw", "-100vw", "-100vw", "-200vw", "-200vw"]
  );

  // Per-panel progress mapping adjusted for the new plateaus
  // Midpoint of slide 1->2 is ~0.33. Midpoint of slide 2->3 is ~0.81.
  const p0 = useTransform(smooth, [0, 0.33], [0, 1]);
  const p1 = useTransform(smooth, [0.33, 0.81], [0, 1]);
  const p2 = useTransform(smooth, [0.81, 1], [0, 1]);

  // Dot opacity per panel (1 = active)
  const dot0 = useTransform(smooth, [0, 0.30, 0.36], [1, 1, 0.3]);
  const dot1 = useTransform(smooth, [0.30, 0.36, 0.78, 0.84], [0.3, 1, 1, 0.3]);
  const dot2 = useTransform(smooth, [0.78, 0.84, 1], [0.3, 1, 1]);

  const dotOpacities = [dot0, dot1, dot2];
  const dotScales = [
    useTransform(smooth, [0, 0.30, 0.36], [1, 1, 0.7]),
    useTransform(smooth, [0.30, 0.36, 0.78, 0.84], [0.7, 1, 1, 0.7]),
    useTransform(smooth, [0.78, 0.84, 1], [0.7, 1, 1]),
  ];

  const hintOpacity = useTransform(smooth, [0, 0.08], [1, 0]);

  return (
    <section
      id="the-vibe"
      ref={sectionRef}
      className="relative w-full h-auto md:h-[400vh]"
    >
      {/* ── Sticky container (desktop) / natural flow (mobile) ─── */}
      <div className="w-full md:sticky md:top-0 md:h-[100dvh] md:overflow-hidden">
        {/* Horizontal strip (desktop) / swipe carousel (mobile) */}
        <motion.div
          style={isDesktop ? { x } : {}}
          className="flex flex-row md:h-full w-full overflow-x-auto md:overflow-visible snap-x snap-mandatory [-webkit-overflow-scrolling:touch] scrollbar-hide max-md:!transform-none"
        >
          <ManifestoPanel progress={p0} isDesktop={isDesktop} />
          <ImageryPanel progress={p1} isDesktop={isDesktop} />
          <EssencePanel progress={p2} isDesktop={isDesktop} />
        </motion.div>

        {/* ── Mobile swipe hint ───────────────────────────────── */}
        <div className="md:hidden flex items-center justify-center gap-3 py-4" style={{ backgroundColor: "var(--rr-bg)" }}>
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--rr-text-secondary)" }}>Swipe to explore</span>
          <motion.svg
            width="28" height="12" viewBox="0 0 34 14" fill="none"
            animate={{ x: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          >
            <path d="M0 7H32M26 1L32 7L26 13" stroke="#C5A880" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </div>

        {/* ── Bottom progress rail (desktop only) ──────────────── */}
        <div
          className="hidden md:block absolute bottom-0 left-0 right-0 h-[1px] z-50"
          style={{ backgroundColor: "var(--rr-border)" }}
        >
          <motion.div
            className="h-full bg-[#C5A880] origin-left"
            style={{ scaleX: smooth }}
          />
        </div>

        {/* ── Panel dots (desktop only) ────────────────────────── */}
        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 gap-[10px] z-50 items-center">
          {dotOpacities.map((op, i) => (
            <motion.div
              key={i}
              className="rounded-full bg-[#C5A880]"
              style={{
                width: 6,
                height: 6,
                opacity: op,
                scale: dotScales[i],
              }}
            />
          ))}
        </div>

        {/* ── Scroll hint (desktop only) ───────────────────────── */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="hidden md:flex absolute bottom-12 right-10 md:right-14 items-center gap-3 pointer-events-none z-50"
        >
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "var(--rr-text-secondary)" }}
          >
            Scroll to explore
          </span>
          <ScrollArrowHint />
        </motion.div>

      </div>
    </section>
  );
}
