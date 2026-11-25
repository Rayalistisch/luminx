// The shape of "Lichtland Twente": rolling essen, a sandy lane, field patchwork,
// hedgerows (houtwallen) and the spots where landmarks stand.
import * as THREE from "three";
import { fbm, hash2, mulberry32 } from "./noise";

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ─── Road ─────────────────────────────────────────────────────────────── */
/** Centre of the inhabited land; the camera and the horizon ridges orbit this. */
export const LAND_C = { x: 6, z: -52 };
const landDist = (x: number, z: number) => Math.hypot((x - LAND_C.x) * 0.9, z - LAND_C.z);

const ROAD_CTRL: [number, number][] = [
  [6, 200], [12, 145], [4, 98], [-14, 58], [-6, 20], [16, -18], [8, -60], [-10, -100], [2, -134],
];
const roadCurve = new THREE.CatmullRomCurve3(
  ROAD_CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  "centripetal",
);
export const ROAD_PTS = roadCurve.getSpacedPoints(520);

const RB = ROAD_PTS.reduce(
  (b, p) => ({
    minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x),
    minZ: Math.min(b.minZ, p.z), maxZ: Math.max(b.maxZ, p.z),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
);

let nearestIdx = -1;
/** Distance to the lane; also stores the nearest sample index in `nearestIdx`. */
export function roadDist(x: number, z: number): number {
  if (x < RB.minX - 24 || x > RB.maxX + 24 || z < RB.minZ - 24 || z > RB.maxZ + 24) {
    nearestIdx = -1;
    return 1e9;
  }
  // coarse pass over every 8th sample, then refine around the best one
  let m = Infinity;
  let mi = 0;
  for (let i = 0; i < ROAD_PTS.length; i += 8) {
    const p = ROAD_PTS[i];
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < m) { m = d; mi = i; }
  }
  const lo = Math.max(0, mi - 10);
  const hi = Math.min(ROAD_PTS.length - 1, mi + 10);
  for (let i = lo; i <= hi; i++) {
    const p = ROAD_PTS[i];
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < m) { m = d; mi = i; }
  }
  nearestIdx = mi;
  return Math.sqrt(m);
}

/* ─── Terrain ──────────────────────────────────────────────────────────── */
export function rawHeight(x: number, z: number): number {
  const n = fbm(x * 0.009 + 7.3, z * 0.009 - 3.1, 4) - 0.5;
  const detail = fbm(x * 0.045 + 1.7, z * 0.045 + 9.2, 2) - 0.5;
  let h = n * 26 + detail * 1.8;
  // distant ridges frame the horizon (Tankenberg-ish, but gentler)
  const dc = landDist(x, z);
  const far = smoothstep(150, 290, dc);
  h += far * (fbm(x * 0.016 + 21, z * 0.016 - 4, 3) * 34 - 6);
  return h;
}

const rawRoad = ROAD_PTS.map((p) => rawHeight(p.x, p.z));
export const ROAD_H = rawRoad.map((_, i) => {
  let s = 0;
  let n = 0;
  for (let k = -16; k <= 16; k++) {
    const j = i + k;
    if (j >= 0 && j < rawRoad.length) { s += rawRoad[j]; n++; }
  }
  return s / n;
});

export type Site = { x: number; z: number; r: number; h: number };
const site = (x: number, z: number, r: number): Site => ({ x, z, r, h: 0 });

export const SITES = {
  windmill: site(-52, 26, 8),
  mill: site(80, -10, 18),
  home: site(4, -154, 18),
  projects: [site(-70, -42, 11), site(62, -66, 11), site(-60, -112, 11), site(80, -122, 11)],
};
/** Twente on the horizon: not clickable, but unmistakable. */
export const FAR = {
  stadium: site(150, -226, 64),
  skyline: site(254, -168, 26),
  brewery: site(-182, -226, 26),
  basilica: site(-58, -292, 16),
  village: site(52, -298, 22),
  /** Enschede's Oude Markt in winter: behind you when you open Diensten. */
  oudemarkt: site(-62, 152, 48),
};
const ALL_SITES: Site[] = [SITES.windmill, SITES.mill, SITES.home, ...SITES.projects, ...Object.values(FAR)];
for (const s of ALL_SITES) {
  roadDist(s.x, s.z);
  const d = roadDist(s.x, s.z);
  const base = rawHeight(s.x, s.z);
  s.h = nearestIdx >= 0 && d < 20 ? lerp(base, ROAD_H[nearestIdx], 1 - smoothstep(s.r, 20, d)) : base;
}

