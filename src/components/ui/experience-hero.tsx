"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

export default function ExperienceHero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const lightRef = useRef<HTMLDivElement | null>(null);

  // Cursor-following light — the first thing a visitor's mouse touches
  // gets an immediate, alive response. Plain CSS-var + rAF lerp, no WebGL,
  // so it stays cheap on the highest-traffic section of the page.
  useEffect(() => {
    const el = rootRef.current;
    const light = lightRef.current;
    if (!el || !light) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0.5;
    let targetY = 0.4;
    let curX = 0.5;
    let curY = 0.4;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = (e.clientY - rect.top) / rect.height;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      light.style.setProperty("--lx", `${curX * 100}%`);
      light.style.setProperty("--ly", `${curY * 100}%`);
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Headline mask reveal on load
  useEffect(() => {
    if (!headlineRef.current) return;
    gsap.registerPlugin(SplitText);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(headlineRef.current, { opacity: 1 });
      return;
    }

    const split = SplitText.create(headlineRef.current, {
      type: "lines",
      mask: "lines",
      linesClass: "hero-wm__line",
    });

    gsap.set(headlineRef.current, { opacity: 1 });
    gsap.from(split.lines, {
      yPercent: 110,
      opacity: 0,
      duration: 1.1,
      ease: "power4.out",
      stagger: 0.09,
      delay: 0.15,
    });

    return () => split.revert();
  }, []);

  const openContact = () => {
    const overlay = document.getElementById("contact-overlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const scrollToWork = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("werk")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={rootRef} data-bg-color="#000000" className="hero-wm">
      <div className="hero-wm__portrait" aria-hidden="true" />
      <div className="hero-wm__portrait-fade" aria-hidden="true" />
      <div className="scene-grain" aria-hidden="true" />
      <div ref={lightRef} className="hero-wm__light" aria-hidden="true" />
      <div className="scene-vignette" aria-hidden="true" />

      <div className="hero-wm__content">
        <span className="hero-wm__kicker">LuminX — Digital Collective, Enschede</span>

        <h1 ref={headlineRef} className="hero-wm__headline" style={{ opacity: 0 }}>
          Wij maken groei onvermijdelijk.
        </h1>

        <p className="hero-wm__sub">
          Een klein team dat zichtbaarheid, techniek en automatisering samensmeedt
          tot één systeem — zodat groei geen toeval meer is, maar een gevolg.
        </p>

        <div className="hero-wm__actions">
          <button type="button" className="hero-wm__cta-primary" onClick={openContact}>
            Start het gesprek
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <a href="#werk" className="hero-wm__cta-ghost" onClick={scrollToWork}>
            Bekijk het werk
          </a>
        </div>
      </div>

      <div className="hero-wm__scroll-hint" aria-hidden="true">
        <span className="hero-wm__scroll-line" />
        <span className="hero-wm__scroll-label">Scroll</span>
      </div>

      <div className="hero-wm__meta">
        <div className="hero-wm__meta-tag">
          <span className="hero-wm__dot" />
          Beschikbaar voor nieuwe projecten — Q3 / Q4
        </div>
        <div className="hero-wm__meta-right">Enschede ↔ Nederland</div>
      </div>
    </section>
  );
}
