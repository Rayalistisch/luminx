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
    document.querySelectorAll(".logo, .nav-links a, .nav-cta").forEach((el) => {
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
    const triggerY = window.innerHeight * 0.25;
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
      ".section-header, .grid-item, .feature-card, .stat-item, .full-image-section"
    );
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
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
  const nav = document.querySelector("nav");
  const navLinkEls = document.querySelectorAll(".nav-links a");

  function setActiveLink(link) {
    navLinkEls.forEach((l) => l.classList.remove("active"));
    if (link) link.classList.add("active");
  }

  function initNavIndicator() {
    if (!navLinkEls.length) return;
    setActiveLink(navLinkEls[0]);

    navLinkEls.forEach((link) => {
      link.addEventListener("click", () => setActiveLink(link));
    });
  }

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
  }

  function updateNav() {
    if (!nav) return;
    const scrolled = window.scrollY > 80;

    if (scrolled) {
      nav.classList.add("nav--scrolled");
    } else {
      nav.classList.remove("nav--scrolled");
    }
  }

  function update() {
    const active = getActiveSection();
    const bg = getVisibleBackground(active);
    applyTheme(bg);
    updateNav();

    // Parallax (let op: transform op hero-background kan soms blend-mode beïnvloeden
    // maar omdat nav niet op hero-background zit, is dit meestal ok)
    const heroBackground = document.querySelector(".hero-background");
    if (heroBackground) {
      heroBackground.style.transform = `translateY(${window.scrollY * 0.5}px)`;
    }
  }

  function init() {
    try {
      // Make sure nav isn't nuked by previous inline styles
      resetNavInlineStyles();

      initReveal();
      initGridImageVars();
      initNavIndicator();
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
        .querySelectorAll(".section-header, .grid-item, .feature-card, .stat-item, .full-image-section")
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