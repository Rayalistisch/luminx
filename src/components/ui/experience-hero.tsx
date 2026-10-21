"use client";

import { useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  Megaphone,
  Share2,
  Globe,
  ShoppingBag,
  BarChart3,
  Workflow,
} from "lucide-react";

/**
 * Hero "stroom" — every channel feeds one living "omzet" hub. Each wire is a
 * soft coloured line with a brighter gradient streak flowing inward along it.
 * Hovering a channel freezes & dims every other fase's streaks and highlights
 * only the hovered fase (its lines keep flowing, brighter).
 *
 * Wires draw in on load; prefers-reduced-motion gets a still, finished frame;
 * the loop pauses off-screen and when the tab is hidden.
 */

type Fase = "zichtbaarheid" | "adverteren" | "website" | "data";

const FASE_META: Record<Fase, string> = {
  zichtbaarheid: "01 · Zichtbaarheid",
  adverteren: "02 · Adverteren",
  website: "03 · Website & shop",
  data: "04 · Data & automatisering",
};

type NodeDef = {
  label: string;
  dienst: string;
  href: string;
  fase: Fase;
  top: number; // % of field height (centre)
  col: number; // 0..1 across field width (left edge)
  icon: React.ReactNode;
};

const ICON = { size: 17, strokeWidth: 1.75 } as const;

const NODES: NodeDef[] = [
  { label: "SEO", dienst: "Gevonden worden in Google", href: "/diensten/seo", fase: "zichtbaarheid", top: 11, col: 0.22, icon: <Search {...ICON} /> },
  { label: "GEO", dienst: "Geciteerd worden door AI", href: "/diensten/geo", fase: "zichtbaarheid", top: 23, col: 0.54, icon: <Sparkles {...ICON} /> },
  { label: "Google Ads", dienst: "Direct bovenaan met SEA", href: "/diensten/sea", fase: "adverteren", top: 35, col: 0.1, icon: <Megaphone {...ICON} /> },
  { label: "Social", dienst: "Adverteren op Meta", href: "/diensten/social-advertising", fase: "adverteren", top: 46, col: 0.48, icon: <Share2 {...ICON} /> },
  { label: "Websites", dienst: "Een site die converteert", href: "/diensten/websites", fase: "website", top: 57, col: 0.14, icon: <Globe {...ICON} /> },
  { label: "Webshops", dienst: "Online verkopen", href: "/diensten/webshops", fase: "website", top: 68, col: 0.5, icon: <ShoppingBag {...ICON} /> },
  { label: "Tracking", dienst: "Meten wat werkt — GA4 & GTM", href: "/diensten/google-tag-manager", fase: "data", top: 80, col: 0.26, icon: <BarChart3 {...ICON} /> },
  { label: "Automatisering", dienst: "Terugkerend werk automatiseren", href: "/diensten/procesautomation", fase: "data", top: 91, col: 0.46, icon: <Workflow {...ICON} /> },
];

