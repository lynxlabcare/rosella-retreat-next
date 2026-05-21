"use client";
/**
 * Amenities.tsx — Sticky scroll-reveal section.
 *
 * Five amenity panels stack behind each other inside a sticky viewport.
 * As the user scrolls through the tall outer section, each new panel
 * clip-path-reveals from the bottom (inset technique borrowed from InsideLook),
 * while the corresponding text content fades + translates into view.
 *
 * Section height: amenities.length * 120vh
 * Each panel occupies: 1 / amenities.length of the 0→1 scrollYProgress range.
 *
 * Mobile: Panels stack vertically in natural document flow — no sticky,
 * no clip-path animation, no forced viewport heights.
 */

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import { useIsDesktop } from "@/hooks/useIsDesktop";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Amenity = {
  id: string;
  index: string;  // "01", "02" …
  category: string;
  title: string;
  description: string;
  image: string;
  accent: string; // short 1-word highlight
  objectPosition?: string; // optional image anchor point
};

const AMENITIES: Amenity[] = [
  {
    id: "patio",
    index: "01",
    category: "Outdoor Leisure",
    title: "The Grand Patio",
    description:
      "Step out and let the vastness of the Himalayas wash over you. Our expansive sunlit patio provides a serene vantage point crafted for slow mornings, golden hour reflections, and absolute tranquility above the clouds.",
    image: "/Patio Amenity.webp",
    accent: "Panoramic vistas",
    objectPosition: "bottom",
  },
  {
    id: "kitchen",
    index: "02",
    category: "Culinary",
    title: "Gourmet Kitchen",
    description:
      "Elevate your stay with a dedicated personal chef, ready to curate bespoke menus for every occasion. Whether it's a quiet morning espresso, a lavish banquet, or an unforgettable barbecque night under the stars, every meal is a masterpiece.",
    image: "/Chef_1.webp",
    accent: "Chef on request",
  },
  {
    id: "bonfire",
    index: "03",
    category: "Outdoor Living",
    title: "Bonfire Nights",
    description:
      "When the mountain air turns crisp, gather around the glowing embers of our hand-cut stone fire pit. Wrap yourself in warmth, share stories under a canopy of stars, and let the flickering flames create memories that linger.",
    image: "/Bonfire.webp",
    accent: "Stargazing setup",
  },
  {
    id: "cricket",
    index: "04",
    category: "Active Pursuits",
    title: "The Sporting Greens",
    description:
      "Embrace the spirit of camaraderie on our expansive outdoor pitch. Whether it's a spirited game of cricket under the afternoon sun or a leisurely match at dusk, the rolling greens provide a picturesque arena for unforgettable moments.",
    image: "/Cricket.webp",
    accent: "Private pitch",
  },
  {
    id: "lift",
    index: "05",
    category: "Seamless Mobility",
    title: "The Glass Ascender",
    description:
      "Glide effortlessly between levels in our state-of-the-art private elevator. Encased in crystal-clear glass and accented with brushed brass, it offers a seamless and silent journey, turning every ascent into a momentary retreat.",
    image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=1080",
    accent: "Private lift",
  },
  {
    id: "pool",
    index: "06",
    category: "Entertainment",
    title: "The Billiards Room",
    description:
      "Unwind after a day of exploration in our sophisticated billiards room. Featuring a masterfully crafted pool table and ambient lighting, it is the perfect setting for friendly competition and evening cocktails.",
    image: "/Pool Table.webp",
    accent: "Friendly competition",
  },
];

const TOTAL = AMENITIES.length;
// How many vh per amenity step
const SCROLL_PER_STEP = 120;

// Transition duration (fraction of 0→1 range). Must be < 1/TOTAL to avoid overlap.
const T_LEN = Math.min(0.18, 0.8 / TOTAL);
const D_OFFSET = 0.04;

// ─── Single amenity panel ─────────────────────────────────────────────────────

