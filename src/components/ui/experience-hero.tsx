"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, MessageCircle, SquarePen, X } from "lucide-react";

// ── HeroBackground ──────────────────────────────────────────────────────────
const HeroBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    {/* Film grain */}
    <div
      className="absolute inset-0 mix-blend-overlay opacity-25"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "150px 150px",
      }}
    />

    {/* Breathing light overlay */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent"
      animate={{ opacity: [0.2, 0.35, 0.2] }}
      transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
    />

    {/* Dot grid */}
    <div
      className="absolute inset-0 opacity-25"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "30px 30px, 30px 30px",
        backgroundPosition: "0 0, 15px 15px",
      }}
    />

    {/* Ambient glow blobs */}
    <motion.div
      className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/15 blur-3xl"
      animate={{ opacity: [0.1, 0.25, 0.1] }}
      transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.div
      className="absolute bottom-1/4 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"
      animate={{ opacity: [0.05, 0.18, 0.05] }}
      transition={{ duration: 8, repeat: Infinity, repeatType: "reverse", delay: 1.5 }}
    />

    {/* Diagonal light sweep */}
    <motion.div
      className="absolute -inset-full h-[300%] w-[200%] opacity-[0.07]"
      style={{
        background:
          "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
        transform: "rotate(-15deg)",
      }}
      animate={{ left: ["-100%", "100%"] }}
      transition={{ duration: 6, repeat: Infinity, repeatDelay: 10, ease: "easeInOut" }}
    />

    {/* Edge borders */}
    <div className="absolute inset-0">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/15 via-white/[0.08] to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/15 via-white/[0.08] to-transparent" />
    </div>
  </div>
);

// ── TextRotator ─────────────────────────────────────────────────────────────
interface TextRotatorProps {
  words: string[];
  interval?: number;
}

