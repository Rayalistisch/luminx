import * as THREE from "three";
import { materials } from "./textures";

const cache = new Map<string, THREE.MeshStandardMaterial>();
/** Shared flat-shaded material per colour, so a farm is a handful of programs, not dozens. */
export function mat(color: string, roughness = 0.92): THREE.MeshStandardMaterial {
  const key = `${color}|${roughness}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, flatShading: true });
    cache.set(key, m);
  }
  return m;
}

/** Window glass: dark by day, warm lamplight as the evening falls. */
export const windowMat = new THREE.MeshStandardMaterial({
  color: "#2b1810",
  emissive: new THREE.Color("#ffad4d"),
  emissiveIntensity: 0.3,
  roughness: 0.45,
});

/** Extra glass materials that should glow with the windows at dusk. */
export const glowMats = new Set<THREE.MeshStandardMaterial>();

/** Lanterns and beacons. */
export const lampMat = new THREE.MeshStandardMaterial({
  color: "#3a2616",
  emissive: new THREE.Color("#ffcf86"),
  emissiveIntensity: 1,
  roughness: 0.4,
});

export const skyUniforms = {
  uTop: { value: new THREE.Color() },
  uMid: { value: new THREE.Color() },
  uHorizon: { value: new THREE.Color() },
  uSunColor: { value: new THREE.Color() },
  uSunDir: { value: new THREE.Vector3(-0.7, 0.2, -0.65).normalize() },
  uStars: { value: 0 },
  uTime: { value: 0 },
};

/* windows get real glazing bars; only the panes glow at night */
{
  const t = materials();
  windowMat.color.set("#ffffff");
  windowMat.map = t.windowMap;
  windowMat.emissive.set("#ffffff");
  windowMat.emissiveMap = t.windowEmissive;
  windowMat.userData.fit = true;
  windowMat.polygonOffset = true;
  windowMat.polygonOffsetFactor = -1;
  windowMat.polygonOffsetUnits = -1;
  t.shutter.userData.fit = true;
  t.door.userData.fit = true;
  windowMat.needsUpdate = true;
}
