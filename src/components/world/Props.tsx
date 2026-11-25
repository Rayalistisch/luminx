import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { height, type Site } from "./landscape";
import { mulberry32 } from "./noise";

// Yard life: the small things that make each place its own. Every prop is
// baked into one vertex-coloured geometry, so a whole tractor is one draw call.

type V3 = [number, number, number];
type Part = THREE.BufferGeometry;

function part(geo: THREE.BufferGeometry, pos: V3, color: string, rot?: V3, scale?: V3): Part {
  let g = geo.index ? geo.toNonIndexed() : geo;
  g = g.clone();
  if (scale) g.scale(...scale);
  if (rot) g.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
  g.translate(...pos);
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(arr, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute("uv");
  return g;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
const ico = (r: number, detail = 0) => new THREE.IcosahedronGeometry(r, detail);
const torus = (r: number, t: number) => new THREE.TorusGeometry(r, t, 5, 14);

/* ─── the catalogue ────────────────────────────────────────────────────── */
const BUILD: Record<string, () => Part[]> = {
  tractor: () => [
    part(box(1.4, 0.9, 2.4), [0, 1.0, 0.3], "#B8322A"),
    part(box(1.1, 0.7, 1.4), [0, 1.2, 1.5], "#C23B30"),
    part(box(1.5, 0.12, 1.5), [0, 2.5, -0.6], "#2B2320"),
    ...[[-0.65, -1.2], [0.65, -1.2], [-0.65, 0], [0.65, 0]].map(([x, z]) => part(box(0.08, 1.1, 0.08), [x, 1.95, -0.6 + (z ? 0.6 : 0)], "#2B2320")),
    part(cyl(0.95, 0.95, 0.45, 14), [-0.95, 0.95, -0.7], "#1E1A18", [0, 0, Math.PI / 2]),
    part(cyl(0.95, 0.95, 0.45, 14), [0.95, 0.95, -0.7], "#1E1A18", [0, 0, Math.PI / 2]),
    part(cyl(0.5, 0.5, 0.3, 12), [-0.8, 0.5, 1.7], "#1E1A18", [0, 0, Math.PI / 2]),
    part(cyl(0.5, 0.5, 0.3, 12), [0.8, 0.5, 1.7], "#1E1A18", [0, 0, Math.PI / 2]),
    part(cyl(0.45, 0.45, 0.47, 10), [-0.95, 0.95, -0.7], "#D8B04A", [0, 0, Math.PI / 2]),
    part(cyl(0.45, 0.45, 0.47, 10), [0.95, 0.95, -0.7], "#D8B04A", [0, 0, Math.PI / 2]),
    part(cyl(0.06, 0.06, 1.1), [0.35, 2.0, 1.6], "#2B2320"),
    part(box(0.5, 0.15, 0.5), [0, 1.55, -0.6], "#2B2320"),
  ],
  bike: () => [
    part(torus(0.34, 0.035), [0, 0.36, 0.55], "#1E1A18", [0, Math.PI / 2, 0]),
    part(torus(0.34, 0.035), [0, 0.36, -0.55], "#1E1A18", [0, Math.PI / 2, 0]),
    part(box(0.05, 0.05, 1.05), [0, 0.62, 0], "#2F5A44"),
    part(box(0.05, 0.5, 0.05), [0, 0.6, -0.25], "#2F5A44", [0.3, 0, 0]),
    part(box(0.05, 0.55, 0.05), [0, 0.62, 0.48], "#2F5A44", [-0.25, 0, 0]),
    part(box(0.5, 0.04, 0.04), [0, 0.9, 0.5], "#1E1A18"),
    part(box(0.16, 0.06, 0.28), [0, 0.9, -0.3], "#3A2A20"),
    part(box(0.36, 0.22, 0.3), [0, 0.8, -0.62], "#8A6446"),
  ],
  milkstand: () => [
    part(box(1.8, 0.1, 0.8), [0, 0.8, 0], "#8A6446"),
    ...[[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]].map(([x, z]) => part(box(0.1, 0.8, 0.1), [x, 0.4, z], "#5A4030")),
    ...[-0.55, 0, 0.55].map((x) => part(cyl(0.22, 0.25, 0.6, 10), [x, 1.15, 0], "#C9CED1")),
    ...[-0.55, 0, 0.55].map((x) => part(cyl(0.12, 0.2, 0.18, 10), [x, 1.54, 0], "#B5BABD")),
  ],
  coop: () => [
    part(box(2, 1.2, 1.4), [0, 0.9, 0], "#A9463A"),
    part(box(2.3, 0.1, 1.0), [0, 1.75, 0.3], "#5E4430", [0.5, 0, 0]),
    part(box(2.3, 0.1, 1.0), [0, 1.75, -0.3], "#5E4430", [-0.5, 0, 0]),
    ...[[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]].map(([x, z]) => part(box(0.1, 0.3, 0.1), [x, 0.15, z], "#5A4030")),
    part(box(0.4, 0.05, 1.2), [0.5, 0.45, 1.1], "#8A6446", [0.45, 0, 0]),
    part(box(0.4, 0.5, 0.05), [0.5, 0.8, 0.71], "#2B2320"),
  ],
  chickens: () => {
    const rng = mulberry32(4);
    return Array.from({ length: 7 }, () => {
      const x = (rng() - 0.5) * 4;
      const z = (rng() - 0.5) * 3;
      const c = rng() < 0.6 ? "#F4F0E8" : "#A0603A";
      return [
        part(ico(0.22, 0), [x, 0.25, z], c, undefined, [1.2, 0.9, 0.9]),
        part(ico(0.11, 0), [x + 0.22, 0.42, z], c),
        part(box(0.06, 0.08, 0.04), [x + 0.24, 0.55, z], "#D8484A"),
        part(box(0.06, 0.04, 0.04), [x + 0.34, 0.42, z], "#E8B53E"),
      ];
    }).flat();
  },
  veggies: () => {
    const out: Part[] = [part(box(6, 0.16, 4), [0, 0.06, 0], "#5A3E2E")];
    for (let r = 0; r < 5; r++) {
      out.push(part(box(5.6, 0.06, 0.18), [0, 0.16, -1.6 + r * 0.8 + 0.35], "#4A3226"));
      for (let k = 0; k < 7; k++) {
        const x = -2.5 + k * 0.82;
        const z = -1.6 + r * 0.8;
        if (r === 2) out.push(part(ico(0.26, 0), [x, 0.35, z], "#E07A2A", undefined, [1, 0.75, 1]));
        else out.push(part(ico(0.22, 0), [x, 0.3, z], r % 2 ? "#6F8F45" : "#8DA352"));
      }
    }
    return out;
  },
  flowers: () => {
    const rng = mulberry32(12);
    const cols = ["#D8484A", "#E8B53E", "#F4F0E8", "#C25B9C", "#E07A2A"];
    const out: Part[] = [part(box(3.2, 0.14, 1.4), [0, 0.06, 0], "#5A3E2E")];
    for (let i = 0; i < 26; i++) {
      out.push(part(ico(0.12, 0), [(rng() - 0.5) * 3, 0.3 + rng() * 0.1, (rng() - 0.5) * 1.2], cols[Math.floor(rng() * cols.length)]));
    }
    return out;
  },
  fruitTree: () => {
    const out: Part[] = [part(cyl(0.12, 0.16, 1.6, 6), [0, 0.8, 0], "#5A3F30"), part(ico(1.0, 1), [0, 2.1, 0], "#7F9A4A", undefined, [1, 0.85, 1])];
    const rng = mulberry32(21);
    for (let i = 0; i < 6; i++) {
      const a = rng() * Math.PI * 2;
      out.push(part(ico(0.11, 0), [Math.cos(a) * 0.9, 1.9 + rng() * 0.5, Math.sin(a) * 0.9], i % 2 ? "#C8352E" : "#E0A33E"));
    }
    return out;
  },
  picnic: () => [
    part(box(2.0, 0.08, 0.8), [0, 0.75, 0], "#8A6446"),
    part(box(2.0, 0.06, 0.3), [0, 0.45, 0.6], "#8A6446"),
    part(box(2.0, 0.06, 0.3), [0, 0.45, -0.6], "#8A6446"),
    part(box(0.08, 0.95, 1.6), [-0.8, 0.38, 0], "#5A4030", [0.5, 0, 0]),
    part(box(0.08, 0.95, 1.6), [0.8, 0.38, 0], "#5A4030", [-0.5, 0, 0]),
  ],
  beehives: () =>
    [-1.4, 0, 1.4].flatMap((x, i) => [
      part(box(0.7, 0.3, 0.6), [x, 0.15, 0], "#5A4030"),
      part(box(0.6, 0.35, 0.5), [x, 0.48, 0], i % 2 ? "#F1E7D6" : "#E8C266"),
      part(box(0.6, 0.35, 0.5), [x, 0.84, 0], i % 2 ? "#E8C266" : "#F1E7D6"),
      part(box(0.75, 0.08, 0.65), [x, 1.06, 0], "#4A3A34"),
    ]),
  sacks: () => {
    const out: Part[] = [];
    const rng = mulberry32(3);
    for (let r = 0; r < 3; r++) {
      for (let k = 0; k < 4 - r; k++) {
        out.push(part(ico(0.35, 1), [(k - (3 - r) / 2) * 0.62, 0.28 + r * 0.42, (rng() - 0.5) * 0.1], "#E6DCC6", undefined, [0.95, 0.65, 0.7]));
      }
    }
    return out;
  },
  cart: () => [
    part(box(1.4, 0.4, 2.2), [0, 0.9, 0], "#8A6446"),
    part(cyl(0.6, 0.6, 0.12, 12), [-0.78, 0.6, 0.1], "#3A2A20", [0, 0, Math.PI / 2]),
    part(cyl(0.6, 0.6, 0.12, 12), [0.78, 0.6, 0.1], "#3A2A20", [0, 0, Math.PI / 2]),
    part(box(0.08, 0.08, 1.5), [-0.45, 0.75, -1.7], "#5A4030", [-0.2, 0, 0]),
    part(box(0.08, 0.08, 1.5), [0.45, 0.75, -1.7], "#5A4030", [-0.2, 0, 0]),
    part(ico(0.3, 1), [-0.3, 1.3, 0.4], "#E6DCC6", undefined, [1, 0.7, 0.8]),
    part(ico(0.3, 1), [0.3, 1.3, -0.3], "#E6DCC6", undefined, [1, 0.7, 0.8]),
  ],
  pallets: () => {
    const out: Part[] = [];
    for (let s = 0; s < 3; s++) {
      out.push(part(box(1.2, 0.14, 1.0), [s * 1.4 - 1.4, 0.07, 0], "#B48A5A"));
      const n = 1 + (s % 3);
      for (let k = 0; k < n; k++) out.push(part(box(1.0, 0.6, 0.85), [s * 1.4 - 1.4, 0.45 + k * 0.62, 0], k % 2 ? "#C99A62" : "#A87C4F"));
    }
    return out;
  },
  forklift: () => [
    part(box(1.1, 0.7, 1.8), [0, 0.65, 0], "#E3B23C"),
    part(box(1.0, 0.08, 1.0), [0, 2.0, -0.2], "#2B2320"),
    ...[[-0.45, -0.6], [0.45, -0.6], [-0.45, 0.3], [0.45, 0.3]].map(([x, z]) => part(box(0.07, 1.3, 0.07), [x, 1.4, z - 0.1], "#2B2320")),
    part(box(0.12, 2.4, 0.12), [-0.4, 1.2, 1.0], "#3B3330"),
    part(box(0.12, 2.4, 0.12), [0.4, 1.2, 1.0], "#3B3330"),
    part(box(0.12, 0.06, 1.1), [-0.3, 0.12, 1.55], "#3B3330"),
    part(box(0.12, 0.06, 1.1), [0.3, 0.12, 1.55], "#3B3330"),
    ...[[-0.55, -0.6], [0.55, -0.6], [-0.55, 0.6], [0.55, 0.6]].map(([x, z]) => part(cyl(0.3, 0.3, 0.2, 10), [x, 0.3, z], "#1E1A18", [0, 0, Math.PI / 2])),
  ],
  van: () => [
    part(box(1.9, 1.7, 4.6), [0, 1.25, 0], "#F1EDE3"),
    part(box(1.85, 0.9, 0.9), [0, 1.6, 2.1], "#2E333B"),
    part(box(1.95, 0.25, 4.65), [0, 0.55, 0], "#C21F2E"),
    ...[[-0.9, 1.5], [0.9, 1.5], [-0.9, -1.4], [0.9, -1.4]].map(([x, z]) => part(cyl(0.36, 0.36, 0.25, 10), [x, 0.36, z], "#1E1A18", [0, 0, Math.PI / 2])),
  ],
  parcels: () => {
    const rng = mulberry32(8);
    return Array.from({ length: 6 }, (_, i) => part(box(0.5 + rng() * 0.3, 0.4 + rng() * 0.3, 0.5), [(i % 3) * 0.7 - 0.7, 0.25 + Math.floor(i / 3) * 0.55, rng() * 0.2], i % 2 ? "#C99A62" : "#D4A96F", [0, rng(), 0]));
  },
  bikeRack: () => [
    ...[-1.2, -0.4, 0.4, 1.2].map((x) => part(torus(0.35, 0.04), [x, 0.4, 0], "#9DA2A6", [0, Math.PI / 2, 0], [1, 1, 0.6])),
    part(box(3.0, 0.06, 0.06), [0, 0.1, 0], "#9DA2A6"),
  ],
  container: () => {
    const out: Part[] = [part(box(2.4, 2.5, 6), [0, 1.25, 0], "#2E6E8E")];
    for (let z = -2.8; z <= 2.8; z += 0.4) {
      out.push(part(box(2.46, 2.3, 0.08), [0, 1.25, z], "#28617E"));
    }
    out.push(part(box(2.3, 2.3, 0.05), [0, 1.25, 3.02], "#245873"));
    return out;
  },
  truck: () => [
    part(box(2.3, 2.2, 2.0), [0, 1.6, 4.0], "#F1EDE3"),
    part(box(2.2, 0.9, 0.08), [0, 2.1, 5.02], "#2E333B"),
    part(box(2.4, 2.8, 7.0), [0, 2.0, -0.6], "#D9D3C7"),
    part(box(2.42, 0.4, 7.02), [0, 2.9, -0.6], "#C21F2E"),
    ...[[-1.1, 4.0], [1.1, 4.0], [-1.1, -2.6], [1.1, -2.6], [-1.1, -1.4], [1.1, -1.4]].map(([x, z]) => part(cyl(0.5, 0.5, 0.3, 10), [x, 0.5, z], "#1E1A18", [0, 0, Math.PI / 2])),
  ],
  textileRolls: () => {
    const cols = ["#E8B5C2", "#F1E7D6", "#6E8FB0", "#D8484A", "#E8C266", "#9FB07C"];
    const out: Part[] = [part(box(2.6, 0.14, 1.6), [0, 0.07, 0], "#B48A5A")];
    for (let r = 0; r < 2; r++) {
      for (let k = 0; k < 4 - r; k++) {
        out.push(part(cyl(0.32, 0.32, 1.5, 12), [(k - (3 - r) / 2) * 0.66, 0.46 + r * 0.56, 0], cols[(k + r * 3) % cols.length], [Math.PI / 2, 0, 0]));
      }
    }
    return out;
  },
  pond: () => {
    const out: Part[] = [part(cyl(3.2, 3.4, 0.2, 18), [0, 0.0, 0], "#7A8A52"), part(cyl(2.8, 2.8, 0.06, 18), [0, 0.13, 0], "#3E6E78")];
    const rng = mulberry32(17);
    for (let i = 0; i < 6; i++) {
      const a = rng() * Math.PI * 2;
      const r = rng() * 2.2;
      out.push(part(cyl(0.3, 0.3, 0.02, 8), [Math.cos(a) * r, 0.18, Math.sin(a) * r], "#5E8F48"));
    }
    for (const [x, z, c] of [[0.6, -0.4, "#F4F0E8"], [-0.9, 0.8, "#8A6446"], [1.4, 0.9, "#F4F0E8"]] as const) {
      out.push(part(ico(0.2, 0), [x, 0.27, z], c, undefined, [1.3, 0.8, 0.9]));
      out.push(part(ico(0.1, 0), [x + 0.22, 0.42, z], c === "#8A6446" ? "#3E6E4A" : c));
      out.push(part(box(0.1, 0.04, 0.06), [x + 0.33, 0.4, z], "#E8B53E"));
    }
    for (let i = 0; i < 14; i++) {
      const a = rng() * Math.PI * 2;
      out.push(part(cyl(0.03, 0.06, 1.1, 4), [Math.cos(a) * 3.0, 0.55, Math.sin(a) * 3.0], "#B9A35C"));
    }
    return out;
  },
  picket: () => {
    const out: Part[] = [part(box(5, 0.08, 0.06), [0, 0.55, 0], "#F1ECE2"), part(box(5, 0.08, 0.06), [0, 0.25, 0], "#F1ECE2")];
    for (let x = -2.4; x <= 2.41; x += 0.4) out.push(part(box(0.1, 0.8, 0.05), [x, 0.4, 0.04], "#F4F1EA"));
    return out;
  },
};

const geoCache = new Map<string, THREE.BufferGeometry>();
function propGeometry(type: string) {
  let g = geoCache.get(type);
  if (!g) {
    g = mergeGeometries(BUILD[type]())!;
    g.computeVertexNormals();
    geoCache.set(type, g);
  }
  return g;
}

let sharedMat: THREE.MeshStandardMaterial | null = null;
const propMaterial = () => (sharedMat ??= new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 }));

export type YardItem = [type: keyof typeof BUILD, lx: number, lz: number, r?: number];

/** Props placed in a place's own frame (local x/z, rotated with the building). */
export function Yard({ site, rot, items }: { site: Site; rot: number; items: YardItem[] }) {
  const placed = useMemo(
    () => items.map(([type, lx, lz, r = 0]) => {
      const x = site.x + lx * Math.cos(rot) + lz * Math.sin(rot);
      const z = site.z - lx * Math.sin(rot) + lz * Math.cos(rot);
      return { type, x, y: height(x, z), z, r: rot + r };
    }),
    [site, rot, items],
  );
  return (
    <group>
      {placed.map((p, i) => (
        <mesh key={i} geometry={propGeometry(p.type)} material={propMaterial()} position={[p.x, p.y, p.z]} rotation={[0, p.r, 0]} castShadow receiveShadow />
      ))}
    </group>
  );
}