const TextRotator = ({ words, interval = 3200 }: TextRotatorProps) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: "0.25em",
      filter: "blur(6px)",
      scale: 0.92,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        delay: i * 0.04,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: "-0.25em",
      filter: "blur(6px)",
      scale: 0.92,
      transition: {
        delay: i * 0.02,
        duration: 0.25,
        ease: "easeInOut" as const,
      },
    }),
  };

  const getColor = (i: number, total: number) => {
    const hue = (idx * 45 + (i / total) * 60) % 360;
    return `hsl(${hue}, 75%, 65%)`;
  };

  const longestWord = words.reduce((a, b) => (a.length >= b.length ? a : b));

  return (
    <span className="relative inline-block">
      {/* Invisible spacer reserves width/height of longest word */}
      <span className="invisible select-none" aria-hidden="true">
        {longestWord}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          className="absolute inset-0 flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-live="polite"
        >
          {words[idx].split("").map((char, i, arr) => (
            <motion.span
              key={`${idx}-${i}`}
              custom={i}
              variants={letterVariants}
              style={{
                color: getColor(i, arr.length),
                display: "inline-block",
                fontWeight: "inherit",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// ── ExperienceHero ───────────────────────────────────────────────────────────
export default function ExperienceHero() {
  const [showContactChoice, setShowContactChoice] = useState(false);

  useEffect(() => {
    if (!showContactChoice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowContactChoice(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showContactChoice]);

  const openContactOverlay = () => {
    setShowContactChoice(false);
    const overlay = document.getElementById("contact-overlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const openWhatsApp = () => {
    setShowContactChoice(false);
    const text = encodeURIComponent("Hi Luminx, ik wil graag een afspraak inplannen.");
    window.open(`https://wa.me/31613698596?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const rotatingWords = ["PERFORMANCE", "AUTOMATION", "RESULTS"];

  return (
    <section
      data-bg-color="#020202"
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#020202] selection:bg-white selection:text-black"
    >
      <HeroBackground />

      {/* ── Main content ── */}
      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center"
        initial={{ opacity: 0, filter: "blur(30px)", scale: 1.02 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h1
          className="flex flex-col items-center text-white text-[clamp(3.5rem,9.5vw,11.5rem)] font-black leading-[0.87] tracking-tighter uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <span>WE ENGINEER</span>
          <TextRotator words={rotatingWords} interval={3500} />
        </motion.h1>

        <motion.p
          className="mt-[clamp(1.5rem,2vw,2rem)] mb-[clamp(2rem,3vw,3.5rem)] max-w-md font-mono text-[clamp(9px,0.75vw,11px)] uppercase leading-relaxed tracking-[0.35em] text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          WE ENGINEER AUTOMATIONS AND CAMPAIGNS THAT DELIVER ON BUSINESS NEEDS
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="pointer-events-auto flex flex-col items-center gap-3 md:flex-row md:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          <button
            type="button"
            data-seoscan-open
            className="group relative inline-flex h-[clamp(44px,3.5vw,52px)] min-w-[clamp(200px,16vw,240px)] shrink-0 select-none items-center justify-start overflow-hidden rounded-xl bg-white pl-10 pr-24 text-sm font-medium text-black transition-all duration-500 hover:pl-14 hover:pr-12"
          >
            <span className="relative z-10 inline-block translate-x-4 whitespace-nowrap font-sans text-[12px] font-semibold uppercase tracking-[0.12em] transition-all duration-500 group-hover:translate-x-4">
              Gratis SEO Check
            </span>
            <div className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-black text-white transition-all duration-500 group-hover:right-[calc(100%-40px)] md:h-11 md:w-11 md:rounded-xl md:group-hover:right-[calc(100%-48px)]">
              <ArrowUpRight size={14} className="md:!h-4 md:!w-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowContactChoice(true)}
            className="inline-flex h-[clamp(44px,3.5vw,52px)] min-w-[clamp(180px,15vw,220px)] shrink-0 select-none items-center justify-center rounded-xl border border-white bg-transparent px-6 font-sans text-[clamp(10px,0.8vw,12px)] font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10"
          >
            Maak een afspraak
          </button>
        </motion.div>
      </motion.div>

      {/* ── Left card: Diensten ── */}
      <motion.div
        className="absolute bottom-10 left-10 z-30 hidden xl:block"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <div className="absolute inset-0 rounded-2xl bg-white/5 blur-xl" />
        <motion.div
          className="relative w-72 overflow-hidden rounded-xl border border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl"
          whileHover={{ y: -3, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold tracking-tight text-white">
                Onze<br />Diensten
              </h3>
              <div className="rounded-lg bg-white/10 p-2 text-white/80 backdrop-blur-md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  label: "SEO & SEA",
                  d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                },
                {
                  label: "Websites & Webshops",
                  d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2",
                },
                {
                  label: "Procesautomation",
                  d: "M13 10V3L4 14h7v7l9-11h-7z",
                },
              ].map(({ label, d }) => (
                <div key={label} className="flex items-center gap-3 text-white/90">
                  <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-white/50">Bekijk alle diensten</span>
              <motion.a
                href="/#diensten"
                className="rounded-full bg-white/10 p-2 backdrop-blur-sm cursor-pointer"
                whileHover={{ backgroundColor: "rgba(255,255,255,0.18)" }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Right card: Resultaten ── */}
      <motion.div
        className="absolute bottom-10 right-10 z-30 hidden xl:block"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <motion.div
          className="relative w-72"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="absolute inset-0 rounded-2xl bg-white/5 blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-black/20 shadow-xl backdrop-blur-xl">
            <div className="p-6">
              <div className="mb-5">
                <h3 className="text-base font-semibold text-white">Onze Resultaten</h3>
                <p className="text-xs text-white/45">Voor onze klanten</p>
              </div>

              <div className="mb-5 space-y-3">
                {[
                  { label: "SEO Rankings", sub: "Organisch verkeer", pct: 95 },
                  { label: "Paid Campaigns", sub: "Google & Social Ads", pct: 88 },
                  { label: "Automatiseringen", sub: "Processen geoptimaliseerd", pct: 75 },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="rounded-lg bg-white/5 p-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 + i * 0.1 }}
                  >
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mb-2 text-xs text-white/40">{item.sub}</p>
                    <div className="h-1 rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-white/75"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 1.2, delay: 2.1, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                {[
                  { val: "50+", lbl: "Klanten" },
                  { val: "98%", lbl: "Tevredenheid" },
                  { val: "24/7", lbl: "Support" },
                ].map((s, i) => (
                  <motion.div
                    key={s.lbl}
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.3 + i * 0.1 }}
                  >
                    <p className="text-sm font-semibold text-white">{s.val}</p>
                    <p className="text-xs text-white/40">{s.lbl}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Contact choice modal ── */}
      {showContactChoice && (
        <div
          className="fixed inset-0 z-[1000001] flex items-center justify-center bg-black/75 p-8 backdrop-blur-sm md:p-10"
          onClick={() => setShowContactChoice(false)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-[#0b0b0b]/95 p-9 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] md:p-10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Kies contactmethode"
          >
            <button
              type="button"
              aria-label="Popup sluiten"
              onClick={() => setShowContactChoice(false)}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-white/35 hover:text-white"
            >
              <X size={16} />
            </button>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
              Afspraak
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Kies het contactmoment wat bij je past.
            </p>
            <div className="mt-9 grid gap-5">
              <button
                type="button"
                onClick={openWhatsApp}
                className="group inline-flex h-16 items-center justify-between rounded-xl border border-white/20 bg-white px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-black transition hover:bg-white/90"
              >
                <span>WhatsApp</span>
                <MessageCircle size={16} />
              </button>
              <button
                type="button"
                onClick={openContactOverlay}
                className="group inline-flex h-16 items-center justify-between rounded-xl border border-white/20 bg-transparent px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition hover:border-white/35 hover:bg-white/5"
              >
                <span>Contactformulier</span>
                <SquarePen size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
