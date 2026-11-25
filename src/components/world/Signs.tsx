import { useEffect, useMemo } from "react";
import * as THREE from "three";

// Lettering that belongs to the buildings: painted boards, chimney letters,
// names laid in glazed roof tiles. Drawn to canvas in the brand typefaces.

const DISPLAY = '"Bricolage Grotesque", "Figtree", system-ui, sans-serif';
const BODY = '"Figtree", system-ui, sans-serif';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function useCanvasTexture(w: number, h: number, draw: Draw, pixel = false) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (pixel) {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
    }
    return t;
  }, [w, h, pixel]);

  useEffect(() => {
    const paint = () => {
      const canvas = texture.image as HTMLCanvasElement;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h);
      texture.needsUpdate = true;
    };
    paint();
    // repaint once the brand fonts are in
    Promise.all([
      document.fonts.load(`700 64px "Bricolage Grotesque"`),
      document.fonts.load(`800 64px "Figtree"`),
    ]).then(paint, paint);
  }, [texture, draw, w, h]);

  return texture;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, maxW: number, maxH: number, spacing = 0) {
  let size = maxH;
  ctx.font = font(size);
  const measure = () => ctx.measureText(text).width + spacing * size * (text.length - 1);
  while (measure() > maxW && size > 8) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, spacingPx: number) {
  if (!spacingPx) {
    ctx.fillText(text, cx, cy);
    return;
  }
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacingPx * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, x, cy);
    x += widths[i] + spacingPx;
  });
  ctx.textAlign = "center";
}

/* ─── painted wooden board ─────────────────────────────────────────── */
export function Board({
  text, sub, w, h, position, rotation = [0, 0, 0], bg = "#2F4C3D", fg = "#F6E9CF", accent = "#FECB66",
}: {
  text: string; sub?: string; w: number; h: number;
  position: [number, number, number]; rotation?: [number, number, number];
  bg?: string; fg?: string; accent?: string;
}) {
  const ppu = 96;
  const cw = Math.round(w * ppu);
  const ch = Math.round(h * ppu);
  const draw = useMemo<Draw>(() => (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // plank seams
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 3;
    for (let y = H / 3; y < H; y += H / 3) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // painted frame
    ctx.strokeStyle = accent;
    ctx.lineWidth = H * 0.05;
    ctx.strokeRect(H * 0.09, H * 0.09, W - H * 0.18, H - H * 0.18);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const main = sub ? H * 0.5 : H * 0.62;
    fitText(ctx, text, (s) => `700 ${s}px ${DISPLAY}`, W * 0.84, main, 0.04);
    drawSpaced(ctx, text, W / 2, sub ? H * 0.42 : H * 0.53, H * 0.02);
    if (sub) {
      ctx.fillStyle = accent;
      fitText(ctx, sub, (s) => `800 ${s}px ${BODY}`, W * 0.8, H * 0.17);
      drawSpaced(ctx, sub, W / 2, H * 0.74, H * 0.025);
    }
  }, [text, sub, bg, fg, accent]);
  const map = useCanvasTexture(cw, ch, draw);

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.14]} />
        <meshStandardMaterial color="#3A2A20" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} roughness={0.85} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
    </group>
  );
}

/* ─── name painted large across a roof slope ──────────────────────── */
export function RoofTiles({ text, w, h }: { text: string; w: number; h: number }) {
  // crisp, high-resolution lettering with a dark keyline so it reads from afar
  const cw = 1024;
  const ch = Math.max(128, Math.round((1024 * h) / w));
  const draw = useMemo<Draw>(() => (ctx, W, H) => {
    const label = text.toUpperCase();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitText(ctx, label, (s) => `800 ${s}px ${BODY}`, W * 0.92, H * 0.74, 0.06);
    ctx.lineJoin = "round";
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = "rgba(48, 12, 8, 0.85)";
    ctx.font = `800 ${size}px ${BODY}`;
    // keyline first, then the cream paint on top
    const spacing = size * 0.06;
    const chars = [...label];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
    let x = W / 2 - total / 2;
    ctx.textAlign = "left";
    chars.forEach((c, i) => { ctx.strokeText(c, x, H * 0.54); x += widths[i] + spacing; });
    x = W / 2 - total / 2;
    ctx.fillStyle = "#F8E7BE";
    chars.forEach((c, i) => { ctx.fillText(c, x, H * 0.54); x += widths[i] + spacing; });
  }, [text]);
  const map = useCanvasTexture(cw, ch, draw);
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        map={map}
        transparent
        alphaTest={0.2}
        roughness={0.6}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}

/* ─── white brick letters down a tapered chimney ──────────────────── */
export function ChimneyLetters({
  text, yFrom, yTo, rAt, faceAngle, position,
}: {
  text: string; yFrom: number; yTo: number; rAt: (y: number) => number; faceAngle: number;
  position: [number, number, number];
}) {
  const span = 1.5;
  const chars = [...text.toUpperCase()];
  const draw = useMemo<Draw>(() => (ctx, W, H) => {
    ctx.fillStyle = "#F4EADB";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cell = H / chars.length;
    ctx.font = `800 ${Math.min(cell * 0.86, W * 0.62)}px ${BODY}`;
    chars.forEach((c, i) => ctx.fillText(c, W / 2, cell * (i + 0.55)));
  }, [text]);
  const map = useCanvasTexture(128, 128 * chars.length, draw);
  const h = yTo - yFrom;
  const geo = useMemo(
    () => new THREE.CylinderGeometry(rAt(yTo) + 0.04, rAt(yFrom) + 0.04, h, 32, 1, true, faceAngle - span / 2, span),
    [h, yFrom, yTo, faceAngle, rAt],
  );
  return (
    <mesh geometry={geo} position={[position[0], position[1] + yFrom + h / 2, position[2]]}>
      <meshStandardMaterial map={map} transparent alphaTest={0.35} roughness={0.8} side={THREE.FrontSide} />
    </mesh>
  );
}

/* ─── old painted advertising on a brick wall ─────────────────────── */
export function WallPaint({ text, w, h, position, rotation = [0, 0, 0] }: { text: string; w: number; h: number; position: [number, number, number]; rotation?: [number, number, number] }) {
  const ppu = 64;
  const draw = useMemo<Draw>(() => (ctx, W, H) => {
    ctx.fillStyle = "rgba(244, 234, 219, 0.92)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitText(ctx, text.toUpperCase(), (s) => `800 ${s}px ${BODY}`, W * 0.96, H * 0.8, 0.12);
    drawSpaced(ctx, text.toUpperCase(), W / 2, H * 0.54, size * 0.12);
  }, [text]);
  const map = useCanvasTexture(Math.round(w * ppu), Math.round(h * ppu), draw);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={map} transparent alphaTest={0.3} roughness={0.95} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}
