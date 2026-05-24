"use client";
import { useEffect, useRef, useState } from "react";
import { Phone, Mail, Instagram } from "lucide-react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "motion/react";
import { MagneticWrapper } from "./MagneticWrapper";
import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function RevealLine({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function SwapLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="relative inline-block overflow-hidden leading-[1.4] group"
      style={{ color: "var(--rr-footer-text-muted)" }}
    >
      <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full text-sm font-light">
        {label}
      </span>
      <span
        className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 text-sm font-light"
        style={{ color: "#C5A880" }}
      >
        {label}
      </span>
    </a>
  );
}

export function Footer() {
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();
  const animate = isDesktop && !reduce;

  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });
  // Parallax drift for the giant wordmark
  const wordmarkX = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const headlineRef = useRef<HTMLDivElement>(null);
  const headlineInView = useInView(headlineRef, { once: true, margin: "-15%" });

  return (
    <footer
      ref={footerRef}
      className="w-full pt-24 pb-8 relative overflow-hidden"
      style={{ backgroundColor: "var(--rr-footer-bg)", color: "var(--rr-footer-text)" }}
    >
      {/* Kinetic wordmark — desktop only */}
      {animate && (
        <motion.div
          style={{ x: wordmarkX }}
          className="hidden lg:flex absolute bottom-0 left-0 w-full overflow-visible opacity-[0.06] pointer-events-none select-none justify-center"
        >
          <span className="font-['Playfair_Display'] text-[15vw] whitespace-nowrap leading-[0.85]">
            ROSELLA
          </span>
        </motion.div>
      )}
      {/* Static fallback wordmark — tablet/mobile */}
      {!animate && (
        <div className="lg:hidden absolute bottom-0 left-0 w-full overflow-hidden opacity-[0.05] pointer-events-none select-none flex justify-center">
          <span className="font-['Playfair_Display'] text-[22vw] whitespace-nowrap leading-[0.85]">
            ROSELLA
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        {/* Top Section - CTA & Map */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 pb-16 lg:pb-20 border-b"
          style={{ borderColor: "var(--rr-footer-border)" }}
        >
          <div ref={headlineRef} className="flex flex-col items-start justify-center h-full gap-6 lg:gap-8">
            <h2 className="font-['Playfair_Display'] text-4xl lg:text-5xl text-[#C5A880] leading-tight">
              {animate ? (
                <RevealLine>An Elevation in Luxury.</RevealLine>
              ) : (
                "An Elevation in Luxury."
              )}
            </h2>

            <motion.p
              className="text-lg font-light max-w-md text-white/70"
              initial={animate ? { opacity: 0, y: 12 } : false}
              whileInView={animate ? { opacity: 1, y: 0 } : undefined}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
            >
              Secure your dates and prepare for an exclusive retreat above the clouds in Dehradun.
            </motion.p>

            <motion.div
              initial={animate ? { opacity: 0, scale: 0.94 } : false}
              whileInView={animate ? { opacity: 1, scale: 1 } : undefined}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
            >
              <MagneticWrapper hitPad={36} strength={0.30}>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="relative px-10 py-5 bg-[#C5A880] hover:bg-transparent border-2 border-[#C5A880] text-white hover:text-[#C5A880] uppercase tracking-[0.2em] text-sm font-semibold transition-all duration-300"
                >
                  Book Your Retreat
                </button>
              </MagneticWrapper>
            </motion.div>
          </div>

          <motion.div
            className="relative w-full aspect-video md:aspect-[2/1] border p-2 group overflow-hidden rounded-2xl shadow-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "var(--rr-footer-border)" }}
            initial={animate ? { clipPath: "inset(100% 0 0 0)" } : false}
            whileInView={animate ? { clipPath: "inset(0% 0 0 0)" } : undefined}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}
          >
            <div className="w-full h-full relative rounded-xl overflow-hidden" style={{ backgroundColor: "#1A251D" }}>
              <LocationMap />
            </div>
          </motion.div>
        </div>

        {/* Links Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 py-16 border-b"
          style={{ borderColor: "var(--rr-footer-border)" }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
          }}
        >
          <motion.div
            className="col-span-1 md:col-span-2 lg:col-span-2"
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
            }}
          >
            <h3 className="font-['Playfair_Display'] text-3xl mb-6" style={{ color: "var(--rr-footer-text)" }}>Rosella Retreat</h3>
            <p className="text-sm font-light leading-relaxed max-w-sm mb-8" style={{ color: "var(--rr-footer-text-muted)" }}>
              A luxury 3-bedroom staycation villa designed for discerning guests who value privacy, exclusivity, and elevated living.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/rosellaretreat.in/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors duration-300 hover:bg-[#C5A880] hover:border-[#C5A880] text-[color:var(--rr-footer-text-muted)] hover:text-white"
                style={{ borderColor: "var(--rr-footer-border)" }}
              >
                <Instagram size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
            }}
          >
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#C5A880] mb-6 font-semibold">Nearby Escapes</h4>
            <ul className="space-y-4">
              {[
                { name: 'Mussoorie', time: '1 hr' },
                { name: 'Rishikesh', time: '1 hr' },
                { name: 'Haridwar', time: '1 hr' }
              ].map((loc) => (
                <li key={loc.name} className="flex items-center group cursor-default transition-transform duration-300 ease-out hover:translate-x-1">
                  <span className="text-sm font-light transition-colors duration-300 text-[color:var(--rr-footer-text)] group-hover:!text-[#C5A880]">
                    {loc.name}
                  </span>
                  <span className="flex-grow border-b border-dashed border-white/20 mx-3 transition-colors duration-300 group-hover:border-[#C5A880]/30"></span>
                  <span className="text-sm font-light text-white/50">{loc.time}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
            }}
          >
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#C5A880] mb-6 font-semibold">Quick Links</h4>
            <ul className="space-y-4">
              {['The Vibe', 'Amenities', 'Gallery', 'Reviews'].map((link) => (
                <li key={link}>
                  <SwapLink label={link} href={`#${link.toLowerCase().replace(' ', '-')}`} />
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
            }}
          >
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#C5A880] mb-6 font-semibold">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm font-light transition-colors cursor-pointer hover:text-white" style={{ color: "var(--rr-footer-text-muted)" }}>
                <Phone size={16} className="text-[#C5A880]" /> +91 9091919149
              </li>
              <li className="flex items-center gap-3 text-sm font-light transition-colors cursor-pointer hover:text-white" style={{ color: "var(--rr-footer-text-muted)" }}>
                <Mail size={16} className="text-[#C5A880]" /> reserve@rosellaretreat.com
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-light uppercase tracking-wider text-center md:text-left" style={{ color: "var(--rr-footer-text-muted)" }}>
          <p>&copy; 2026 Rosella Retreat. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a href="/policies" className="hover:text-white transition-colors">Villa Policies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
