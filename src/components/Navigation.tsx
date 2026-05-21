"use client";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);
  const NAV_LINKS = ["The Vibe", "Amenities", "Suites", "Gallery"];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-md border-b py-4 shadow-sm"
            : "bg-transparent py-6"
        }`}
        style={isScrolled ? {
          backgroundColor: "var(--rr-nav-scrolled-bg)",
          borderColor: "var(--rr-border-light)",
        } : undefined}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-3 items-center">
          {/* Logo - Left */}
          <div
            className="font-['Playfair_Display'] text-xl md:text-2xl tracking-[0.15em] font-medium justify-self-start transition-colors duration-300"
            style={{ color: isScrolled ? "var(--rr-nav-text)" : "rgba(255,255,255,0.9)" }}
          >
            ROSELLA RETREAT
          </div>

          {/* Desktop Links - Center */}
          <div className="hidden md:flex items-center justify-center space-x-12">
            {NAV_LINKS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-xs tracking-[0.2em] uppercase whitespace-nowrap transition-colors hover:text-[#C5A880]"
                style={{ color: isScrolled ? "var(--rr-text-secondary)" : "rgba(255,255,255,0.9)" }}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right side — hamburger / close */}
          <div className="flex justify-end">
            <button
              className="md:hidden transition-colors z-[110] relative"
              style={{ color: isScrolled && !mobileMenuOpen ? "var(--rr-nav-text)" : "rgba(255,255,255,0.9)" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Full-Screen Mobile Menu Takeover ─────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="md:hidden fixed inset-0 z-[100] w-full h-[100svh] bg-black/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/20 flex flex-col text-white"
          >
            {/* Header row inside menu — logo + close */}
            <div className="flex justify-between items-center w-full px-6 py-6 md:px-12 md:py-8 border-b border-white/10">
              <div className="font-['Playfair_Display'] text-xl tracking-[0.15em] font-medium text-white/90">
                ROSELLA RETREAT
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {/* Centered navigation links */}
            <div className="flex-1 flex flex-col items-center justify-center gap-10 pb-20">
              {NAV_LINKS.map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.35, ease: "easeOut" }}
                  className="text-2xl tracking-[0.2em] uppercase font-['Montserrat'] text-white/80 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </motion.a>
              ))}
            </div>

            {/* Subtle brass accent at the bottom */}
            <div className="pb-10 flex flex-col items-center gap-2">
              <div className="w-8 h-px bg-[#C5A880] mb-3" />
              <p className="font-['Montserrat'] text-[10px] tracking-[0.3em] uppercase text-white/50">
                Exclusive Estate · Himalayas
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}