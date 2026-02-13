(() => {
  window.dataLayer = window.dataLayer || [];

  function pushEvent(eventName, payload = {}) {
    window.dataLayer.push({
      event: eventName,
      page_path: window.location.pathname,
      page_title: document.title,
      ...payload,
    });
  }

  // Expose helper for other scripts (e.g. form submit)
  window.luminxTrack = pushEvent;

  const ctaSelector = [
    "[data-overlay-open]",
    ".cta-button",
    ".footer-contact-cta",
    ".nav-cta",
    ".mobile-menu-cta",
    ".about-cta",
    ".service-primary-link",
    ".service-secondary-link",
  ].join(",");

  document.addEventListener("click", (event) => {
    const target = event.target?.closest?.(ctaSelector);
    if (!target) return;

    const label =
      target.getAttribute("data-track-label") ||
      target.getAttribute("aria-label") ||
      target.textContent?.replace(/\s+/g, " ").trim() ||
      "unknown";

    const section = target.closest("section")?.id || "global";

    pushEvent("cta_click", {
      cta_label: label,
      cta_section: section,
    });
  });
})();
