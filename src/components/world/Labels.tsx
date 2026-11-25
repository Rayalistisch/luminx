import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PLACES } from "./content";
import { world } from "./store";

/** A small note that follows the cursor while it rests on a place. */
export function HoverTip() {
  const last = useRef<string | null>(null);

  useEffect(() => {
    const tip = document.querySelector<HTMLElement>("[data-tip]");
    if (!tip) return;
    const move = (e: PointerEvent) => {
      tip.style.transform = `translate3d(${e.clientX + 18}px, ${e.clientY + 20}px, 0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useFrame(() => {
    const id = world.focus === world.hover ? null : world.hover;
    if (id === last.current) return;
    last.current = id;
    const tip = document.querySelector<HTMLElement>("[data-tip]");
    if (!tip) return;
    const place = PLACES.find((p) => p.id === id);
    if (place) {
      tip.querySelector("strong")!.textContent = place.pin;
      tip.querySelector("[data-tip-sub]")!.textContent = place.pinSub;
    }
    tip.classList.toggle("is-on", !!place);
  });

  return null;
}