/* ─── side paths: every yard has its own sandy track to the lane ──── */
export type Path = { pts: THREE.Vector3[]; h: number[]; box?: { minX: number; maxX: number; minZ: number; maxZ: number } };
export const PATHS: Path[] = [SITES.windmill, SITES.mill, ...SITES.projects, SITES.home].map((s) => {
  // full search: yards can sit well outside the lane's quick-reject box
  let ri = 0;
  let best = Infinity;
  ROAD_PTS.forEach((q, i) => {
    const d = (q.x - s.x) ** 2 + (q.z - s.z) ** 2;
    if (d < best) { best = d; ri = i; }
  });
  const r = ROAD_PTS[ri];
  const dx = r.x - s.x;
  const dz = r.z - s.z;
  const len = Math.hypot(dx, dz);
  // start at the edge of the yard, bend gently on the way to the lane
  const start = new THREE.Vector3(s.x + (dx / len) * s.r * 0.55, 0, s.z + (dz / len) * s.r * 0.55);
  const mid = new THREE.Vector3((start.x + r.x) / 2 + (dz / len) * len * 0.12, 0, (start.z + r.z) / 2 - (dx / len) * len * 0.12);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, new THREE.Vector3(r.x, 0, r.z));
  const n = Math.max(8, Math.round(len / 1.2));
  const pts = curve.getSpacedPoints(n);
  const h = pts.map((_, i) => lerp(s.h, ROAD_H[ri], smoothstep(0, 1, i / n)));
  const box = pts.reduce(
    (b, p) => ({ minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x), minZ: Math.min(b.minZ, p.z), maxZ: Math.max(b.maxZ, p.z) }),
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
  );
  return { pts, h, box };
});
const PB = PATHS.flatMap((p) => p.pts).reduce(
  (b, p) => ({ minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x), minZ: Math.min(b.minZ, p.z), maxZ: Math.max(b.maxZ, p.z) }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
);
let pathH = 0;
export function pathDist(x: number, z: number): number {
  if (x < PB.minX - 10 || x > PB.maxX + 10 || z < PB.minZ - 10 || z > PB.maxZ + 10) return 1e9;
  let m = Infinity;
  for (const p of PATHS) {
    const b = p.box!;
    // skip whole paths that can't be near this point
    if (x < b.minX - 10 || x > b.maxX + 10 || z < b.minZ - 10 || z > b.maxZ + 10) continue;
    for (let i = 0; i < p.pts.length; i++) {
      const q = p.pts[i];
      const d = (q.x - x) ** 2 + (q.z - z) ** 2;
      if (d < m) { m = d; pathH = p.h[i]; }
    }
  }
  return Math.sqrt(m);
}

function baseHeight(x: number, z: number): number {
  let h = rawHeight(x, z);
  const d = roadDist(x, z);
  if (nearestIdx >= 0) {
    const m = 1 - smoothstep(2.6, 15, d);
    h = lerp(h, ROAD_H[nearestIdx], m);
  }
  const pd = pathDist(x, z);
  if (pd < 8) h = lerp(h, pathH, 1 - smoothstep(1.4, 8, pd));
  for (const s of ALL_SITES) {
    const ds = Math.hypot(x - s.x, z - s.z);
    if (ds < s.r + 14) h = lerp(h, s.h, 1 - smoothstep(s.r, s.r + 14, ds));
  }
  return h;
}

/* ─── The beek: a stream meandering across the land ───────────────── */
const STREAM_CTRL: [number, number][] = [
  [-280, 80], [-190, 56], [-122, 30], [-84, 12], [-40, 6], [-8, -2], [22, 10], [52, 30], [100, 32], [150, 40], [280, 64],
];
const streamCurve = new THREE.CatmullRomCurve3(
  STREAM_CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  "centripetal",
);
export const STREAM_PTS = streamCurve.getSpacedPoints(700);
const SB = STREAM_PTS.reduce(
  (b, p) => ({
    minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x),
    minZ: Math.min(b.minZ, p.z), maxZ: Math.max(b.maxZ, p.z),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
);
let streamIdx = -1;
export function streamDist(x: number, z: number): number {
  if (x < SB.minX - 16 || x > SB.maxX + 16 || z < SB.minZ - 16 || z > SB.maxZ + 16) {
    streamIdx = -1;
    return 1e9;
  }
  let m = Infinity;
  let mi = 0;
  // coarse pass, then refine around the best coarse sample
  for (let i = 0; i < STREAM_PTS.length; i += 8) {
    const p = STREAM_PTS[i];
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < m) { m = d; mi = i; }
  }
  const lo = Math.max(0, mi - 10);
  const hi = Math.min(STREAM_PTS.length - 1, mi + 10);
  for (let i = lo; i <= hi; i++) {
    const p = STREAM_PTS[i];
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < m) { m = d; mi = i; }
  }
  streamIdx = mi;
  return Math.sqrt(m);
}

