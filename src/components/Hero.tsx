"use client";
import { motion, useTransform, AnimatePresence } from "motion/react";
import { useState, useEffect, Fragment } from "react";
import { useTheme } from "./context/ThemeContext";
import { useLenisScroll } from "./context/LenisContext";
import { MagneticWrapper } from "./MagneticWrapper";
import { Starfield } from "./Starfield";
import { BookingCalendar, type DateRange } from "./BookingCalendar";
import Image from "next/image";

const DATE_FMT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const formatDate = (d: Date | null) =>
  d ? d.toLocaleDateString(undefined, DATE_FMT) : "Select Date";

const DUSK_URL = "https://dl.dropboxusercontent.com/scl/fi/6l2pdudps877p4xhr81ha/Villa_overlooking_valley_at_dusk_202604292304.mp4?rlkey=fcr2wq53lm4w6gkvd8ceoxfc8&st=drp48bvc";
const NIGHT_URL = "/Night_Video.mp4";
const POSTER_URL = "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=2000&q=80";

const HEADLINE = "ROSELLA RETREAT";

// Cinematic ease — same curve used elsewhere on the site.
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * ConciergeOverlay — An elegant modal summarizing the reservation
 * request and providing a WhatsApp handoff.
 */
function ConciergeOverlay({
  isOpen,
  onClose,
  range,
}: {
  isOpen: boolean;
  onClose: () => void;
  range: DateRange;
}) {
  const { stop, start } = useLenisScroll();
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      stop();
      if (range.checkIn && range.checkOut) {
        setIsLoading(true);
        fetch('/api/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            checkIn: `${range.checkIn.getFullYear()}-${String(range.checkIn.getMonth() + 1).padStart(2, '0')}-${String(range.checkIn.getDate()).padStart(2, '0')}`, 
            checkOut: `${range.checkOut.getFullYear()}-${String(range.checkOut.getMonth() + 1).padStart(2, '0')}-${String(range.checkOut.getDate()).padStart(2, '0')}` 
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.totalPrice) setTotalPrice(data.totalPrice);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
      }
    } else {
      start();
      setTotalPrice(null);
    }
    return () => start();
  }, [isOpen, stop, start, range]);

  const generateWhatsAppLink = () => {
    const checkInStr = range.checkIn ? range.checkIn.toLocaleDateString(undefined, DATE_FMT) : "TBD";
    const checkOutStr = range.checkOut ? range.checkOut.toLocaleDateString(undefined, DATE_FMT) : "TBD";
    const priceStr = totalPrice ? `\n(Estimated Total: ₹${totalPrice.toLocaleString()})` : "";
    const message = `Namaste. I would like to request an exclusive reservation for the entire Rosella Retreat estate.\n*Itinerary:* ${checkInStr} to ${checkOutStr}${priceStr}\nPlease let me know the next steps to secure this booking.`;
    return `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] flex items-center justify-center max-md:h-[100svh] bg-black/60 backdrop-blur-md p-0 md:p-6"
        >
          <motion.div
            initial={{ y: 40, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.95, opacity: 0 }}
            transition={{ ease: EASE_OUT_EXPO, duration: 0.8 }}
            className="relative w-full max-w-xl bg-white/5 border border-white/10 p-8 md:p-14 shadow-2xl flex flex-col items-center text-center rounded-sm max-md:w-full max-md:h-full max-md:rounded-none max-md:border-none max-md:flex max-md:flex-col max-md:justify-between max-md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <h2 className="font-['Montserrat'] text-sm tracking-[0.3em] uppercase text-white/50 mb-10 md:mb-12 max-md:pt-8">
              Estate Reservation Request
            </h2>

            <div className="mb-10 md:mb-12 w-full">
              {range.checkIn || range.checkOut ? (
                <div className="flex max-md:flex-row max-md:justify-center max-md:items-center max-md:gap-8 max-md:w-full flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                  <div className="text-center">
                    <span className="block font-['Montserrat'] text-[10px] tracking-widest uppercase text-white/50 mb-3">Check-in</span>
                    <span className="font-['Playfair_Display'] text-4xl md:text-5xl max-md:text-3xl text-white tracking-wide">
                      {range.checkIn ? range.checkIn.toLocaleDateString(undefined, DATE_FMT) : "—"}
                    </span>
                  </div>
                  <div className="w-px h-16 bg-white/10 hidden md:block" />
                  <div className="hidden max-md:block w-[1px] h-12 bg-white/20" />
                  <div className="text-center">
                    <span className="block font-['Montserrat'] text-[10px] tracking-widest uppercase text-white/50 mb-3">Check-out</span>
                    <span className="font-['Playfair_Display'] text-4xl md:text-5xl max-md:text-3xl text-white tracking-wide">
                      {range.checkOut ? range.checkOut.toLocaleDateString(undefined, DATE_FMT) : "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="font-['Playfair_Display'] text-4xl md:text-5xl text-white tracking-wide">
                  Dates to be determined
                </div>
              )}
            </div>

            {range.checkIn && range.checkOut && (
              <div className="mb-10">
                <p className="font-['Montserrat'] text-[10px] tracking-widest uppercase text-white/50 mb-2">Entire Estate</p>
                <p className="font-['Playfair_Display'] text-3xl text-white tracking-wide">
                  {isLoading ? "Calculating..." : totalPrice ? `₹${totalPrice.toLocaleString()}` : "—"}
                </p>
              </div>
            )}

            <div className="w-full border-t border-white/10 mb-10" />

            <p className="font-['Playfair_Display'] italic text-white/70 text-lg md:text-xl max-md:text-sm max-md:px-4 leading-relaxed max-md:leading-relaxed mb-12 max-w-lg text-center">
              "To ensure the highest level of personalized service, all reservations are finalized directly with our estate concierge."
            </p>

            <div className="max-md:mt-auto max-md:w-full max-md:pb-6">
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-[#C5A880] hover:bg-[#b0946e] text-white font-['Montserrat'] text-xs tracking-[0.2em] uppercase transition-colors shadow-xl max-md:w-full max-md:block max-md:text-center inline-block"
              >
                Connect with Concierge
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



/**
 * SplitHeadline — letter-by-letter reveal where each glyph rises out of
 * an overflow-hidden mask. This is the "cinematic intro" beat.
 */
function SplitHeadline({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  let charIndex = 0;

  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => {
        const wordLetters = Array.from(word);
        const startIndex = charIndex;
        charIndex += wordLetters.length + 1; // +1 for the space

        return (
          <Fragment key={wi}>
            <span style={{ display: "inline-flex", flexWrap: "nowrap" }}>
              {wordLetters.map((ch, li) => (
                <span
                  key={li}
                  aria-hidden="true"
                  className="inline-block overflow-hidden align-baseline"
                  style={{ lineHeight: 0.95 }}
                >
                  <motion.span
                    className="inline-block"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: 1.1,
                      delay: 1.2 + (startIndex + li) * 0.045,
                      ease: EASE_OUT_EXPO,
                    }}
                  >
                    {ch}
                  </motion.span>
                </span>
              ))}
            </span>
            {/* Breakable space after each word except the last */}
            {wi < words.length - 1 && <span>{" "}</span>}
          </Fragment>
        );
      })}
    </span>
  );
}

/**
 * SunMoonKnob — circular knob that morphs between a radiating sun (Dusk)
 * and a crescent moon (Night). The slide position is driven by `isNight`.
 */
function SunMoonKnob({ isNight }: { isNight: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#C5A880] shadow-lg flex items-center justify-center"
      animate={{ left: isNight ? "calc(100% - 2.25rem - 0.25rem)" : "0.25rem" }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
    >
      <span className="relative w-5 h-5">
        {/* Sun rays — fade/scale out at night */}
        <motion.svg
          viewBox="0 0 24 24"
          className="absolute inset-0 w-full h-full"
          animate={{ opacity: isNight ? 0 : 1, rotate: isNight ? 90 : 0, scale: isNight ? 0.6 : 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          <g stroke="#F9F8F6" strokeWidth="1.6" strokeLinecap="round">
            <line x1="12" y1="2.5" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="21.5" />
            <line x1="2.5" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="21.5" y2="12" />
            <line x1="5.2" y1="5.2" x2="7" y2="7" />
            <line x1="17" y1="17" x2="18.8" y2="18.8" />
            <line x1="18.8" y1="5.2" x2="17" y2="7" />
            <line x1="7" y1="17" x2="5.2" y2="18.8" />
          </g>
        </motion.svg>

        {/* Sun disc */}
        <motion.span
          className="absolute inset-1.5 rounded-full bg-[#F9F8F6]"
          animate={{ opacity: isNight ? 0 : 1, scale: isNight ? 0.4 : 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        />

        {/* Moon — crescent built by overlaying the knob colour onto a disc */}
        <motion.span
          className="absolute inset-0 rounded-full bg-[#F9F8F6] overflow-hidden"
          animate={{ opacity: isNight ? 1 : 0, scale: isNight ? 1 : 0.4 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          {/* Crescent cutout — disc of knob colour offset to carve the moon */}
          <span className="absolute -top-0.5 -right-1 w-4 h-4 rounded-full bg-[#C5A880]" />
        </motion.span>
      </span>
    </motion.span>
  );
}

export function Hero() {
  const { isNight, toggle } = useTheme();
  const { scrollY } = useLenisScroll();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [focused, setFocused] = useState<"in" | "out">("in");
  const [range, setRange] = useState<DateRange>({ checkIn: null, checkOut: null });
  const [showConcierge, setShowConcierge] = useState(false);

  // ── Headline scroll parallax ──────────────────────────────────────────────
  // Title rises and slightly grows as the user scrolls into the next section,
  // while fading out so the next section can take over the stage.
  const titleY = useTransform(scrollY, [0, 700], [0, -180]);
  const titleScale = useTransform(scrollY, [0, 700], [1, 1.08]);
  const titleOpacity = useTransform(scrollY, [0, 500, 700], [1, 0.55, 0]);
  const subOpacity = useTransform(scrollY, [0, 280], [1, 0]);
  const subY = useTransform(scrollY, [0, 700], [0, -120]);

  return (
    <section className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Poster fallback so the hero is never blank, even if the video fails to load */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image src={POSTER_URL} alt="Rosella Retreat" fill priority className="object-cover" sizes="100vw" />
      </div>
      {/* Dusk video - base layer, always playing */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/Day Video.webm" type="video/webm" />
        {/* If you also exported an MP4, you can include it below as a fallback: */}
        {/* <source src="/your-video-filename.mp4" type="video/mp4" /> */}
      </video>
      {/* Night video — Motion-driven crossfade on top of the dusk layer */}
      <motion.video
        autoPlay
        loop
        muted
        playsInline
        src={NIGHT_URL}
        className="absolute inset-0 w-full h-full object-cover z-[2]"
        initial={false}
        animate={{ opacity: isNight ? 1 : 0 }}
        transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
      />


      {/* Cinematic intro mask — two black bands hold, then sweep apart.
          Using `y` translation (instead of scaleY) avoids sub-pixel slivers
          and makes the motion feel like a theatrical curtain. */}
      <motion.div
        aria-hidden="true"
        initial={{ y: "0%" }}
        animate={{ y: "-100%" }}
        transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1], delay: 0.35 }}
        className="absolute top-0 left-0 right-0 h-[51%] bg-black z-40 pointer-events-none will-change-transform"
      />
      <motion.div
        aria-hidden="true"
        initial={{ y: "0%" }}
        animate={{ y: "100%" }}
        transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1], delay: 0.35 }}
        className="absolute bottom-0 left-0 right-0 h-[51%] bg-black z-40 pointer-events-none will-change-transform"
      />
      {/* Thin gold seam where the curtains meet — adds the "premiere" beat */}
      <motion.div
        aria-hidden="true"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.95, ease: "easeInOut", times: [0, 0.18, 0.72, 1] }}
        className="absolute top-1/2 left-0 right-0 h-px bg-[#C5A880] z-40 pointer-events-none origin-center"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/25 z-10" />

      {/* Hero Typography Content */}
      <motion.div
        style={{ y: titleY, scale: titleScale, opacity: titleOpacity }}
        className="relative z-20 w-full px-6 md:px-12 flex flex-col items-center justify-center text-center mt-[-5vh] will-change-transform"
      >
        <h1
          className="font-['Playfair_Display'] text-white font-normal mb-6 md:mb-8 text-[clamp(3rem,12vw,7rem)] leading-[1.1] md:leading-none tracking-widest text-center whitespace-normal"
          style={{ mixBlendMode: "difference" }}
        >
          <SplitHeadline text={HEADLINE} />
        </h1>

        <motion.p
          style={{ opacity: subOpacity, y: subY }}
          className="font-['Montserrat'] text-white/90 font-light uppercase text-[clamp(0.6rem,2vw,1rem)] tracking-[0.3em] md:tracking-[0.5em] text-center mt-4"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: HEADLINE.length * 0.045 + 1.4, ease: EASE_OUT_EXPO }}
            className="inline-block"
          >
            Elevated Serenity Above the Doon Valley
          </motion.span>
        </motion.p>
      </motion.div>

      {/* Dusk / Night Environment Toggle */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.1, ease: EASE_OUT_EXPO }}
        onClick={toggle}
        aria-label="Toggle dusk and night environment"
        aria-pressed={isNight}
        className="absolute top-[88px] right-6 min-[1100px]:top-auto min-[1100px]:bottom-14 min-[1100px]:right-auto min-[1100px]:left-12 z-40 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full shadow-2xl flex items-center group"
      >
        <span className="relative flex items-center justify-center h-11 w-11 min-[1446px]:w-auto px-1">
          <SunMoonKnob isNight={isNight} />
          <span
            className={`relative z-10 font-['Montserrat'] text-[10px] tracking-[0.3em] uppercase pl-12 pr-4 transition-colors duration-500 hidden min-[1446px]:inline ${
              !isNight ? "text-white" : "text-white/50"
            }`}
          >
            Dusk
          </span>
          <span
            className={`relative z-10 font-['Montserrat'] text-[10px] tracking-[0.3em] uppercase pl-4 pr-12 transition-colors duration-500 hidden min-[1446px]:inline ${
              isNight ? "text-white" : "text-white/50"
            }`}
          >
            Night
          </span>
        </span>

        {/* Tooltip — visible on md/lg (icon-only range) on hover, hidden on mobile and min-[1446px]+ */}
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            hidden min-[1100px]:flex min-[1446px]:hidden
            absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2
            whitespace-nowrap
            bg-black/60 backdrop-blur-md
            border border-white/15
            rounded-full
            px-3 py-1.5
            font-['Montserrat'] text-[9px] tracking-[0.25em] uppercase text-white/80
            opacity-0 group-hover:opacity-100
            translate-y-1 group-hover:translate-y-0
            transition-all duration-200 ease-out
          "
        >
          Dusk · Night
        </span>
      </motion.button>

      {/* Minimalist Floating Booking Widget */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.8, ease: EASE_OUT_EXPO }}
        className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl z-[48]"
      >
        <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 p-2 md:p-3 flex flex-col md:flex-row items-stretch gap-2 shadow-2xl">

          {/* Check-in */}
          <button
            type="button"
            onClick={() => { setFocused("in"); setCalendarOpen(true); }}
            className={`flex-1 w-full p-3 md:px-6 flex flex-col group cursor-pointer hover:bg-white/5 transition-colors border-b md:border-b-0 md:border-r border-white/20 text-left md:text-center justify-center ${calendarOpen && focused === "in" ? "bg-white/5" : ""}`}
          >
            <span className="font-['Montserrat'] text-[9px] uppercase tracking-widest text-white/70 mb-1">Check-in</span>
            <span className="font-['Playfair_Display'] text-white text-lg md:text-xl tracking-wide">{formatDate(range.checkIn)}</span>
          </button>

          {/* Check-out */}
          <button
            type="button"
            onClick={() => { setFocused("out"); setCalendarOpen(true); }}
            className={`flex-1 w-full p-3 md:px-6 flex flex-col group cursor-pointer hover:bg-white/5 transition-colors text-left md:text-center justify-center ${calendarOpen && focused === "out" ? "bg-white/5" : ""}`}
          >
            <span className="font-['Montserrat'] text-[9px] uppercase tracking-widest text-white/70 mb-1">Check-out</span>
            <span className="font-['Playfair_Display'] text-white text-lg md:text-xl tracking-wide">{formatDate(range.checkOut)}</span>
          </button>

          {/* Reserve Button */}
          <div className="w-full md:w-auto p-2 md:p-0 md:pl-4 flex items-center">
            <MagneticWrapper hitPad={24} strength={0.30}>
              <button 
                type="button"
                onClick={() => setShowConcierge(true)}
                className="w-full md:w-auto px-10 py-4 bg-[#C5A880] hover:bg-[#b0946e] text-white font-['Montserrat'] uppercase tracking-[0.2em] text-xs transition-colors h-full flex items-center justify-center"
              >
                Reserve
              </button>
            </MagneticWrapper>
          </div>

          <BookingCalendar
            open={calendarOpen}
            onClose={() => setCalendarOpen(false)}
            range={range}
            onChange={(r) => {
              setRange(r);
              if (r.checkIn && !r.checkOut) setFocused("out");
              if (r.checkIn && r.checkOut) setCalendarOpen(false);
            }}
            focused={focused}
          />
        </div>
      </motion.div>

      {/* Concierge Overlay */}
      <AnimatePresence>
        {showConcierge && (
          <ConciergeOverlay 
            isOpen={showConcierge} 
            onClose={() => setShowConcierge(false)} 
            range={range} 
          />
        )}
      </AnimatePresence>
    </section>
  );
}
