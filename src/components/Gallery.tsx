"use client";
/**
 * Gallery.tsx — Horizontal Cinema Reel
 *
 * Architecture:
 *   • Outer `h-[420vh]` scroll container gives ~320vh of pinned scroll room.
 *   • Inner `sticky top-0 h-screen` panel pins the reel in the viewport.
 *   • `useScroll({ target: containerRef })` drives scrollYProgress 0 → 1.
 *   • Rail translateX driven by scrollYProgress × -(railScrollWidth - vw).
 *   • Per-card scale / opacity / blur / y driven by distance from scrolled center.
 *   • Active centerpiece card: animated dashed SVG "marching-ants" outline.
 *   • Two parallax gradient blobs float behind the reel.
 *   • Floating ghost Cormorant index counter (top-right).
 *   • Bottom edge: thin brass fill-bar progress indicator.
 *   • Mobile (<768 px): graceful vertical grid fallback.
 *   • Preserved lightbox: drag + keyboard nav.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_W = 480; // px — desktop card width
const CARD_H = 610; // px — desktop card height
const OVERLAP = 88;  // px — how much each card slides under the next (shingle)

// Dasharray sum for seamless dash-offset loop (14 dash + 7 gap = 21)
const DASH_CYCLE = 21;

// ─── Image data ───────────────────────────────────────────────────────────────

type GalleryImage = {
  src: string;
  alt: string;
};

const IMAGES: GalleryImage[] = [
  {
    src: "/Gallery_Carousel/LR1.webp",
    alt: "Rosella Retreat — Elegant living room",
  },
  {
    src: "/Gallery_Carousel/Fireplace.webp",
    alt: "Rosella Retreat — Cozy fireplace",
  },
  {
    src: "/Gallery_Carousel/Balcony.webp",
    alt: "Rosella Retreat — Scenic balcony",
  },
  {
    src: "/Gallery_Carousel/Copy of balcony view.webp",
    alt: "Rosella Retreat — Balcony view",
  },
  {
    src: "/Gallery_Carousel/Garden.webp",
    alt: "Rosella Retreat — Lush garden",
  },
  {
    src: "/Gallery_Carousel/Copy of Garden 2.webp",
    alt: "Rosella Retreat — Garden serenity",
  },
  {
    src: "/Gallery_Carousel/BR2(2).webp",
    alt: "Rosella Retreat — Refined bedroom suite",
  },
  {
    src: "/Gallery_Carousel/Copy of BAR.webp",
    alt: "Rosella Retreat — Private bar lounge",
  },
  {
    src: "/Gallery_Carousel/Copy of Badminton.webp",
    alt: "Rosella Retreat — Lawn Games",
  },
  {
    src: "/Gallery_Carousel/DSC_4760.webp",
    alt: "Rosella Retreat — Dining area",
  },
  {
    src: "https://images.unsplash.com/photo-1610952861479-94ed16e2757e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXNoJTIwZ3JlZW4lMjBtb3VudGFpbiUyMGZvZ3xlbnwxfHx8fDE3Nzg0MjQ0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    alt: "Rosella Retreat — Lush mountain fog",
  },
];

// ─── ReelCard ─────────────────────────────────────────────────────────────────
// Per-card transforms are derived from a single scrollYProgress MotionValue,
// so they update with zero React renders — pure MotionValue graph.

function ReelCard({
  image,
  index,
  total,
  activeIndex,
  scrollYProgress,
  onOpen,
}: {
  image: GalleryImage;
  index: number;
  total: number;
  activeIndex: number;
  scrollYProgress: MotionValue<number>;
  onOpen: (i: number) => void;
}) {
  const isActive = index === activeIndex;

  // Signed distance from this card's centre position in the reel.
  // 0 = card is centred, ±1 = adjacent card is centred, ±2 = two away, etc.
  const distance = useTransform(scrollYProgress, (v) => {
    const fraction = total > 1 ? index / (total - 1) : 0;
    return (v - fraction) * (total - 1);
  });

  // ── Scale ─────────────────────────────────────────────────────────────────
  const scale = useTransform(
    distance,
    [-3, -1.5, -0.4, 0, 0.4, 1.5, 3],
    [0.62, 0.74, 0.93, 1.0, 0.93, 0.76, 0.65]
  );

  // ── Opacity ───────────────────────────────────────────────────────────────
  const opacity = useTransform(
    distance,
    [-3, -1.5, -0.5, 0, 0.5, 1.5, 3],
    [0.08, 0.28, 0.68, 1.0, 0.68, 0.32, 0.10]
  );

  // ── Vertical float — cards bow slightly off-centre ────────────────────────
  const yOffset = useTransform(
    distance,
    [-2.5, -0.8, 0, 0.8, 2.5],
    [55, 20, 0, 20, 55]
  );

  // ── Image blur (applied to image wrapper only, not overlays) ──────────────
  const blurPx = useTransform(
    distance,
    [-2.5, -1, -0.3, 0, 0.3, 1, 2.5],
    [10, 4.5, 1, 0, 1, 4.5, 10]
  );
  const imageFilter = useTransform(blurPx, (v) => `blur(${v.toFixed(2)}px)`);

  // ── Z-index: active card always on top, falloff by distance ──────────────
  const zIndex = total - Math.abs(index - activeIndex) + (isActive ? 8 : 0);

  return (
    <motion.div
      className="relative flex-shrink-0 cursor-pointer overflow-hidden"
      style={{
        width: CARD_W,
        height: CARD_H,
        scale,
        opacity,
        y: yOffset,
        zIndex,
        marginRight: index < total - 1 ? -OVERLAP : 0,
        borderRadius: 4,
        willChange: "transform, opacity",
      }}
      onClick={() => onOpen(index)}
    >
      {/* ── Image (blur applied here, not to overlays) ─────────────────── */}
      <motion.div
        className="absolute inset-0"
        style={{ filter: imageFilter }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover block"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </motion.div>

      {/* ── Atmospheric gradient overlay ──────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(160deg, rgba(0,0,0,0.06) 0%, transparent 45%, rgba(0,0,0,0.62) 100%)",
        }}
      />

      {/* ── Brass corner accent ───────────────────────────────────────────── */}
      <div className="absolute top-5 right-5 w-6 h-6 pointer-events-none">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M24 0 V24 H18" stroke="#C5A880" strokeWidth="1.5" />
        </svg>
      </div>

      {/* ── Caption — fades in on active ──────────────────────────────────── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 px-8 pb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: "10px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              {image.alt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dashed "marching-ants" SVG outline on active card ─────────────── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="outline"
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${CARD_W} ${CARD_H}`}
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Outer glow rect */}
              <motion.rect
                x="3" y="3"
                width={CARD_W - 6}
                height={CARD_H - 6}
                rx="3"
                stroke="rgba(197,168,128,0.25)"
                strokeWidth="6"
                fill="none"
              />
              {/* Marching dashes */}
              <motion.rect
                x="3" y="3"
                width={CARD_W - 6}
                height={CARD_H - 6}
                rx="3"
                stroke="#C5A880"
                strokeWidth="1.5"
                strokeDasharray="14 7"
                animate={{ strokeDashoffset: [0, -DASH_CYCLE] }}
                transition={{
                  strokeDashoffset: {
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                  },
                }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Mobile card (simple reveal cell) ────────────────────────────────────────

function MobileCard({
  image,
  index,
  onOpen,
}: {
  image: GalleryImage;
  index: number;
  onOpen: (i: number) => void;
}) {
  return (
    <motion.div
      className="relative overflow-hidden cursor-pointer"
      style={{ borderRadius: 3 }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.95,
        ease: [0.16, 1, 0.3, 1],
        delay: (index % 2) * 0.08,
      }}
      onClick={() => onOpen(index)}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-cover block"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.48) 0%, transparent 55%)",
        }}
      />
      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none">
        <p
          style={{
            color: "rgba(255,255,255,0.82)",
            fontSize: "9px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
          }}
        >
          {image.alt}
        </p>
      </div>
      {/* Corner */}
      <div className="absolute top-3 right-3 w-4 h-4 pointer-events-none">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M16 0 V16 H12" stroke="#C5A880" strokeWidth="1.2" />
        </svg>
      </div>
    </motion.div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  activeIndex,
  onClose,
  onNext,
  onPrev,
  onJump,
}: {
  images: GalleryImage[];
  activeIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onJump: (i: number) => void;
}) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const imgOpacity = useTransform(dragY, [-120, 0, 120], [0.3, 1, 0.3]);
  const imgScale = useTransform(dragY, [-120, 0, 120], [0.88, 1, 0.88]);

  // Reset drag on navigate
  useEffect(() => {
    dragX.set(0);
    dragY.set(0);
  }, [activeIndex, dragX, dragY]);

  // Arrow hint opacities
  const arrowRightOpacity = useTransform(dragX, [0, -40, -100], [0, 0.7, 1]);
  const arrowLeftOpacity = useTransform(dragX, [0, 40, 100], [0, 0.7, 1]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNext, onPrev]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number; y: number } }) => {
      const { x, y } = info.offset;
      if (Math.abs(y) > 80) { onClose(); return; }
      if (x < -80) { onNext(); return; }
      if (x > 80) { onPrev(); return; }
    },
    [onClose, onNext, onPrev]
  );

  const image = images[activeIndex];

  return (
    <motion.div
      key="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9990] flex items-center justify-center"
      style={{ backgroundColor: "rgba(8,14,12,0.96)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* Image */}
      <motion.div
        style={{ x: dragX, y: dragY, opacity: imgOpacity, scale: imgScale, borderRadius: 4 }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.22}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-[90vw] max-h-[86dvh] overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={activeIndex}
            src={image.src}
            alt={image.alt}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[90vw] max-h-[86dvh] object-contain block select-none"
            draggable={false}
          />
        </AnimatePresence>

        {/* Caption overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 px-6 py-5 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            {image.alt}
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "4px", letterSpacing: "0.15em" }}>
            {activeIndex + 1} / {images.length} · Drag to dismiss
          </p>
        </div>

        {/* Drag hint arrows */}
        <motion.div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: arrowLeftOpacity }}>
          <ArrowLeft size={20} className="text-white/80" />
        </motion.div>
        <motion.div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: arrowRightOpacity }}>
          <ArrowRight size={20} className="text-white/80" />
        </motion.div>
      </motion.div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:border-[#C5A880] transition-colors duration-300 z-10"
      >
        <X size={16} />
      </button>

      {/* Prev */}
      {activeIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:border-[#C5A880] transition-colors duration-300 z-10"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      {/* Next */}
      {activeIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:border-[#C5A880] transition-colors duration-300 z-10"
        >
          <ArrowRight size={18} />
        </button>
      )}

      {/* Dot strip */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); onJump(i); }}
            className="rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: i === activeIndex ? 18 : 6,
              height: 6,
              backgroundColor: i === activeIndex ? "#C5A880" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Gallery (main export) ────────────────────────────────────────────────────

export function Gallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const maxTranslateRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // ── Measure rail width on mount + resize ──────────────────────────────────
  useEffect(() => {
    const measure = () => {
      if (!railRef.current) return;
      const railW = railRef.current.scrollWidth;
      const vw = window.innerWidth;
      maxTranslateRef.current = Math.max(0, railW - vw);
    };

    // Use rAF to guarantee the DOM has painted
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // ── Scroll progress for the tall container ────────────────────────────────
  const { scrollYProgress } = useScroll({ target: containerRef });

  // ── Drive rail X and active index from scroll ─────────────────────────────
  const xMv = useMotionValue(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Translate rail
    xMv.set(-v * maxTranslateRef.current);
    // Update active card index
    const idx = Math.round(v * (IMAGES.length - 1));
    setActiveIndex(Math.max(0, Math.min(IMAGES.length - 1, idx)));
  });

  // ── Parallax background blobs ─────────────────────────────────────────────
  const blob1X = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const blob2X = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // ── Hint opacity — fades after first scroll movement ─────────────────────
  const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  // ── Cormorant counter labels ──────────────────────────────────────────────
  const currentLabel = String(activeIndex + 1).padStart(2, "0");
  const totalLabel = String(IMAGES.length).padStart(2, "0");

  // ── Lightbox helpers ──────────────────────────────────────────────────────
  const openLightbox = useCallback((i: number) => setLightboxIndex(i), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const nextImage = useCallback(() =>
    setLightboxIndex((i) => (i !== null && i < IMAGES.length - 1 ? i + 1 : i)), []);
  const prevImage = useCallback(() =>
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const jumpImage = useCallback((i: number) => setLightboxIndex(i), []);

  return (
    <section
      id="gallery"
      style={{ backgroundColor: "var(--rr-bg)", position: "relative" }}
    >
      {/* ════════════════════════════════════════════════════════════════════
          MOBILE — Touch-Native Gesture Carousel (CSS Snap)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden pt-16 pb-4" style={{ backgroundColor: "var(--rr-bg)" }}>
        {/* Mobile header */}
        <div className="px-6 mb-8">
          <p
            style={{
              color: "#C5A880",
              fontSize: "10px",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: "10px",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            The Gallery
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "var(--rr-text)",
              fontSize: "clamp(1.8rem, 7vw, 2.4rem)",
              lineHeight: 1.12,
            }}
          >
            Every Space,<br />a Story
          </h2>
        </div>

        {/* Swipe track — 85vw peek cards */}
        <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 px-6 pb-8 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {IMAGES.map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="relative w-[85vw] shrink-0 snap-center rounded-sm overflow-hidden aspect-[4/5] block text-left"
              aria-label={img.alt}
            >
              {/* Image */}
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1512]/90 via-[#1A1512]/20 to-transparent opacity-80" />
              {/* Brass corner accent */}
              <div className="absolute top-3 right-3 w-5 h-5 pointer-events-none">
                <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
                  <path d="M20 0 V20 H15" stroke="#C5A880" strokeWidth="1.2" />
                </svg>
              </div>
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none">
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "9px",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                  }}
                >
                  {img.alt.replace("Rosella Retreat — ", "")}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Swipe hint */}
        <div
          className="flex items-center justify-center gap-3 pb-6"
          style={{ opacity: 0.45 }}
        >
          <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--rr-text)" }} />
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              color: "var(--rr-text)",
              fontSize: "9px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            Swipe to Explore
          </p>
          <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--rr-text)" }} />
        </div>
      </div>


      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP — Horizontal Cinema Reel (580 vh pin)
      ════════════════════════════════════════════════════════════════════ */}
      <div
        ref={containerRef}
        className="hidden md:block relative"
        style={{ height: "580vh" }}
      >
        {/* ── Sticky viewport ─────────────────────────────────────────────── */}
        <div
          className="sticky top-0 overflow-hidden"
          style={{ height: "100vh" }}
        >
          {/* ── Background blobs ──────────────────────────────────────────── */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              top: "-30%",
              left: "-18%",
              width: "72vw",
              height: "72vw",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(44,61,48,0.20) 0%, transparent 68%)",
              filter: "blur(90px)",
              x: blob1X,
              y: blob1Y,
            }}
          />
          <motion.div
            className="absolute pointer-events-none"
            style={{
              bottom: "-28%",
              right: "-16%",
              width: "58vw",
              height: "58vw",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(197,168,128,0.13) 0%, transparent 68%)",
              filter: "blur(90px)",
              x: blob2X,
              y: blob2Y,
            }}
          />

          {/* ── Header bar ────────────────────────────────────────────────── */}
          <div
            className="absolute top-0 left-0 right-0 flex items-start justify-between pointer-events-none"
            style={{ padding: "44px 52px 0" }}
          >
            {/* Left: section label + title */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p
                style={{
                  color: "#C5A880",
                  fontSize: "10px",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                The Gallery
              </p>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "var(--rr-text)",
                  fontSize: "clamp(1.5rem, 2.2vw, 2.35rem)",
                  lineHeight: 1.1,
                }}
              >
                Every Space,<br />a Story
              </h2>
            </motion.div>

            {/* Right: ghost Cormorant index counter */}
            <div
              className="text-right"
              style={{ userSelect: "none" }}
            >
              {/* Giant ghost digit */}
              <div style={{ position: "relative", lineHeight: 1 }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentLabel}
                    style={{
                      display: "block",
                      fontFamily: "'Cormorant Garamond', 'Cormorant', 'Georgia', serif",
                      color: "var(--rr-text)",
                      fontSize: "clamp(5rem, 9vw, 10rem)",
                      lineHeight: 0.9,
                      opacity: 0.07,
                      letterSpacing: "-0.03em",
                      fontWeight: 300,
                    }}
                    initial={{ y: -24, opacity: 0 }}
                    animate={{ y: 0, opacity: 0.07 }}
                    exit={{ y: 24, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {currentLabel}
                  </motion.span>
                </AnimatePresence>

                {/* Small "/ 08" suffix */}
                <p
                  style={{
                    color: "var(--rr-text)",
                    opacity: 0.3,
                    fontSize: "11px",
                    letterSpacing: "0.22em",
                    marginTop: "6px",
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  / {totalLabel}
                </p>
              </div>
            </div>
          </div>

          {/* ── Active card label (bottom-left, above progress bar) ─────────── */}
          <div
            className="absolute pointer-events-none"
            style={{ bottom: "72px", left: "52px", zIndex: 20 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={activeIndex}
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "var(--rr-text)",
                  fontSize: "clamp(0.7rem, 1vw, 0.85rem)",
                  letterSpacing: "0.15em",
                  opacity: 0.5,
                  fontStyle: "italic",
                }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 0.5, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.35 }}
              >
                {IMAGES[activeIndex].alt}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* ── Cinema Reel Rail ──────────────────────────────────────────── */}
          <motion.div
            ref={railRef}
            className="absolute top-1/2 -translate-y-1/2 flex items-center"
            style={{
              x: xMv,
              paddingLeft: `calc(50vw - ${CARD_W / 2}px)`,
              paddingRight: `calc(50vw - ${CARD_W / 2}px)`,
              willChange: "transform",
            }}
          >
            {IMAGES.map((img, i) => (
              <ReelCard
                key={i}
                image={img}
                index={i}
                total={IMAGES.length}
                activeIndex={activeIndex}
                scrollYProgress={scrollYProgress}
                onOpen={openLightbox}
              />
            ))}
          </motion.div>

          {/* ── Bottom bar: progress + hint ───────────────────────────────── */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center gap-5"
            style={{ padding: "0 52px 38px" }}
          >
            {/* Scroll-to-explore hint */}
            <motion.p
              style={{
                opacity: hintOpacity,
                color: "var(--rr-text)",
                fontSize: "9px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Scroll to explore
            </motion.p>

            {/* Brass progress fill bar */}
            <div
              className="flex-1 relative"
              style={{ height: "1px" }}
            >
              {/* Track (dimmed) */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "var(--rr-text)", opacity: 0.12 }}
              />
              {/* Brass fill */}
              <motion.div
                className="absolute inset-0 origin-left"
                style={{
                  backgroundColor: "#C5A880",
                  scaleX: scrollYProgress,
                }}
              />
            </div>

            {/* Index tick marks */}
            <div className="flex gap-[6px] items-center" style={{ flexShrink: 0 }}>
              {IMAGES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scaleY: i === activeIndex ? 2.2 : 1,
                    opacity: i === activeIndex ? 1 : 0.28,
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: "2px",
                    height: "10px",
                    borderRadius: "1px",
                    transformOrigin: "center",
                    backgroundColor: i === activeIndex ? "#C5A880" : "var(--rr-text)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Lightbox open affordance overlay on active card ───────────── */}
          {/* (Handled by ReelCard's onClick, this is just the cursor hint) */}

        </div>{/* /sticky */}
      </div>{/* /h-[420vh] */}

      {/* ── Lightbox (shared between desktop reel + mobile grid) ──────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={IMAGES}
            activeIndex={lightboxIndex}
            onClose={closeLightbox}
            onNext={nextImage}
            onPrev={prevImage}
            onJump={jumpImage}
          />
        )}
      </AnimatePresence>
    </section>
  );
}