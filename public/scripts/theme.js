(() => {
  // -------------------------
  // Helpers
  // -------------------------
  function isTransparent(bg) {
    if (!bg) return true;
    if (bg === "transparent") return true;
    if (bg.startsWith("rgba")) {
      const parts = bg.match(/\d+(\.\d+)?/g);
      const a = parts && parts.length >= 4 ? Number(parts[3]) : 1;
      return a === 0;
    }
    return false;
  }

  function parseToRGB(color) {
    if (!color) return null;

    if (color.startsWith("rgb")) {
      const parts = color.match(/\d+(\.\d+)?/g);
      if (!parts || parts.length < 3) return null;
      return { r: +parts[0], g: +parts[1], b: +parts[2] };
    }

    if (color.startsWith("#")) {
      const hex = color.replace("#", "").trim();
      if (hex.length !== 6) return null;
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }

    return null;
  }

  function complementaryRGB(color) {
    const rgb = parseToRGB(color);
    if (!rgb) return null;
    return { r: 255 - rgb.r, g: 255 - rgb.g, b: 255 - rgb.b };
  }

  function isLightColor(color) {
    const rgb = parseToRGB(color);
    if (!rgb) return false;
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 155;
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function lerpRGB(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  // Resolve the BODY colour a section wants to project, or null to mean
  // "keep whatever colour is currently active" (transparent / opted-out).
  function colorForSection(node) {
    if (!node) return null;
    if (node.hasAttribute("data-bg-ignore")) return null;
    const attr = node.getAttribute?.("data-bg-color");
    if (attr) return attr;
    const computed = getComputedStyle(node).backgroundColor;
    if (!isTransparent(computed)) return computed;
    return null;
  }

  // -------------------------
  // Vars for your CSS tints
  // -------------------------
  function setComplementVars(bgColor) {
    const comp = complementaryRGB(bgColor);
    if (!comp) return;

    document.documentElement.style.setProperty("--comp-rgb", `${comp.r}, ${comp.g}, ${comp.b}`);

    const light = isLightColor(bgColor);
    document.documentElement.style.setProperty("--comp-a", light ? "0.18" : "0.26");
    document.documentElement.style.setProperty("--comp-a-strong", light ? "0.26" : "0.34");
  }

  // -------------------------
  // IMPORTANT: Let CSS control nav (blend-mode)
  // This removes inline overrides that break the menu styling
  // -------------------------
  function resetNavInlineStyles() {
    document.querySelectorAll(".logo, .nav-cta").forEach((el) => {
      el.style.color = "";
      el.style.borderColor = "";
      el.style.backgroundColor = "";
    });
  }

  // -------------------------
  // Section detection
  // -------------------------
  function getActiveSection() {
    const nodes = document.querySelectorAll("section, footer");
    if (!nodes.length) return null;

    // Trigger line at 25% from the top of the viewport.
    // The active section is the last section whose top has scrolled past this line.
    const triggerY = window.innerHeight * 0.08;
    let best = null;

    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.top <= triggerY) {
        best = node;
      }
    });

    return best;
  }

  function getVisibleBackground(node) {
    if (!node) return getComputedStyle(document.body).backgroundColor;

    // data-bg-ignore: section opts out of body background changes.
    if (node.hasAttribute("data-bg-ignore")) {
      return currentBg || getComputedStyle(document.body).backgroundColor;
    }

    // data-bg-color takes priority: it defines the desired BODY color,
    // which can differ from the section's own CSS background.
    const attrBg = node.getAttribute?.("data-bg-color");
    if (attrBg) return attrBg;

    const computedBg = getComputedStyle(node).backgroundColor;
    if (!isTransparent(computedBg)) return computedBg;

    return getComputedStyle(document.body).backgroundColor;
  }

  // -------------------------
  // Apply theme (NO nav color changes here)
  // -------------------------
  let currentBg = null;

  function applyTheme(bgColor) {
    if (!bgColor) return;
    if (currentBg === bgColor) return;
    currentBg = bgColor;

    // Background + tint vars
    document.body.style.backgroundColor = bgColor;
    setComplementVars(bgColor);

    // Keep nav clean: CSS does blend-mode work
    resetNavInlineStyles();
  }

  // -------------------------
  // Reveal animations
  // -------------------------
  function initReveal() {
    const els = document.querySelectorAll(
      ".section-header, .grid-item, .feature-card, .stat-item, .full-image-section, .om-card"
    );
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));
  }

  // -------------------------
  // Optional: set --img-url on each grid item for the multi-color comp overlay
  // (Only needed if your CSS uses background-image: var(--img-url) on .grid-item::after)
  // -------------------------
  function initGridImageVars() {
    document.querySelectorAll(".grid-item").forEach((item) => {
      const img = item.querySelector("img.grid-item-image");
      const src = img?.getAttribute("src");
      if (src) item.style.setProperty("--img-url", `url("${src}")`);
    });
  }

  // -------------------------
  // Update loop
  // -------------------------
  // -------------------------
  // Nav scroll state
  // -------------------------
  let nav = null;
  let navWasScrolled = false;


  // Mobile menu toggle
  function initMobileMenu() {
    const burger = document.querySelector(".nav-burger");
    const mobileLinks = document.querySelectorAll(".mobile-menu a");
    if (!burger || !nav) return;

    burger.addEventListener("click", () => {
      nav.classList.toggle("menu-open");
      document.body.style.overflow = nav.classList.contains("menu-open") ? "hidden" : "";
    });

    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("menu-open");
        document.body.style.overflow = "";
      });
    });

    var dienstenToggle = document.querySelector(".mobile-diensten-toggle");
    var dienstenSub = document.querySelector(".mobile-diensten-sub");
    if (dienstenToggle && dienstenSub) {
      dienstenToggle.addEventListener("click", function () {
        dienstenToggle.classList.toggle("is-open");
        dienstenSub.classList.toggle("is-open");
      });
    }
  }

  function updateNavFromState(scrolled) {
    if (!nav) return;
    if (scrolled === navWasScrolled) return;

    if (scrolled) {
      nav.classList.add("nav--scrolled");
    } else {
      nav.classList.remove("nav--scrolled");
    }

    navWasScrolled = scrolled;
  }

  // Cache hero-background reference
  const heroBackground = document.querySelector(".hero-background");

  let lastActiveIndex = -1;

  function update() {
    const triggerY = window.innerHeight * 0.08;
    const nodes = Array.from(document.querySelectorAll("section, footer"));
    const scrollY = window.scrollY;

    // Active = the section that spans the trigger line (top above it, bottom
    // below it). This ignores zero-height / fixed overlay panels (e.g. the
    // WhatsApp or contact overlays) that sit at top:0 and would otherwise win a
    // naive "last top past the line" test and paint the body their own colour.
    let activeIndex = -1;
    for (let i = 0; i < nodes.length; i++) {
      const r = nodes[i].getBoundingClientRect();
      if (r.height > 1 && r.top <= triggerY && r.bottom > triggerY) {
        activeIndex = i;
        break;
      }
    }
    // Fallback (gaps / very top / very bottom): last real section past the line.
    if (activeIndex === -1) {
      for (let i = 0; i < nodes.length; i++) {
        const r = nodes[i].getBoundingClientRect();
        if (r.height > 1 && r.top <= triggerY) activeIndex = i;
      }
    }

    // Active colour — walk back over transparent / opted-out sections.
    let activeColor = null;
    for (let i = activeIndex; i >= 0; i--) {
      const c = colorForSection(nodes[i]);
      if (c) { activeColor = c; break; }
    }
    if (!activeColor) activeColor = currentBg || getComputedStyle(document.body).backgroundColor;

    // Next colour ahead + its top, for the cross-fade.
    let nextColor = null;
    let nextTop = null;
    for (let i = activeIndex + 1; i < nodes.length; i++) {
      const c = colorForSection(nodes[i]);
      if (c) { nextColor = c; nextTop = nodes[i].getBoundingClientRect().top; break; }
    }

    // Blend toward the next section over the last ~65% of a viewport before its
    // top reaches the trigger line — a slow, scroll-linked overvloei.
    let bg = activeColor;
    const A = parseToRGB(activeColor);
    const B = nextColor ? parseToRGB(nextColor) : null;
    if (A && B && nextTop != null) {
      const start = window.innerHeight * 0.65;
      const t = clamp((start - nextTop) / (start - triggerY), 0, 1);
      const c = lerpRGB(A, B, t);
      bg = `rgb(${c.r}, ${c.g}, ${c.b})`;
    }

    document.body.style.backgroundColor = bg;
    currentBg = bg;
    setComplementVars(bg);

    // Heavier per-section reset only when the active section actually changes.
    if (activeIndex !== lastActiveIndex) {
      lastActiveIndex = activeIndex;
      resetNavInlineStyles();
    }

    // Nav contrast follows the *blended* colour, so it flips mid-transition.
    if (nav) {
      if (isLightColor(bg)) nav.classList.add("nav--light-bg");
      else nav.classList.remove("nav--light-bg");
    }

    updateNavFromState(scrollY > 80);

    if (heroBackground) {
      heroBackground.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
  }

  function init() {
    try {
      nav = document.querySelector(".site-nav");

      // Make sure nav isn't nuked by previous inline styles
      resetNavInlineStyles();

      initReveal();
      initGridImageVars();
      initMobileMenu();
      update();

      let ticking = false;
      window.addEventListener("scroll", () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            update();
            ticking = false;
          });
          ticking = true;
        }
      });

      window.addEventListener("resize", () => {
        initGridImageVars();
        update();
      });
    } catch (e) {
      // fallback: show all
      document
        .querySelectorAll(".section-header, .grid-item, .feature-card, .stat-item, .full-image-section, .om-card")
        .forEach((el) => el.classList.add("visible"));
      console.error("[theme.js] crashed:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
