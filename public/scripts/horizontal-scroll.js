(() => {
  const section = document.querySelector(".hs-section");
  if (!section) return;

  const sticky = section.querySelector(".hs-sticky");
  const track = section.querySelector(".hs-track");
  const progressBar = section.querySelector(".hs-progress-bar");
  const panels = section.querySelectorAll(".hs-panel");

  if (!sticky || !track || !panels.length) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  let ticking = false;
  let currentPanelColor = null;

  function updatePanelColor(activePanel) {
    if (!activePanel) return;
    const color = activePanel.getAttribute("data-bg-color");
    if (color && color !== currentPanelColor) {
      currentPanelColor = color;
      section.setAttribute("data-bg-color", color);
    }
  }

  // --- Desktop: vertical scroll → horizontal translate ---
  function updateDesktop() {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollDistance = sectionHeight - viewportHeight;

    if (scrollDistance <= 0) return;

    const scrolled = window.scrollY - sectionTop;
    const progress = Math.max(0, Math.min(1, scrolled / scrollDistance));

    const trackWidth = track.scrollWidth;
    const maxTranslate = trackWidth - window.innerWidth;
    track.style.transform = `translate3d(${-progress * maxTranslate}px, 0, 0)`;

    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }

    const viewportCenter = window.innerWidth / 2;
    let closestPanel = null;
    let closestDist = Infinity;

    panels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      const center = rect.left + rect.width / 2;

      if (center > -100 && center < window.innerWidth + 200) {
        panel.classList.add("is-visible");
      }

      const dist = Math.abs(center - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestPanel = panel;
      }
    });

    updatePanelColor(closestPanel);
  }

  // --- Mobile: native horizontal scroll with scroll-snap ---
  function updateMobile() {
    const scrollLeft = sticky.scrollLeft;
    const maxScroll = sticky.scrollWidth - sticky.clientWidth;

    if (maxScroll <= 0) return;

    const progress = Math.max(0, Math.min(1, scrollLeft / maxScroll));

    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }

    const viewportCenter = window.innerWidth / 2;
    let closestPanel = null;
    let closestDist = Infinity;

    panels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      const center = rect.left + rect.width / 2;

      if (center > -100 && center < window.innerWidth + 200) {
        panel.classList.add("is-visible");
      }

      const dist = Math.abs(center - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestPanel = panel;
      }
    });

    updatePanelColor(closestPanel);
  }

  function onWindowScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateDesktop();
        ticking = false;
      });
      ticking = true;
    }
  }

  function onContainerScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateMobile();
        ticking = false;
      });
      ticking = true;
    }
  }

  if (isMobile) {
    sticky.addEventListener("scroll", onContainerScroll, { passive: true });
    panels.forEach((p) => p.classList.add("is-visible"));
    updateMobile();
  } else {
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    updateDesktop();
  }
})();
