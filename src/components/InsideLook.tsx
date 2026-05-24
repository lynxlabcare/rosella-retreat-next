"use client";
/**
 * InsideLook.tsx — Sticky clip-path room reveal.
 *
 * Polish additions (Phase 4):
 *  - Giant 01 / 02 / 03 counter behind the content (fades + scales per room)
 *  - Circular SVG progress indicator (stroke-dashoffset) replaces the vertical bar
 *  - Room title in the circle centre shows the current room number
 *
 * Mobile: Panels stack vertically in natural document flow — no sticky,
 * no clip-path animation, no forced viewport heights.
 */

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useSpring,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import { useIsDesktop } from "@/hooks/useIsDesktop";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Room = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageA: string;
  imageB: string;
};

const rooms: Room[] = [
  {
    id: "master",
    eyebrow: "01 — The Master Suite",
    title: "Grandeur & Perspective",
    description:
      "An expansive sanctuary framed by floor-to-ceiling glass, where the horizon becomes part of the architecture.",
    imageA: "/BR1_1.webp",
    imageB: "/BR1_2.webp",
  },
  {
    id: "valley",
    eyebrow: "02 — The Valley Vista Room",
    title: "Nature & Light",
    description:
      "Soft linens, organic textures, and morning light pouring across the valley below — a quiet study in serenity.",
    imageA: "/BR2_1.webp",
    imageB: "/BR2_2.webp",
  },
  {
    id: "garden",
    eyebrow: "03 — The Garden Studio",
    title: "Intimacy & Texture",
    description:
      "A grounded retreat woven with tactile stone, raw oak, and wild garden greenery just beyond the threshold.",
    imageA: "/BR3_1.webp",
    imageB: "/BR3_2.webp",
  },
];

// ─── Circular progress indicator ─────────────────────────────────────────────

const CIRCLE_R = 44;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R; // ≈ 276.46