/*
function AmenityPanelOld({
  amenity,
  index,
  progress,
  isDesktop,
}: {
  amenity: Amenity;
  index: number;
  progress: MotionValue<number>;
  isDesktop: boolean;
}) {
  const tLen = T_LEN;
  const dOffset = D_OFFSET;

  let bgMap: number[];
  let clipMap: number[];
  let txtMap: number[];
  let yMap: number[];
  let opMap: number[];

  if (index === 0) {
    const end = 1 / TOTAL;
    const e0 = Math.max(0.001, end - tLen);
    bgMap = [0, e0, end, 1];
    clipMap = [0, 0, 0, 0];
    const te0 = Math.max(0.001, end - tLen + dOffset);
    txtMap = [0, te0, Math.min(1, end + dOffset), 1];
    yMap = [0, 0, -48, -48];
    opMap = [1, 1, 0, 0];
  } else if (index === TOTAL - 1) {
    const start = (TOTAL - 1) / TOTAL;
    const s0 = Math.max(0.001, start - tLen);
    bgMap = [0, s0, start, 1];
    clipMap = [100, 100, 0, 0];
    const ts0 = Math.max(0.001, start - tLen + dOffset);
    txtMap = [0, ts0, Math.min(1, start + dOffset), 1];
    yMap = [48, 48, 0, 0];
    opMap = [0, 0, 1, 1];
  } else {
    const start = index / TOTAL;
    const end = (index + 1) / TOTAL;
    const s0 = Math.max(0.001, start - tLen);
    const e0 = Math.max(s0 + 0.001, end - tLen);
    bgMap = [0, s0, start, e0, end, 1];
    clipMap = [100, 100, 0, 0, 0, 0];
    const ts0 = Math.max(0.001, start - tLen + dOffset);
    const te0 = Math.max(ts0 + 0.001, end - tLen + dOffset);
    txtMap = [0, ts0, Math.min(1, start + dOffset), te0, Math.min(1, end + dOffset), 1];
    yMap = [48, 48, 0, 0, -48, -48];
    opMap = [0, 0, 1, 1, 0, 0];
  }

  const clipTop = useTransform(progress, bgMap, clipMap);
  const clipPath = useMotionTemplate`inset(${clipTop}% 0 0 0)`;
  const textY = useTransform(progress, txtMap, yMap);
  const textOp = useTransform(progress, txtMap, opMap);
  const imgScale = useTransform(progress, txtMap, opMap.map((o) => (o === 1 ? 1 : 1.06)));
  const pEvents = useTransform(clipTop, (v: number) => (v < 99 ? "auto" : "none"));

  return (
    <motion.div
      style={isDesktop ? { clipPath, pointerEvents: pEvents, zIndex: index } : {}}
      className="relative grid grid-cols-1 min-h-[100svh] md:absolute md:inset-0 md:grid-cols-2 md:min-h-0 max-md:![clip-path:none] max-md:!opacity-100 max-md:!pointer-events-auto max-md:!visible"
    >
      // Left: Image
      <div
        className={`relative w-full overflow-hidden ${
          isDesktop ? "h-full" : "h-[50svh]"
        }`}
      >
        <motion.div
          style={isDesktop ? { scale: imgScale } : {}}
          className="absolute inset-0 w-full h-full origin-center max-md:!transform-none"
        >
          <ImageWithFallback
            src={amenity.image}
            alt={amenity.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: amenity.objectPosition ?? "center" }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none" />

        {index === 0 && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, var(--rr-bg) 0%, transparent 45%)",
              opacity: 0.95
            }}
          />
        )}

        <div
          className="hidden md:block absolute top-8 left-8 font-['Cormorant_Garamond'] select-none pointer-events-none"
          style={{
            fontSize: "clamp(80px, 12vw, 160px)",
            color: index === 0 ? "var(--rr-text)" : "#ffffff",
            opacity: 0.12,
            lineHeight: 1,
          }}
        >
          {amenity.index}
        </div>
      </div>

      // Right: Text
      <div
        className="relative flex flex-col justify-center px-10 md:px-16 lg:px-20 py-16 lg:py-0"
        style={{ backgroundColor: "var(--rr-bg)" }}
      >
        <motion.div
          style={isDesktop ? { y: textY, opacity: textOp } : {}}
          className="max-w-lg max-md:!transform-none max-md:!opacity-100"
        >
          <p className="text-[#C5A880] text-[11px] uppercase tracking-[0.35em] mb-3">
            {amenity.category}
          </p>

          <h2
            className="font-['Cormorant_Garamond'] leading-[1.1] mb-6"
            style={{
              fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
              color: "var(--rr-text)",
            }}
          >
            {amenity.title}
          </h2>

          <p
            className="text-base leading-relaxed mb-8 font-light"
            style={{ color: "var(--rr-text-secondary)" }}
          >
            {amenity.description}
          </p>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              borderColor: "var(--rr-accent)",
              backgroundColor: "var(--rr-accent-bg-soft)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "var(--rr-accent)" }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.25em]"
              style={{ color: "var(--rr-accent)" }}
            >
              {amenity.accent}
            </span>
          </div>
        </motion.div>

        <div
          className="hidden md:block absolute bottom-6 right-8 font-['Cormorant_Garamond'] select-none pointer-events-none leading-none"
          style={{
            fontSize: "clamp(120px, 18vw, 220px)",
            color: "var(--rr-border)",
            opacity: 0.6,
          }}
        >
          {amenity.index}
        </div>
      </div>
    </motion.div>
  );
}
*/