const rawStream = STREAM_PTS.map((p) => baseHeight(p.x, p.z));
/** Water level along the beek: smoothed, and always a little below the banks. */
export const STREAM_H = rawStream.map((_, i) => {
  let s = 0;
  let n = 0;
  let lo = Infinity;
  for (let k = -24; k <= 24; k++) {
    const j = i + k;
    if (j >= 0 && j < rawStream.length) { s += rawStream[j]; n++; lo = Math.min(lo, rawStream[j]); }
  }
  return Math.min(s / n, lo + 0.6) - 0.9;
});

/** Where the lane crosses the beek: the bridge goes here. */
export const BRIDGE = (() => {
  let best = 0;
  let m = Infinity;
  STREAM_PTS.forEach((p, i) => {
    const d = roadDist(p.x, p.z);
    if (d < m) { m = d; best = i; }
  });
  const p = STREAM_PTS[best];
  roadDist(p.x, p.z);
  const ri = nearestIdx;
  const a = ROAD_PTS[Math.max(0, ri - 1)];
  const b = ROAD_PTS[Math.min(ROAD_PTS.length - 1, ri + 1)];
  return { x: ROAD_PTS[ri].x, z: ROAD_PTS[ri].z, y: ROAD_H[ri], angle: Math.atan2(b.x - a.x, b.z - a.z) };
})();

export function height(x: number, z: number): number {
  const h = baseHeight(x, z);
  const d = streamDist(x, z);
  if (streamIdx < 0 || d > 12) return h;
  const bed = STREAM_H[streamIdx] - 1.8;
  return Math.min(h, lerp(bed, h, smoothstep(3.4, 12, d)));
}

/* ─── Field patchwork ─────────────────────────────────────────────────── */
const ANG = 0.38;
const CA = Math.cos(ANG);
const SA = Math.sin(ANG);
const FIELD_U = 26;
const FIELD_V = 19;

const FIELD_COLORS = [
  "#E4B467", // ripe wheat
  "#D9A257", // golden stubble
  "#C7B26A", // straw
  "#A6AE5D", // young grass
  "#8FA453", // meadow
  "#7D9750", // deep meadow
  "#C2865B", // ploughed, rosy in the low sun
  "#B07254", // ploughed, darker
].map((c) => new THREE.Color(c));
const VERGE = new THREE.Color("#9FAE5C");
const BANK = new THREE.Color("#76994E");
const SNOW = new THREE.Color("#F4F1EC");

/* ─── snow showers: a few places where winter has already arrived ──── */
export const SNOW_ZONES: { x: number; z: number; r: number; cloud?: boolean }[] = [
  { x: -128, z: -150, r: 52 },
  { x: 150, z: -40, r: 44 },
  { x: -20, z: -238, r: 60 },
  // the Oude Markt sits in a wide, fully snowed-in stretch of land
  { x: -62, z: 152, r: 105, cloud: false },
  { x: -62, z: 152, r: 42, cloud: false },
];
/** 0..1, how snowed-over the ground is here (soft, noisy edges). */
export function snowAmount(x: number, z: number) {
  let a = 0;
  for (const zn of SNOW_ZONES) {
    const d = Math.hypot(x - zn.x, z - zn.z) / zn.r;
    if (d < 1.3) a = Math.max(a, 1 - smoothstep(0.72, 1.2, d + (fbm(x * 0.06, z * 0.06, 2) - 0.5) * 0.4));
  }
  return a;
}
const YARD = new THREE.Color("#A9B266");
const FOREST_FLOOR = new THREE.Color("#6E7D49");