function CircularProgress({
  progress,
  roomIndex,
}: {
  progress: MotionValue<number>;
  roomIndex: MotionValue<number>;
}) {
  const dashOffset = useTransform(progress, [0, 1], [CIRCLE_C, 0]);

  return (
    <div className="hidden md:block absolute left-6 md:left-10 bottom-8 md:bottom-10 z-50 w-16 h-16">
      {/* SVG ring */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={CIRCLE_R}
          fill="none"
          stroke="var(--rr-border)"
          strokeWidth="2"
        />
        {/* Fill */}
        <motion.circle
          cx="50"
          cy="50"
          r={CIRCLE_R}
          fill="none"
          stroke="#C5A880"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCLE_C}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>

      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-['Cormorant_Garamond'] text-[#C5A880] leading-none"
          style={{ fontSize: 15 }}
        >
          {/* We render as a static span and update via JS for simplicity */}
          {/* Real reactive text via a child component */}
          <RoomLabel roomIndex={roomIndex} />
        </motion.span>
        <span
          className="text-[8px] uppercase tracking-[0.15em] mt-[2px]"
          style={{ color: "var(--rr-text-secondary)" }}
        >
          of {String(rooms.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

function RoomLabel({ roomIndex }: { roomIndex: MotionValue<number> }) {
  const num = useTransform(roomIndex, (v) =>
    String(Math.min(Math.floor(v * rooms.length) + 1, rooms.length)).padStart(2, "0")
  );
  return <motion.span>{num}</motion.span>;
}

// ─── Giant background counter ─────────────────────────────────────────────────

function GiantCounter({ progress }: { progress: MotionValue<number> }) {
  const idx = useTransform(progress, (v) =>
    Math.min(Math.floor(v * rooms.length), rooms.length - 1)
  );
  const counter = useTransform(idx, (v) => String(v + 1).padStart(2, "0"));

  // Subtle horizontal drift as rooms change — must be at top level (hooks rules)
  const xDrift = useTransform(progress, (v) => {
    const frac = (v * rooms.length) % 1;
    const phase = frac < 0.12 ? frac / 0.12 : frac > 0.88 ? (1 - frac) / 0.12 : 1;
    return (1 - phase) * 20;
  });

  return (
    <motion.div
      className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 font-['Cormorant_Garamond']
                 select-none pointer-events-none leading-none pr-2 md:pr-6"
      style={{
        fontSize: "clamp(140px, 22vw, 320px)",
        color: "var(--rr-border)",
        opacity: 0.55,
        zIndex: 5,
        x: xDrift,
      }}
    >
      <motion.span>{counter}</motion.span>
    </motion.div>
  );
}

// ─── Room panel ───────────────────────────────────────────────────────────────

function RoomPanel({
  room,
  index,
  total,
  progress,
  isDesktop,
}: {
  room: Room;
  index: number;
  total: number;
  progress: MotionValue<number>;
  isDesktop: boolean;
}) {
  const tLen = 0.24;
  const dOffset = 0.04;

  let bgProgressMap: number[];
  let contentProgressMap: number[];
  let clipMap: number[];
  let yMap: number[];
  let opacityMap: number[];
  let scaleMap: number[];

  if (index === 0) {
    const end = 1 / total;
    bgProgressMap = [0, end - tLen, end, 1];
    contentProgressMap = [0, end - tLen + dOffset, end + dOffset, 1];
    clipMap = [0, 0, 0, 0];
    yMap = [0, 0, -60, -60];
    opacityMap = [1, 1, 0, 0];
    scaleMap = [1, 1, 1.05, 1.05];
  } else if (index === total - 1) {
    const start = (total - 1) / total;
    bgProgressMap = [0, start - tLen, start, 1];
    contentProgressMap = [0, start - tLen + dOffset, start + dOffset, 1];
    clipMap = [100, 100, 0, 0];
    yMap = [60, 60, 0, 0];
    opacityMap = [0, 0, 1, 1];
    scaleMap = [1.05, 1.05, 1, 1];
  } else {
    const start = index * (1 / total);
    const end = (index + 1) * (1 / total);
    bgProgressMap = [0, start - tLen, start, end - tLen, end, 1];
    contentProgressMap = [0, start - tLen + dOffset, start + dOffset, end - tLen + dOffset, end + dOffset, 1];
    clipMap = [100, 100, 0, 0, 0, 0];
    yMap = [60, 60, 0, 0, -60, -60];
    opacityMap = [0, 0, 1, 1, 0, 0];
    scaleMap = [1.05, 1.05, 1, 1, 1.05, 1.05];
  }

  const clipTop = useTransform(progress, bgProgressMap, clipMap);
  const clipPath = useMotionTemplate`inset(${clipTop}% 0 0 0)`;
  const yText = useTransform(progress, contentProgressMap, yMap);
  const textOp = useTransform(progress, contentProgressMap, opacityMap);
  const imgScale = useTransform(progress, contentProgressMap, scaleMap);
  const pEvents = useTransform(clipTop, (v: number) => (v < 99 ? "auto" : "none"));

  return (
    <motion.div
      style={
        isDesktop
          ? { clipPath, pointerEvents: pEvents, zIndex: index, backgroundColor: "var(--rr-bg)" }
          : { backgroundColor: "var(--rr-bg)" }
      }
      className="relative flex flex-col justify-center px-6 py-12 md:absolute md:inset-0 md:px-12 md:py-16 max-md:![clip-path:none] max-md:!opacity-100 max-md:!pointer-events-auto max-md:!visible"
    >
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col justify-center gap-6 md:gap-14 relative">

        {/* Text block */}
        <motion.div
          style={isDesktop ? { y: yText, opacity: textOp } : {}}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-end relative z-10 max-md:!transform-none max-md:!opacity-100"
        >
          <div className="md:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.3em] mb-4" style={{ color: "#C5A880" }}>
              {room.eyebrow}
            </p>
            <h2
              className="font-normal"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)",
                lineHeight: 1.1,
                color: "var(--rr-text)",
              }}
            >
              {room.title}
            </h2>
          </div>

          <div className="md:col-span-5 pb-2">
            <p className="text-lg leading-relaxed max-w-md" style={{ color: "var(--rr-text)", opacity: 0.72 }}>
              {room.description}
            </p>
          </div>
        </motion.div>

        {/* Images */}
        <motion.div
          style={isDesktop ? { y: yText, opacity: textOp } : {}}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full relative z-10 max-md:!transform-none max-md:!opacity-100"
        >
          {[room.imageA, room.imageB].map((src, j) => (
            <div
              key={j}
              className="relative w-full overflow-hidden rounded-sm h-[45svh] md:h-auto md:aspect-[16/10]"
            >
              <motion.div
                style={isDesktop ? { scale: imgScale } : {}}
                className="absolute inset-0 w-full h-full max-md:!transform-none"
              >
                <motion.div
                  animate={{ scale: [1, 1.05] }}
                  transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                  className="w-full h-full relative"
                >
                  <Image
                    src={src}
                    alt={j === 0 ? room.title : `${room.title} detail`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </motion.div>
              </motion.div>
            </div>
          ))}
        </motion.div>

      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function InsideLook() {
  const containerRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 15,
    restDelta: 0.001,
  });

  // Derived room index (0-based) as a MotionValue for the counter
  const roomIndex = useTransform(smoothProgress, (v) =>
    Math.min(Math.floor(v * rooms.length), rooms.length - 1)
  );

  return (
    <section
      ref={containerRef}
      id="suites"
      className="relative w-full h-auto md:h-[400vh]"
      style={{ backgroundColor: "var(--rr-bg)" }}
    >
      <div className="w-full md:sticky md:top-0 md:h-[100dvh] md:overflow-hidden">

        {/* Room panels (stack) */}
        {rooms.map((room, i) => (
          <RoomPanel
            key={room.id}
            room={room}
            index={i}
            total={rooms.length}
            progress={smoothProgress}
            isDesktop={isDesktop}
          />
        ))}

        {/* Giant background counter (desktop only — hidden via CSS) */}
        <GiantCounter progress={smoothProgress} />

        {/* Circular scroll indicator (desktop only — hidden via CSS) */}
        <CircularProgress progress={smoothProgress} roomIndex={smoothProgress} />

      </div>
    </section>
  );
}