function AmenityPanel({
  amenity,
  index,
  progress,
  isDesktop,
}: {
  amenity: Amenity;
  index: number;
  progress: MotionValue<number>;
  isDesktop: boolean;
}) {
  const tLen = T_LEN;
  const dOffset = D_OFFSET;

  let bgMap: number[];
  let clipMap: number[];
  let txtMap: number[];
  let yMap: number[];
  let opMap: number[];

  if (index === 0) {
    const end = 1 / TOTAL;
    const e0 = Math.max(0.001, end - tLen);
    bgMap = [0, e0, end, 1];
    clipMap = [0, 0, 0, 0];
    const te0 = Math.max(0.001, end - tLen + dOffset);
    txtMap = [0, te0, Math.min(1, end + dOffset), 1];
    yMap = [0, 0, -48, -48];
    opMap = [1, 1, 0, 0];
  } else if (index === TOTAL - 1) {
    const start = (TOTAL - 1) / TOTAL;
    const s0 = Math.max(0.001, start - tLen);
    bgMap = [0, s0, start, 1];
    clipMap = [100, 100, 0, 0];
    const ts0 = Math.max(0.001, start - tLen + dOffset);
    txtMap = [0, ts0, Math.min(1, start + dOffset), 1];
    yMap = [48, 48, 0, 0];
    opMap = [0, 0, 1, 1];
  } else {
    const start = index / TOTAL;
    const end = (index + 1) / TOTAL;
    const s0 = Math.max(0.001, start - tLen);
    const e0 = Math.max(s0 + 0.001, end - tLen);
    bgMap = [0, s0, start, e0, end, 1];
    clipMap = [100, 100, 0, 0, 0, 0];
    const ts0 = Math.max(0.001, start - tLen + dOffset);
    const te0 = Math.max(ts0 + 0.001, end - tLen + dOffset);
    txtMap = [0, ts0, Math.min(1, start + dOffset), te0, Math.min(1, end + dOffset), 1];
    yMap = [48, 48, 0, 0, -48, -48];
    opMap = [0, 0, 1, 1, 0, 0];
  }

  // Desktop transforms
  const clipTop = useTransform(progress, bgMap, clipMap);
  const clipPath = useMotionTemplate`inset(${clipTop}% 0 0 0)`;
  const textY = useTransform(progress, txtMap, yMap);
  const textOp = useTransform(progress, txtMap, opMap);
  const imgScale = useTransform(progress, txtMap, opMap.map((o) => (o === 1 ? 1 : 1.06)));
  const pEvents = useTransform(clipTop, (v: number) => (v < 99 ? "auto" : "none"));

  // Mobile Parallax Stack transforms
  const mobileStart = index / TOTAL;
  const mobileEnd = (index + 1) / TOTAL;
  const mobileScale = useTransform(progress, [mobileStart, mobileEnd], [1, 0.9]);
  const mobileOpacity = useTransform(progress, [mobileStart, mobileEnd], [1, 0.4]);
  const mobileRotateX = useTransform(progress, [mobileStart, mobileEnd], [0, -12]);
  // Depth overlay — as card gets pushed under, a shadow veil descends over it
  const shadowOpacity = useTransform(progress, [mobileStart, mobileEnd], [0, 0.7]);

  return (
    <motion.div
      style={isDesktop
        ? { clipPath, pointerEvents: pEvents, zIndex: index }
        : { scale: mobileScale, opacity: mobileOpacity, rotateX: mobileRotateX, zIndex: index }
      }
      className="relative md:absolute md:inset-0 max-md:!sticky max-md:!top-0 max-md:!h-[100svh] max-md:!w-full max-md:!overflow-hidden max-md:!opacity-100 max-md:![clip-path:none] max-md:bg-[var(--rr-bg)] max-md:origin-top max-md:rounded-t-3xl max-md:border-t max-md:border-black/5 dark:max-md:border-white/10 max-md:shadow-[0_-15px_40px_rgba(0,0,0,0.1)] dark:max-md:shadow-[0_-15px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Inner layout: flex-col on mobile, grid on desktop */}
      <div className="flex flex-col h-full lg:grid lg:grid-cols-2">

      {/* ── Left: Image ─────────────────────────────────── */}
      <div
        className="relative w-full max-md:!h-[60svh] lg:h-full shrink-0 overflow-hidden"
      >
        <motion.div
          style={isDesktop ? { scale: imgScale } : {}}
          className="absolute inset-0 w-full h-full origin-center"
        >
          <Image
            src={amenity.image}
            alt={amenity.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectPosition: amenity.objectPosition ?? "center" }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none" />

        {/* Surgical gradient for the first panel to make header text readable */}
        {index === 0 && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, var(--rr-bg) 0%, transparent 45%)",
              opacity: 0.95
            }}
          />
        )}

        {/* Index overlay */}
        <div
          className="hidden md:block absolute top-8 left-8 font-['Cormorant_Garamond'] select-none pointer-events-none"
          style={{
            fontSize: "clamp(80px, 12vw, 160px)",
            color: index === 0 ? "var(--rr-text)" : "#ffffff",
            opacity: 0.12,
            lineHeight: 1,
          }}
        >
          {amenity.index}
        </div>
      </div>

      {/* ── Right: Text ─────────────────────────────────── */}
      <div
        className="relative w-full max-md:!h-[40svh] flex flex-col justify-center px-6 py-6 md:px-10 lg:px-16 xl:px-20 lg:py-0 shrink-0"
        style={{ backgroundColor: "var(--rr-bg)" }}
      >
        {/* ── Gate Framer Motion text styles — mobile must NEVER receive opacity/y transforms ── */}
        <motion.div
          style={isDesktop ? { y: textY, opacity: textOp } : {}}
          className="max-w-lg max-md:!opacity-100 max-md:!transform-none max-md:![translate:none] flex flex-col"
        >
          <p className="text-[#C5A880] max-md:!text-[10px] text-[11px] uppercase tracking-[0.35em] mb-3 max-md:!mb-2">
            {amenity.category}
          </p>

          <h2
            className="font-['Cormorant_Garamond'] leading-[1.1] max-md:!text-3xl max-md:!leading-tight mb-6 max-md:!mb-3"
            style={{
              fontSize: isDesktop ? "clamp(2.2rem, 4vw, 3.6rem)" : undefined,
              color: "var(--rr-text)",
            }}
          >
            {amenity.title}
          </h2>

          <p
            className="text-base max-md:!text-sm leading-relaxed mb-8 max-md:!mb-6 font-light max-md:line-clamp-4"
            style={{ color: "var(--rr-text-secondary)" }}
          >
            {amenity.description}
          </p>

          {/* Accent pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border w-fit max-md:mt-auto"
            style={{
              borderColor: "var(--rr-accent)",
              backgroundColor: "var(--rr-accent-bg-soft)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "var(--rr-accent)" }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.25em]"
              style={{ color: "var(--rr-accent)" }}
            >
              {amenity.accent}
            </span>
          </div>
        </motion.div>

        {/* Large decorative index (right column bg) */}
        <div
          className="hidden md:block absolute bottom-6 right-8 font-['Cormorant_Garamond'] select-none pointer-events-none leading-none"
          style={{
            fontSize: "clamp(120px, 18vw, 220px)",
            color: "var(--rr-border)",
            opacity: 0.6,
          }}
        >
          {amenity.index}
        </div>
      </div>

      {/* Depth Overlay — veil that descends as card is pushed under the next */}
      <motion.div
        className="absolute inset-0 bg-black z-50 pointer-events-none hidden max-md:block"
        style={isDesktop ? {} : { opacity: shadowOpacity }}
      />

      {/* Close inner layout wrapper */}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/** Single dot in the side indicator — isolated so hooks aren't called inside .map() */
