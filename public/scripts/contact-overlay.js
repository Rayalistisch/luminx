(() => {
  const overlay = document.getElementById("contact-overlay");
  if (!overlay) return;

  const closeBtn = overlay.querySelector("[data-overlay-close]");
  const form = document.getElementById("contact-form");
  const success = document.getElementById("form-success");
  const error = document.getElementById("form-error");
  const submitBtn = form?.querySelector('button[type="submit"]');
  const submitText = submitBtn?.querySelector(".form-submit-text");
  const defaultSubmitLabel = submitText?.textContent || "Verstuur Bericht";

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

  // Form submit (real email delivery via FormSubmit)
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    error?.classList.remove("is-visible");

    if (!form.action) return;

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = "Versturen...";

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Form submit failed");

      if (typeof window.luminxTrack === "function") {
        window.luminxTrack("contact_submit", {
          form_id: "contact-form",
        });
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "contact_submit",
          form_id: "contact-form",
          page_path: window.location.pathname,
          page_title: document.title,
        });
      }

      form.style.display = "none";
      success?.classList.add("is-visible");
    } catch (_err) {
      error?.classList.add("is-visible");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = defaultSubmitLabel;
    }
  });
})();
