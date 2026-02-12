(() => {
  const dot = document.querySelector(".cursor");
  const ring = document.querySelector(".cursor-follower");
  if (!dot || !ring) return;

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
  });

  // Faster lerp: 0.15 → snappy but still smooth
  function tick() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(tick);
  }
  tick();

  // Grow ring on interactive elements
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a, button, [data-overlay-open], [data-overlay-close], input, textarea")) {
      dot.classList.add("cursor--active");
      ring.classList.add("cursor-follower--active");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a, button, [data-overlay-open], [data-overlay-close], input, textarea")) {
      dot.classList.remove("cursor--active");
      ring.classList.remove("cursor-follower--active");
    }
  });
})();