function AmenityDot({
  smooth,
  dotIndex,
}: {
  smooth: MotionValue<number>;
  dotIndex: number;
}) {
  const opacity = useTransform(smooth, (v) => {
    const active = Math.min(Math.floor(v * TOTAL), TOTAL - 1);
    return active === dotIndex ? 1 : 0.28;
  });
  const scale = useTransform(smooth, (v) => {
    const active = Math.min(Math.floor(v * TOTAL), TOTAL - 1);
    return active === dotIndex ? 1.5 : 1;
  });

  return (
    <motion.div
      className="rounded-full"
      style={{
        width: 5,
        height: 5,
        backgroundColor: "#C5A880",
        opacity,
        scale,
      }}
    />
  );
}

export function Amenities() {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 15,
    restDelta: 0.001,
  });

  // Header fades out once we enter the panel stack
  const headerOpacity = useTransform(smooth, [0, 0.08], [1, 0]);

  return (
    <section
      id="amenities"
      ref={sectionRef}
      className="relative w-full max-md:!h-auto md:h-[var(--section-height)] [perspective:1000px]"
      style={{ "--section-height": `${TOTAL * SCROLL_PER_STEP}vh`, "--panel-count": TOTAL } as React.CSSProperties}
    >
      {/* Section header — fades out as you scroll into the panel stack */}
      <motion.div
        style={isDesktop ? { opacity: headerOpacity } : {}}
        className="relative md:absolute top-0 left-0 right-0 z-10 flex items-end justify-between
                   px-10 md:px-16 lg:px-20 pt-20 pb-8 pointer-events-none max-md:!opacity-100"
      >
        <div>
          <p className="text-[#C5A880] text-[11px] uppercase tracking-[0.35em] mb-3">
            The Art of Refined Living
          </p>
          <h2
            className="font-['Cormorant_Garamond'] leading-tight"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              color: "var(--rr-text)",
            }}
          >
            Estate Amenities
          </h2>
        </div>
        <p
          className="text-sm hidden md:block"
          style={{ color: "var(--rr-text-secondary)" }}
        >
          Scroll to discover
        </p>
      </motion.div>

      {/* ── Sticky viewport (desktop) / flowing stack (mobile) ── */}
      <div className="w-full md:sticky md:top-0 md:h-[100dvh] md:overflow-hidden">

        {/* Panel stack */}
        {AMENITIES.map((amenity, i) => (
          <AmenityPanel
            key={amenity.id}
            amenity={amenity}
            index={i}
            progress={smooth}
            isDesktop={isDesktop}
          />
        ))}

        {/* ── Side step counter (desktop only) ─────────── */}
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-2">
          {AMENITIES.map((a, i) => (
            <AmenityDot key={a.id} smooth={smooth} dotIndex={i} />
          ))}
        </div>

        {/* ── Bottom progress rail (desktop only) ──────── */}
        <div
          className="hidden md:block absolute bottom-0 left-0 right-0 h-[1px] z-50"
          style={{ backgroundColor: "var(--rr-border)" }}
        >
          <motion.div
            className="h-full bg-[#C5A880] origin-left"
            style={{ scaleX: smooth }}
          />
        </div>

      </div>
    </section>
  );
}
