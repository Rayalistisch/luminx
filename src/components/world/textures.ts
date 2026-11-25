import * as THREE from "three";
import { mulberry32 } from "./noise";

// Hand-made, procedural materials: brickwork, pantiles, thatch, planks,
// windows with glazing bars. One texture repeat = TEX_UNIT world units.

export const TEX_UNIT = 1.6;

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number) => void;

function canvasTexture(size: number, paint: Paint, seed = 1, srgb = true) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  paint(ctx, size, size, mulberry32(seed));
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.repeat.set(1 / TEX_UNIT, 1 / TEX_UNIT);
  return t;
}

const shade = (hex: string, amt: number) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return `#${c.getHexString()}`;
};

/* ─── brick (wildverband-ish running bond) ────────────────────────── */
function brick(palette: string[], mortar: string, seed: number) {
  return canvasTexture(256, (ctx, W, H, rnd) => {
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, W, H);
    const rows = 16;
    const rh = H / rows;
    const bw = W / 5;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let x = -bw; x < W + bw; x += bw) {
        const col = palette[Math.floor(rnd() * palette.length)];
        ctx.fillStyle = shade(col, (rnd() - 0.5) * 0.06);
        ctx.fillRect(x + off + 1.5, r * rh + 1.5, bw - 3, rh - 3);
        // a little burnt edge on some bricks
        if (rnd() < 0.25) {
          ctx.fillStyle = "rgba(40,10,10,0.18)";
          ctx.fillRect(x + off + 1.5, r * rh + rh - 4, bw - 3, 2.5);
        }
      }
    }
  }, seed);
}

/* ─── red pantiles (oude holle pannen), courses run along U ─────────── */
function pantiles(base: string, seed: number) {
  return canvasTexture(256, (ctx, W, H, rnd) => {
    const courses = 8;
    const cw = W / courses;
    const th = H / 8;
    for (let c = 0; c < courses; c++) {
      for (let y = 0; y < H; y += th) {
        const g = ctx.createLinearGradient(0, y, 0, y + th);
        const col = shade(base, (rnd() - 0.5) * 0.08);
        g.addColorStop(0, shade(col, 0.1));
        g.addColorStop(0.45, col);
        g.addColorStop(1, shade(col, -0.16));
        ctx.fillStyle = g;
        ctx.fillRect(c * cw, y, cw, th);
      }
      // overlap shadow where the next course laps over
      ctx.fillStyle = "rgba(30,8,4,0.35)";
      ctx.fillRect(c * cw + cw - 4, 0, 4, H);
    }
    // moss and age
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = rnd() < 0.5 ? "rgba(90,100,40,0.12)" : "rgba(20,10,5,0.08)";
      ctx.fillRect(rnd() * W, rnd() * H, 3 + rnd() * 6, 2 + rnd() * 4);
    }
  }, seed);
}

/* ─── thatch: layered reed, streaks running down the slope (along U) ─ */
function thatch(seed: number) {
  return canvasTexture(256, (ctx, W, H, rnd) => {
    ctx.fillStyle = "#8A6642";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) {
      const y = rnd() * H;
      const len = 20 + rnd() * 60;
      ctx.strokeStyle = rnd() < 0.5 ? `rgba(196,160,104,${0.25 + rnd() * 0.3})` : `rgba(70,48,28,${0.2 + rnd() * 0.3})`;
      ctx.lineWidth = 1 + rnd() * 1.4;
      const x = rnd() * W;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (rnd() - 0.5) * 3);
      ctx.stroke();
    }
    // the layering bands where each course of reed is bound
    for (let x = 0; x < W; x += 64) {
      const g = ctx.createLinearGradient(x, 0, x + 14, 0);
      g.addColorStop(0, "rgba(40,24,12,0.45)");
      g.addColorStop(1, "rgba(40,24,12,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 14, H);
    }
  }, seed);
}

