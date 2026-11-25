import * as THREE from "three";

/** Mutable, render-loop friendly state shared between the page and the scene. */
export const world = {
  /** Place currently opened, or null for the overview. */
  focus: null as string | null,
  /** Place under the pointer. */
  hover: null as string | null,
  /** 0 = golden hour, 1 = evening with the lights on. */
  duskTarget: 0,
  dusk: 0,
  px: 0,
  py: 0,
  reduced: false,
  mobile: false,
  lastInteraction: 0,
  /** Which side the open panel sits on (the camera frames the land on the other side). */
  panelSide: "right" as "left" | "right",
  /** A content sheet from the menu is open. */
  sheet: false,
  target: new THREE.Vector3(),
};

export const dusk = () => world.dusk;

/* ─── page ⇄ scene events ───────────────────────────────────────────── */
export const EV_SELECT = "lx:select";
export const EV_DUSK = "lx:dusk";
export const EV_ZOOM = "lx:zoom";
/** Move the camera for a menu sheet without opening a place panel. */
export const EV_VIEW = "lx:view";

export function select(id: string | null) {
  window.dispatchEvent(new CustomEvent(EV_SELECT, { detail: { id } }));
}
