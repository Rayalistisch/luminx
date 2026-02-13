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
  const navLinks = document.querySelector(".nav-links");
  const navActiveIndicator = document.querySelector(".nav-active-indicator");
  let navWasScrolled = false;
  let navIndicatorReady = false;
  let indicatorX = 0;
  let indicatorW = 0;
  const sectionLinkMap = [];

  function getIndicatorMetrics() {
    if (!navLinks || !navActiveIndicator) return null;
    const linksRect = navLinks.getBoundingClientRect();
    const indicatorRect = navActiveIndicator.getBoundingClientRect();
    return {
      x: indicatorRect.left - linksRect.left,
      w: indicatorRect.width,
    };
  }

  function setIndicatorPosition(x, w) {
    if (!navActiveIndicator) return;
    navActiveIndicator.style.left = `${x}px`;
    navActiveIndicator.style.width = `${w}px`;
    indicatorX = x;
    indicatorW = w;
  }

  function animateElasticIndicator(fromX, fromW, toX, toW) {
    if (!navActiveIndicator) return;

    const distance = Math.abs(toX - fromX);
    const overshoot = Math.min(26, 8 + distance * 0.14);
    const movingRight = toX >= fromX;

    const fromRight = fromX + fromW;
    const toRight = toX + toW;

    const stretchLeft = movingRight ? fromX : Math.min(toX - overshoot, fromX);
    const stretchRight = movingRight ? Math.max(toRight + overshoot, fromRight) : fromRight;
    const stretchWidth = Math.max(0, stretchRight - stretchLeft);

    navActiveIndicator.animate(
      [
        { left: `${fromX}px`, width: `${fromW}px`, offset: 0, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
        { left: `${stretchLeft}px`, width: `${stretchWidth}px`, offset: 0.52, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        { left: `${toX}px`, width: `${toW}px`, offset: 1 },
      ],
      {
        duration: 460,
        fill: "forwards",
        easing: "linear",
      }
    );
  }

  function moveNavIndicator(link, immediate = false) {
    if (!navLinks || !navActiveIndicator || !link) return;

    const linksRect = navLinks.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const targetW = linkRect.width * 0.6;
    const targetX = linkRect.left - linksRect.left + (linkRect.width - targetW) / 2;

    if (!navIndicatorReady || immediate) {
      navActiveIndicator.getAnimations().forEach((anim) => anim.cancel());
      setIndicatorPosition(targetX, targetW);
      navIndicatorReady = true;
      return;
    }

    const liveMetrics = getIndicatorMetrics();
    const fromX = liveMetrics ? liveMetrics.x : indicatorX;
    const fromW = liveMetrics ? liveMetrics.w : indicatorW;

    navActiveIndicator.getAnimations().forEach((anim) => anim.cancel());
    setIndicatorPosition(fromX, fromW);
    animateElasticIndicator(fromX, fromW, targetX, targetW);

    indicatorX = targetX;
    indicatorW = targetW;
  }

  function setActiveLink(link, options = {}) {
    const { immediate = false } = options;
    if (link) moveNavIndicator(link, immediate);
    navLinkEls.forEach((l) => l.classList.remove("active"));
    if (link) {
      link.classList.add("active");
    }
  }

  function initNavIndicator() {
    if (!navLinkEls.length) return;
    setActiveLink(navLinkEls[0], { immediate: true });

    navLinkEls.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) {
        const target = document.querySelector(href);
        if (target) {
          sectionLinkMap.push({ link, target });
        }
      }
    });

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

  function updateNavFromState(scrolled) {
    if (!nav) return;
    if (scrolled === navWasScrolled) return;

    if (scrolled) {
      nav.classList.add("nav--scrolled");
      const activeLink = document.querySelector(".nav-links a.active");
      if (activeLink) {
        requestAnimationFrame(() => moveNavIndicator(activeLink, true));
      }
    } else {
      nav.classList.remove("nav--scrolled");
    }

    navWasScrolled = scrolled;
  }

  // Cache hero-background reference
  const heroBackground = document.querySelector(".hero-background");

  function update() {
    // ---- READ PHASE (all layout reads first, no DOM writes) ----
    const active = getActiveSection();
    const bg = getVisibleBackground(active);
    const scrolled = window.scrollY > 80;
    const scrollY = window.scrollY;

    // Read active link bounding rects before any writes
    let scrollSyncLink = null;
    if (sectionLinkMap.length) {
      const triggerY = window.innerHeight * 0.28;
      let current = sectionLinkMap[0];
      sectionLinkMap.forEach((item) => {
        const rect = item.target.getBoundingClientRect();
        if (rect.top <= triggerY) current = item;
      });
      const currentActive = document.querySelector(".nav-links a.active");
      if (current?.link && currentActive !== current.link) {
        scrollSyncLink = current.link;
      }
    }

    // ---- WRITE PHASE (all DOM mutations after reads) ----
    applyTheme(bg);
    updateNavFromState(scrolled);
    if (scrollSyncLink) setActiveLink(scrollSyncLink);

    if (heroBackground) {
      heroBackground.style.transform = `translateY(${scrollY * 0.5}px)`;
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
        const activeLink = document.querySelector(".nav-links a.active");
        if (activeLink) moveNavIndicator(activeLink, true);
        update();
      });

      window.addEventListener("load", () => {
        const activeLink = document.querySelector(".nav-links a.active");
        if (activeLink) moveNavIndicator(activeLink, true);
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
