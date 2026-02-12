(() => {
  const overlay = document.getElementById("contact-overlay");
  if (!overlay) return;

  const closeBtn = overlay.querySelector("[data-overlay-close]");
  const form = document.getElementById("contact-form");
  const success = document.getElementById("form-success");

  function open() {
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  // All triggers
  document.querySelectorAll("[data-overlay-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  });

  // Close button
  closeBtn?.addEventListener("click", close);

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      close();
    }
  });

  // Form submit
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    form.style.display = "none";
    success?.classList.add("is-visible");
  });
})();