/* ─── vertical planks ──────────────────────────────────────────────── */
function planks(base: string, seed: number, brace = false) {
  return canvasTexture(256, (ctx, W, H, rnd) => {
    const n = 8;
    const pw = W / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = shade(base, (rnd() - 0.5) * 0.07);
      ctx.fillRect(i * pw, 0, pw, H);
      for (let k = 0; k < 6; k++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.05 + rnd() * 0.07})`;
        ctx.lineWidth = 1;
        const x = i * pw + rnd() * pw;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (rnd() - 0.5) * 4, H);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(i * pw, 0, 2.5, H);
    }
    if (brace) {
      ctx.strokeStyle = shade(base, 0.08);
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(0, H * 0.12); ctx.lineTo(W, H * 0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H * 0.88); ctx.lineTo(W, H * 0.88); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H * 0.88); ctx.lineTo(W, H * 0.12); ctx.stroke();
    }
  }, seed);
}

/* ─── standing-seam zinc ───────────────────────────────────────────── */
function zinc() {
  return canvasTexture(128, (ctx, W, H, rnd) => {
    ctx.fillStyle = "#6A6E70";
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 16) {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(0, y, W, 2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, y + 2, W, 2);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = "rgba(120,140,140,0.12)";
      ctx.fillRect(rnd() * W, rnd() * H, 8 + rnd() * 20, 3);
    }
  }, 5);
}

/* ─── klinkers: herringbone paving for the stoep ───────────────────── */
function paving() {
  return canvasTexture(128, (ctx, W, H, rnd) => {
    ctx.fillStyle = "#6B4A3C";
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 16) {
      for (let x = 0; x < W; x += 16) {
        ctx.fillStyle = shade(rnd() < 0.5 ? "#9C5B45" : "#8A4F3D", (rnd() - 0.5) * 0.08);
        if (((x + y) / 16) % 2) ctx.fillRect(x + 1, y + 1, 30, 14);
        else ctx.fillRect(x + 1, y + 1, 14, 30);
      }
    }
  }, 9);
}

/* ─── windows: glazing bars (roedes), glass that glows at night ───── */
function windowTextures() {
  const paint = (glow: boolean): Paint => (ctx, W, H) => {
    // frame
    ctx.fillStyle = glow ? "#000" : "#F2EADB";
    ctx.fillRect(0, 0, W, H);
    const pad = W * 0.1;
    const cols = 2;
    const rows = 3;
    const bar = W * 0.05;
    const pw = (W - pad * 2 - bar * (cols - 1)) / cols;
    const ph = (H - pad * 2 - bar * (rows - 1)) / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = pad + c * (pw + bar);
        const y = pad + r * (ph + bar);
        if (glow) {
          const g = ctx.createLinearGradient(x, y, x, y + ph);
          g.addColorStop(0, "#FFE2A8");
          g.addColorStop(1, "#FFB25C");
          ctx.fillStyle = g;
        } else {
          const g = ctx.createLinearGradient(x, y, x + pw, y + ph);
          g.addColorStop(0, "#5D6E78");
          g.addColorStop(0.5, "#2A3640");
          g.addColorStop(1, "#1C242C");
          ctx.fillStyle = g;
        }
        ctx.fillRect(x, y, pw, ph);
        if (!glow) {
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.beginPath();
          ctx.moveTo(x, y + ph * 0.6);
          ctx.lineTo(x + pw * 0.6, y);
          ctx.lineTo(x + pw * 0.85, y);
          ctx.lineTo(x, y + ph * 0.9);
          ctx.fill();
        }
      }
    }
  };
  const map = canvasTexture(128, paint(false));
  const emissive = canvasTexture(128, paint(true));
  for (const t of [map, emissive]) t.repeat.set(1, 1);
  return { map, emissive };
}

/* ─── Twentse luiken: hourglass (zandloper) in green and white ─────── */
function shutter() {
  const t = canvasTexture(128, (ctx, W, H) => {
    ctx.fillStyle = "#F2EADB";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2F5A44";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W / 2, H / 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(W / 2, H / 2); ctx.fill();
    ctx.strokeStyle = "#2F5A44";
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, W, H);
  });
  t.repeat.set(1, 1);
  return t;
}

/* ─── molenroeden: the lattice with sail cloth ────────────────────── */
function sailLattice() {
  const t = canvasTexture(256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(240,230,210,0.96)";
    ctx.fillRect(W * 0.08, H * 0.04, W * 0.84, H * 0.62);
    ctx.strokeStyle = "#4A3328";
    ctx.lineWidth = 7;
    ctx.strokeRect(W * 0.06, 4, W * 0.88, H - 8);
    ctx.lineWidth = 4;
    for (let y = 0; y <= H; y += H / 12) {
      ctx.beginPath(); ctx.moveTo(W * 0.06, y); ctx.lineTo(W * 0.94, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, H); ctx.stroke();
  }, 3);
  t.repeat.set(1, 1);
  return t;
}

/* ─── materials ────────────────────────────────────────────────────── */
let cache: ReturnType<typeof build> | null = null;
function build() {
  const std = (map: THREE.Texture, rough = 0.9, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0, ...extra });
  const win = windowTextures();
  const tex = {
    brick: brick(["#A9473A", "#9C3F33", "#B5553F", "#8F3A30", "#A04A3C"], "#D9C6AE", 11),
    brickDark: brick(["#7A3129", "#6E2C25", "#84382D", "#5F2621"], "#BCA58D", 12),
    brickWarm: brick(["#C0603F", "#B4583C", "#CC7048", "#A9503A"], "#E3D2BB", 13),
    brickChimney: brick(["#9A4434", "#8C3D30", "#A34B38"], "#CDB79E", 14),
    tiles: pantiles("#B04A30", 21),
    tilesDark: pantiles("#6E4A44", 22),
    thatch: thatch(31),
    wood: planks("#4A3226", 41),
    woodLight: planks("#8A6446", 42),
    weathered: planks("#7D6A58", 43),
    doorGreen: planks("#2F5A44", 44, true),
    zinc: zinc(),
    paving: paving(),
  };
  // roofs: courses run along the slope (U), rotate so tiles read right
  const sail = sailLattice();
  const shutterTex = shutter();
  return {
    tex,
    brick: std(tex.brick),
    brickDark: std(tex.brickDark),
    brickWarm: std(tex.brickWarm),
    brickChimney: std(tex.brickChimney),
    tiles: std(tex.tiles, 0.7),
    tilesDark: std(tex.tilesDark, 0.75),
    thatch: std(tex.thatch, 1),
    wood: std(tex.wood),
    woodLight: std(tex.woodLight),
    weathered: std(tex.weathered),
    door: std(tex.doorGreen, 0.8),
    zinc: std(tex.zinc, 0.45, { metalness: 0.25 }),
    paving: std(tex.paving, 0.95),
    shutter: std(shutterTex, 0.8),
    sail: new THREE.MeshStandardMaterial({ map: sail, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 }),
    windowMap: win.map,
    windowEmissive: win.emissive,
  };
}
export function materials() {
  cache ??= build();
  return cache;
}

/** A clone of a material whose texture wraps a cylinder/cone of the given size. */
export function wrapMaterial(base: THREE.MeshStandardMaterial, circumference: number, height: number) {
  const m = base.clone();
  if (base.map) {
    m.map = base.map.clone();
    m.map.repeat.set(circumference / TEX_UNIT, height / TEX_UNIT);
    m.map.needsUpdate = true;
  }
  return m;
}

/** Box geometry whose UVs are in world units, so textures keep a true scale. */
const boxCache = new Map<string, THREE.BoxGeometry>();
export function worldBox(w: number, h: number, d: number) {
  const key = `${w}|${h}|${d}`;
  let g = boxCache.get(key);
  if (g) return g;
  g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // faces: +x, -x, +y, -y, +z, -z (4 vertices each)
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  uv.needsUpdate = true;
  boxCache.set(key, g);
  return g;
}