/** 0-2 = wheat / stubble / straw, 3-5 = meadow, 6-7 = ploughed. */
export function fieldType(x: number, z: number): number {
  const u = x * CA - z * SA;
  const v = x * SA + z * CA;
  const h = hash2(Math.floor(u / FIELD_U) + 91, Math.floor(v / FIELD_V) - 37);
  return Math.floor(h * FIELD_COLORS.length) % FIELD_COLORS.length;
}

/** Is this spot open ground: away from lane, beek, yards and (optionally) trees? */
export function isOpenGround(x: number, z: number, margin = 3) {
  if (roadDist(x, z) < 6 + margin) return false;
  if (pathDist(x, z) < 3 + margin) return false;
  if (streamDist(x, z) < 6 + margin) return false;
  for (const s of ALL_SITES) if (Math.hypot(x - s.x, z - s.z) < s.r + 4 + margin) return false;
  return true;
}

export function fieldColor(x: number, z: number, out: THREE.Color): THREE.Color {
  const u = x * CA - z * SA;
  const v = x * SA + z * CA;
  const cu = Math.floor(u / FIELD_U);
  const cv = Math.floor(v / FIELD_V);
  const h = hash2(cu + 91, cv - 37);
  out.copy(FIELD_COLORS[Math.floor(h * FIELD_COLORS.length) % FIELD_COLORS.length]);

  const dc = landDist(x, z);
  if (dc > 175) out.lerp(FOREST_FLOOR, smoothstep(175, 260, dc) * 0.85);

  const rd = roadDist(x, z);
  if (rd < 7) out.lerp(VERGE, 1 - smoothstep(4, 7, rd));
  const sd = streamDist(x, z);
  if (sd < 10) out.lerp(BANK, 1 - smoothstep(3, 10, sd));
  for (const s of ALL_SITES) {
    const ds = Math.hypot(x - s.x, z - s.z);
    if (ds < s.r + 4) out.lerp(YARD, 1 - smoothstep(s.r - 2, s.r + 4, ds));
  }
  // snow last, so it covers yards, verges and banks alike
  const sn = snowAmount(x, z);
  if (sn > 0) out.lerp(SNOW, sn * 0.95);
  return out;
}

/* ─── Trees ───────────────────────────────────────────────────────────── */
export type TreeData = { x: number; y: number; z: number; s: number; rot: number; seed: number };

/* ─── Places you can visit, and how the camera frames each one ────────
   az = angle around the place (0 = looking from +z), el = elevation (rad). */
export function faceRoad(x: number, z: number) {
  let best = ROAD_PTS[0];
  let m = Infinity;
  for (const p of ROAD_PTS) {
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < m) { m = d; best = p; }
  }
  return Math.atan2(best.x - x, best.z - z);
}

export const ROT = {
  windmill: -0.3,
  mill: -0.95,
  home: 0.06,
  projects: SITES.projects.map((s) => faceRoad(s.x, s.z)),
};

export type View = { x: number; y: number; z: number; az: number; el: number; dist: number };
export type PlaceView = View & { labelY: number };

export const OVERVIEW: View = { x: LAND_C.x, y: 6, z: LAND_C.z, az: -0.22, el: 0.4, dist: 230 };
/** Half-extent of the inhabited land in x (with margin), used to fit any screen. */
export const LAND_HALF_W = 120;
/** Half-extent in depth (z), for tall/narrow screens. */
export const LAND_HALF_D = 100;
export const DIST_LIMITS = { min: 70, max: 380 };

export const PROJECT_IDS = ["dg-rubber", "gsm-team", "reservax", "ascendio"] as const;

export const PLACE_VIEWS: Record<string, PlaceView> = {
  marketing: { x: SITES.windmill.x, y: SITES.windmill.h + 8.5, z: SITES.windmill.z, az: ROT.windmill + 0.35, el: 0.26, dist: 60, labelY: SITES.windmill.h + 19.5 },
  techniek: { x: SITES.mill.x, y: SITES.mill.h + 11, z: SITES.mill.z, az: ROT.mill + 0.3, el: 0.26, dist: 92, labelY: SITES.mill.h + 33 },
  luminx: { x: SITES.home.x, y: SITES.home.h + 5, z: SITES.home.z, az: ROT.home + 0.4, el: 0.2, dist: 54, labelY: SITES.home.h + 14.5 },
};
SITES.projects.forEach((s, i) => {
  const tall = PROJECT_IDS[i] === "ascendio";
  PLACE_VIEWS[PROJECT_IDS[i]] = { x: s.x, y: s.h + (tall ? 6 : 3.5), z: s.z, az: ROT.projects[i] + [0.5, -0.6, 0.5, 0.65][i], el: 0.26, dist: tall ? 50 : 42, labelY: s.h + 8.5 };
});

