"use client";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  getDate,
  getDay,
  getDaysInMonth,
  startOfMonth,
} from "date-fns";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export type DateRange = { checkIn: Date | null; checkOut: Date | null };

type Props = {
  open: boolean;
  onClose: () => void;
  range: DateRange;
  onChange: (range: DateRange) => void;
  /** Which field initiated the open: focuses the picker behaviour */
  focused: "in" | "out";
};

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ── Pricing + booked-date helpers ───────────────────────────────────────── */
const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function BookingCalendar({ open, onClose, range, onChange, focused }: Props) {
  const today = useMemo(() => stripTime(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next
  const ref = useRef<HTMLDivElement>(null);

  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Fetch Availability
    fetch('/api/availability')
      .then(res => res.json())
      .then(data => {
        if (data.unavailableDates) {
          setUnavailableDates(new Set(data.unavailableDates));
        }
      })
      .catch(console.error);

    // Fetch Prices
    const startStr = format(today, 'yyyy-MM-dd');
    const endStr = format(addMonths(today, 12), 'yyyy-MM-dd');
    fetch(`/api/pricing/calendar?start=${startStr}&end=${endStr}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setPrices(data);
      })
      .catch(console.error);
  }, [today]);

  const priceFor = (d: Date): number => {
    const dStr = format(d, 'yyyy-MM-dd');
    return prices[dStr] || 4000;
  };

  const isBooked = (d: Date): boolean => {
    if (d < today) return true;
    const dStr = format(d, 'yyyy-MM-dd');
    return unavailableDates.has(dStr);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    const t = window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const monthDays = useMemo(() => {
    const totalDays = getDaysInMonth(currentMonth);
    const days = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
      days.push({
        date,
        isToday: isToday(date),
      });
    }
    return days;
  }, [currentMonth]);

  const startDayOffset = useMemo(() => getDay(currentMonth), [currentMonth]);

  const handlePick = (d: Date) => {
    if (isBooked(d)) return;
    const { checkIn, checkOut } = range;

    if (focused === "in" || !checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: d, checkOut: null });
      return;
    }
    if (d <= checkIn) {
      onChange({ checkIn: d, checkOut: null });
      return;
    }
    onChange({ checkIn, checkOut: d });
  };

  const isInRange = (d: Date) => {
    if (!range.checkIn) return false;
    if (!range.checkOut) return isSameDay(d, range.checkIn);
    return d >= range.checkIn && d <= range.checkOut;
  };

  const handlePrevMonth = () => {
    setDirection(-1);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setDirection(1);
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const totalNights = (() => {
    if (!range.checkIn || !range.checkOut) return 0;
    return Math.round((+range.checkOut - +range.checkIn) / 86400000);
  })();

  const totalPrice = (() => {
    if (!range.checkIn || !range.checkOut) return 0;
    let sum = 0;
    const d = new Date(range.checkIn);
    while (d < range.checkOut) {
      sum += priceFor(d);
      d.setDate(d.getDate() + 1);
    }
    return sum;
  })();

  const gridVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir * 40,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir * -40,
    }),
  };

  // Perfect positioning:
  // Mobile: left-0
  // Desktop: Check-out starts at calc(50% - ~75px) depending on Reserve width
  const alignClass = focused === "in" 
    ? "left-0" 
    : "left-0 md:left-[calc(50%-100px)]";

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 z-[45]"
            aria-hidden="true"
            onClick={() => onCloseRef.current()}
          />

          <motion.div
            ref={ref}
            initial={isDesktop ? { opacity: 0, y: 10 } : { y: "100%" }}
            animate={isDesktop ? { opacity: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, y: 8 } : { y: "100%" }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className={`absolute bottom-full mb-3 md:w-[360px] z-[50] origin-bottom ${alignClass} rounded-2xl shadow-2xl bg-[#2A241F]/95 backdrop-blur-xl border border-white/10 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:h-auto max-md:max-h-[85vh] max-md:w-full max-md:rounded-t-3xl max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0 max-md:shadow-[0_-20px_40px_rgba(0,0,0,0.3)] max-md:z-[100]`}
          >
            {/* Mobile Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Glass Container */}
            <div className="w-full rounded-2xl p-4 md:p-5 overflow-hidden text-white font-sans">
              
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <motion.p
                  key={format(currentMonth, "MMMM-yyyy")}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg md:text-xl font-bold tracking-tight"
                >
                  {format(currentMonth, "MMMM")}
                  <span className="ml-2 text-base font-medium text-white/50">
                    {format(currentMonth, "yyyy")}
                  </span>
                </motion.p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-full text-white/70 transition-colors hover:bg-white/10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-full text-white/70 transition-colors hover:bg-white/10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAY_HEADERS.map((d) => (
                  <span
                    key={d}
                    className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Grid */}
              <div className="overflow-hidden min-h-[240px]">
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={format(currentMonth, "yyyy-MM")}
                    custom={direction}
                    variants={gridVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 200, damping: 26, mass: 0.8 },
                      opacity: { duration: 0.25, ease: "easeInOut" },
                    }}
                  >
                    <div className="grid grid-cols-7 gap-y-2">
                      {Array.from({ length: startDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}

                      {monthDays.map((day) => {
                        const d = day.date;
                        const booked = isBooked(d);
                        const past = d < today;
                        const selectable = !booked && !past;
                        
                        const isStart = range.checkIn && isSameDay(d, range.checkIn);
                        const isEnd = range.checkOut && isSameDay(d, range.checkOut);
                        const inRange = isInRange(d);
                        
                        return (
                          <div key={format(d, "yyyy-MM-dd")} className="flex justify-center relative">
                            {/* Range fill background */}
                            {inRange && !isStart && !isEnd && (
                              <div className="absolute inset-y-0 left-0 right-0 bg-white/10 z-0" />
                            )}
                            {(isStart && range.checkOut && !isEnd) && (
                              <div className="absolute inset-y-0 right-0 left-1/2 bg-white/10 z-0" />
                            )}
                            {(isEnd && range.checkIn && !isStart) && (
                              <div className="absolute inset-y-0 left-0 right-1/2 bg-white/10 z-0" />
                            )}

                            <button
                              disabled={!selectable}
                              onClick={() => handlePick(d)}
                              className={`flex max-md:py-1 max-md:h-auto min-h-8 md:h-9 md:w-9 flex-col items-center justify-center rounded-full transition-all duration-200 relative z-10 text-[13px] ${
                                isStart || isEnd
                                  ? "bg-[#C5A880] text-white shadow-[0_4px_12px_-2px_rgba(197,168,128,0.5)]"
                                  : selectable
                                    ? inRange
                                      ? "text-white"
                                      : "hover:bg-white/15 text-white"
                                    : "text-white/25 cursor-not-allowed"
                              }`}
                            >
                              <span
                                className={`text-sm font-semibold leading-none ${booked ? "line-through decoration-white/30" : ""}`}
                              >
                                {getDate(d)}
                              </span>
                              
                              {/* Price dot or price chip - minimalist approach */}
                              <span
                                className={`text-[8px] md:text-[9px] leading-none mt-0.5 ${
                                  isStart || isEnd ? "text-white/90" : selectable && !inRange ? "text-[#C5A880]" : "text-white/20"
                                }`}
                              >
                                {past ? "" : booked ? "—" : `₹${priceFor(d)}`}
                              </span>
                              
                              {day.isToday && !isStart && !isEnd && (
                                <span className="absolute bottom-[2px] h-1 w-1 rounded-full bg-[#C5A880]" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer summary */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">
                    {totalNights > 0
                      ? `${totalNights} Night${totalNights === 1 ? "" : "s"}`
                      : focused === "in"
                        ? "Check-in"
                        : "Check-out"}
                  </span>
                  <span className="text-sm font-semibold text-white tracking-wide">
                    {totalPrice > 0 ? `₹${totalPrice.toLocaleString()} total` : "—"}
                  </span>
                </div>
                <button
                  onClick={() => onChange({ checkIn: null, checkOut: null })}
                  className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}