export default function ExperienceHero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const heartRef = useRef<HTMLSpanElement | null>(null);
  const nodeRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const baseRefs = useRef<(SVGPathElement | null)[]>([]);
  const flowRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const heart = heartRef.current;
    if (!root || !svg || !heart) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    type Item = {
      el: HTMLAnchorElement;
      base: SVGPathElement;
      flow: SVGPathElement;
      fase: Fase;
      len: number;
      seg: number;
      phase: number; // 0..1 position of the streak along the wire
      rate: number; // phase per ms
      flowing: boolean;
    };

    const items: Item[] = [];
    let running = true;
    let raf = 0;
    let last = performance.now();

    // Smooth cubic stream from a node (nx,ny) to the heart (hx,hy).
    function wirePath(nx: number, ny: number, hx: number, hy: number) {
      const k = (nx - hx) * 0.5;
      return `M ${nx},${ny} C ${nx - k},${ny} ${hx + k},${hy} ${hx},${hy}`;
    }

    function layout() {
      const rect = root.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("width", `${w}`);
      svg.setAttribute("height", `${h}`);

      const hr = heart.getBoundingClientRect();
      const hx = hr.left + hr.width / 2 - rect.left;
      const hy = hr.top + hr.height / 2 - rect.top;

      for (const it of items) {
        const nr = it.el.getBoundingClientRect();
        const nx = nr.left - rect.left - 6;
        const ny = nr.top + nr.height / 2 - rect.top;
        const d = wirePath(nx, ny, hx, hy);
        it.base.setAttribute("d", d);
        it.flow.setAttribute("d", d);
        it.len = it.base.getTotalLength();
        it.seg = Math.min(170, Math.max(90, it.len * 0.32));
        it.base.style.setProperty("--len", `${it.len}`);
        it.flow.style.strokeDasharray = `${it.seg} ${it.len}`;
      }
    }

    NODES.forEach((def, i) => {
      const el = nodeRefs.current[i];
      const base = baseRefs.current[i];
      const flow = flowRefs.current[i];
      if (!el || !base || !flow) return;
      items.push({
        el, base, flow, fase: def.fase,
        len: 0, seg: 0,
        phase: Math.random(), // de-sync the streaks
        rate: 0,
        flowing: true,
      });
    });

    layout();
    if (document.fonts?.ready) document.fonts.ready.then(() => layout());
    const relayoutTimers = [window.setTimeout(layout, 400), window.setTimeout(layout, 1300)];

    // place a streak along a wire by phase (0 = at node, 1 = arrived at heart)
    function place(it: Item) {
      it.flow.style.strokeDashoffset = `${it.seg - it.phase * (it.seg + it.len)}`;
    }

    function lightFase(fase: Fase | null) {
      root.classList.toggle("has-focus", !!fase);
      for (const it of items) {
        const on = !!fase && it.fase === fase;
        it.el.classList.toggle("is-lit", on);
        it.base.classList.toggle("is-lit", on);
        it.flow.classList.toggle("is-lit", on);
        // Hovering freezes every *other* fase; the hovered one keeps flowing.
        it.flowing = !fase || on;
      }
    }

    const cleanups: (() => void)[] = [];
    items.forEach((it) => {
      const enter = () => lightFase(it.fase);
      const leave = () => lightFase(null);
      it.el.addEventListener("pointerenter", enter);
      it.el.addEventListener("pointerleave", leave);
      it.el.addEventListener("focus", enter);
      it.el.addEventListener("blur", leave);
      cleanups.push(() => {
        it.el.removeEventListener("pointerenter", enter);
        it.el.removeEventListener("pointerleave", leave);
        it.el.removeEventListener("focus", enter);
        it.el.removeEventListener("blur", leave);
      });
    });

    // reduced motion: draw everything, park a streak mid-wire, no loop
    if (reduced) {
      items.forEach((it) => {
        it.base.classList.add("is-drawn");
        it.el.classList.add("is-shown");
        it.phase = 0.5;
        place(it);
      });
      root.classList.add("is-flowing");
      const ro = new ResizeObserver(() => { layout(); items.forEach(place); });
      ro.observe(root);
      return () => {
        ro.disconnect();
        relayoutTimers.forEach((t) => clearTimeout(t));
        cleanups.forEach((c) => c());
      };
    }

    // intro: draw wires + reveal nodes, then streaks start flowing
    const timers: number[] = [];
    items.forEach((it, i) => {
      timers.push(window.setTimeout(() => it.base.classList.add("is-drawn"), 120 + i * 70));
      timers.push(window.setTimeout(() => it.el.classList.add("is-shown"), 260 + i * 70));
    });
    timers.push(
      window.setTimeout(() => {
        items.forEach((it) => { it.rate = (0.55 + Math.random() * 0.1) / 1000; }); // ~1.7s per pass
        root.classList.add("is-flowing");
      }, 900)
    );

    function tick(now: number) {
      if (!running) return;
      const dt = Math.min(48, now - last);
      last = now;
      for (const it of items) {
        if (!it.len) continue;
        const rate = it.flowing ? (it.el.classList.contains("is-lit") ? it.rate * 1.5 : it.rate) : 0;
        if (rate) {
          it.phase += rate * dt;
          if (it.phase > 1) it.phase -= 1;
        }
        place(it);
      }
      raf = requestAnimationFrame(tick);
    }
    last = performance.now();
    raf = requestAnimationFrame(tick);

    let resizeRaf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(layout);
    });
    ro.observe(root);

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      } else if (!entry.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(root);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      timers.forEach((t) => clearTimeout(t));
      relayoutTimers.forEach((t) => clearTimeout(t));
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cleanups.forEach((c) => c());
    };
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
    <section ref={rootRef} data-bg-color="#F3EEE6" className="hero-wm hero-wm--light">
      <svg ref={svgRef} className="hartslag__draden" aria-hidden="true">
        <defs>
          <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F2D98C" />
            <stop offset="0.5" stopColor="#C4972A" />
            <stop offset="1" stopColor="#9A6E1F" />
          </linearGradient>
        </defs>
        <g className="wires__base">
          {NODES.map((n, i) => (
            <path
              key={n.label}
              className="wire"
              data-fase={n.fase}
              ref={(el) => { baseRefs.current[i] = el; }}
            />
          ))}
        </g>
        <g className="wires__flow">
          {NODES.map((n, i) => (
            <path
              key={n.label}
              className="wire-flow"
              data-fase={n.fase}
              ref={(el) => { flowRefs.current[i] = el; }}
            />
          ))}
        </g>
      </svg>

      <div className="veld" aria-hidden="false">
        {NODES.map((n, i) => (
          <a
            key={n.label}
            className={n.top < 26 ? "knoop knoop--tb" : "knoop"}
            data-fase={n.fase}
            href={n.href}
            style={{ top: `${n.top}%`, left: `${n.col * 100}%` }}
            ref={(el) => { nodeRefs.current[i] = el; }}
          >
            <span className="knoop__logo">{n.icon}</span>
            <span>{n.label}</span>
            <span className="knoop__tip">
              <span className="tip__fase">{FASE_META[n.fase]}</span>
              <span className="tip__dienst">{n.dienst}</span>
            </span>
          </a>
        ))}
      </div>

      <div className="hero-wm__content">
        <span className="hero-wm__kicker">Online marketing · Enschede</span>

        <h1 className="hero-wm__headline">
          Van ruis naar omzet
          <span className="hart" id="hart" ref={heartRef} aria-hidden="true">
            <span className="hart__ring" />
          </span>
        </h1>

        <p className="hero-wm__sub">
          SEO, ads, social, e-mail — allemaal losse signalen. LuminX maakt er
          één helder, meetbaar pad van. Van de eerste klik tot je omzet.
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

    </section>
  );
}