/** Views that belong to menu sheets rather than clickable places. */
PLACE_VIEWS.oudemarkt = { x: FAR.oudemarkt.x, y: FAR.oudemarkt.h + 9, z: FAR.oudemarkt.z + 4, az: Math.PI + 0.32, el: 0.42, dist: 118, labelY: 0 };

export function viewCamera(v: View, out = new THREE.Vector3()) {
  return out.set(
    v.x + Math.sin(v.az) * Math.cos(v.el) * v.dist,
    v.y + Math.sin(v.el) * v.dist,
    v.z + Math.cos(v.az) * Math.cos(v.el) * v.dist,
  );
}

// Keep the sightline from each close-up camera to its place free of trees.
export const CLEAR_SPOTS: [number, number, number][] = [];
for (const v of Object.values(PLACE_VIEWS)) {
  const c = viewCamera(v);
  for (let f = 0.15; f <= 1.001; f += 0.15) {
    CLEAR_SPOTS.push([v.x + (c.x - v.x) * f, v.z + (c.z - v.z) * f, 9 + f * 7]);
  }
}

const treeCache = new Map<number, ReturnType<typeof makeTrees>>();
export function buildTrees(max: number) {
  let t = treeCache.get(max);
  if (!t) { t = makeTrees(max); treeCache.set(max, t); }
  return t;
}

function makeTrees(max: number) {
  const rng = mulberry32(20261125);
  const round: TreeData[] = [];
  const pine: TreeData[] = [];

  const ok = (x: number, z: number) => {
    if (landDist(x, z) > 280) return false;
    if (roadDist(x, z) < 6.5) return false;
    if (streamDist(x, z) < 6) return false;
    if (pathDist(x, z) < 3.5) return false;
    for (const s of ALL_SITES) if (Math.hypot(x - s.x, z - s.z) < s.r + 6) return false;
    for (const [cx, cz, r] of CLEAR_SPOTS) if (Math.hypot(x - cx, z - cz) < r) return false;
    return true;
  };
  const push = (list: TreeData[], x: number, z: number, s: number) => {
    list.push({ x, z, y: height(x, z), s, rot: rng() * Math.PI * 2, seed: rng() });
  };

  // hedgerows (houtwallen) along field edges
  const along = (fixed: number, isU: boolean, size: number) => {
    for (let t = -270; t < 270; t += 3.3) {
      const seg = hash2(Math.floor(fixed / size) * 7 + (isU ? 3 : 11), Math.floor(t / 42));
      if (seg < 0.6) continue;
      if (rng() < 0.4) continue;
      const u = isU ? fixed + (rng() - 0.5) * 1.6 : t;
      const v = isU ? t : fixed + (rng() - 0.5) * 1.6;
      const x = u * CA + v * SA;
      const z = -u * SA + v * CA;
      if (ok(x, z)) push(rng() < 0.1 ? pine : round, x, z, 0.8 + rng() * 0.6);
    }
  };
  for (let k = -11; k <= 11; k++) along(k * FIELD_U, true, FIELD_U);
  for (let k = -15; k <= 15; k++) along(k * FIELD_V, false, FIELD_V);

  // woods (bosjes) where a slow noise says so, denser towards the ridges
  for (let i = 0; i < 16000; i++) {
    const x = (rng() - 0.5) * 520;
    const z = (rng() - 0.5) * 520 - 20;
    const dc = landDist(x, z);
    const n = fbm(x * 0.018 + 40, z * 0.018 - 12, 3) + smoothstep(140, 230, dc) * 0.06;
    if (n < 0.665) continue;
    if (!ok(x, z)) continue;
    push(rng() < 0.45 ? pine : round, x, z, 0.9 + rng() * 0.8);
  }

  const total = round.length + pine.length;
  if (total > max) {
    const keep = max / total;
    const thin = (l: TreeData[]) => l.filter((t) => t.seed < keep);
    return { round: thin(round), pine: thin(pine) };
  }
  return { round, pine };
}
