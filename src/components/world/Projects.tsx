import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { lampMat, mat, windowMat } from "./materials";
import { Board, RoofTiles, WallPaint } from "./Signs";
import { Beam, Box, Window, type V3 } from "./parts";
import { materials, wrapMaterial } from "./textures";
import { world } from "./store";

// Each case gets its own landmark that says what we did there, at a glance.

function useCanvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [w, h]);
  useEffect(() => {
    const paint = () => {
      const ctx = (tex.image as HTMLCanvasElement).getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      draw(ctx);
      tex.needsUpdate = true;
    };
    paint();
    document.fonts.load(`800 64px "Figtree"`).then(paint, paint);
  }, [tex, draw, w, h]);
  return tex;
}

/* ─── a small Twentse house with an optional name in the roof tiles ── */
function Cottage({
  w, l, wallH, roofH, wall, roof, roofText, roofSide = 1, position = [0, 0, 0], chimney = true, gableWindows = true,
}: {
  w: number; l: number; wallH: number; roofH: number; wall?: THREE.Material; roof?: THREE.Material;
  roofText?: string; roofSide?: number; position?: V3; chimney?: boolean; gableWindows?: boolean;
}) {
  const M = materials();
  const wallMat = wall ?? M.brick;
  const roofMat = roof ?? M.tiles;
  const ov = 0.5;
  const run = w / 2 + ov;
  const slope = Math.hypot(run, roofH);
  const ang = Math.atan2(roofH, run);
  const gable = useMemo(() => {
    const s = new THREE.Shape();
    const gh = (roofH * (w / 2)) / run;
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, gh);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: l - 0.1, bevelEnabled: false }).translate(0, 0, -(l - 0.1) / 2);
  }, [w, l, roofH, run]);
  const quat = useMemo(
    () => new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -roofSide), new THREE.Vector3(-roofSide, 0, 0), new THREE.Vector3(0, 1, 0)),
    ),
    [roofSide],
  );
  const chimMat = useMemo(() => wrapMaterial(M.brickDark, 2.2, 1.8), [M]);
  return (
    <group position={position}>
      <Box p={[0, 0.25, 0]} s={[w + 0.12, 0.5, l + 0.12]} c={M.brickDark} />
      <Box p={[0, wallH / 2 + 0.1, 0]} s={[w, wallH - 0.2, l]} c={wallMat} />
      <mesh geometry={gable} position={[0, wallH, 0]} material={wallMat} castShadow receiveShadow />
      {[1, -1].map((sd) => (
        <group key={sd}>
          <group position={[(sd * run) / 2, wallH + roofH / 2, 0]} rotation={[0, 0, sd * -ang]}>
            <Box p={[0, 0, 0]} s={[slope, 0.3, l + ov * 2]} c={roofMat} />
            {roofText && sd === roofSide && (
              <group position={[sd * 0.15, 0.24, 0]} quaternion={quat}>
                <RoofTiles text={roofText} w={(l + ov * 2) * 0.94} h={slope * 0.72} />
              </group>
            )}
          </group>
          {/* gutter + white barge boards */}
          <Box p={[sd * (run - 0.05), wallH - 0.06, 0]} s={[0.14, 0.12, l + ov * 2]} c="#3B2F2B" />
          <Box p={[(sd * run) / 2, wallH + roofH / 2 + 0.1, l / 2 + ov + 0.02]} s={[slope + 0.08, 0.18, 0.08]} rot={[0, 0, sd * -ang]} c="#F1E7D6" />
          <Box p={[(sd * run) / 2, wallH + roofH / 2 + 0.1, -l / 2 - ov - 0.02]} s={[slope + 0.08, 0.18, 0.08]} rot={[0, 0, sd * -ang]} c="#F1E7D6" />
        </group>
      ))}
      <Box p={[0, wallH + roofH - 0.02, 0]} s={[0.4, 0.28, l + ov * 2 + 0.05]} c="#6B2A22" />
      {gableWindows && <Window p={[0, wallH + roofH * 0.38, l / 2 + 0.02]} w={0.7} h={0.8} glass={windowMat} />}
      {[1, -1].map((sd) =>
        [-l / 4, l / 4].map((z) => (
          <Window key={`${sd}${z}`} p={[sd * (w / 2 + 0.02), wallH * 0.55, z]} side={sd > 0 ? "x" : "-x"} w={0.8} h={0.95} glass={windowMat} shutters shutterMat={M.shutter} />
        )),
      )}
      {chimney && (
        <group position={[w * 0.18, wallH + roofH * 0.72, -l / 4]}>
          <mesh material={chimMat} castShadow><boxGeometry args={[0.55, 1.8, 0.55]} /></mesh>
          <Box p={[0, 0.95, 0]} s={[0.75, 0.12, 0.75]} c="#4A3A34" />
        </group>
      )}
    </group>
  );
}

/* ═══ ReservaX / ActifAid: het planbureau ═════════════════════════════ */
export function Planbureau({ roofSide = 1 }: { roofSide?: number }) {
  return (
    <group>
      <Cottage w={7} l={10} wallH={3.2} roofH={4} roofText="ReservaX" roofSide={roofSide} gableWindows={false} />
      {/* front gable towards the lane */}
      <Box p={[0, 1.2, 5.05]} s={[1.3, 2.4, 0.1]} c={materials().door} />
      {[-2.4, 2.4].map((x) => <Window key={x} p={[x, 1.8, 5.02]} w={0.9} h={1.1} glass={windowMat} shutters shutterMat={materials().shutter} />)}
      <Window p={[0, 4.4, 5.02]} w={0.8} h={0.9} glass={windowMat} />
      <ClockTower position={[0, 3.2 + 4 - 0.5, 2.6]} />
      <PlanningBoard position={[6.2, 0, 5.4]} rotation={0.55} />
    </group>
  );
}

function ClockTower({ position }: { position: V3 }) {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const hour2 = useRef<THREE.Group>(null);
  const minute2 = useRef<THREE.Group>(null);
  const roof = useMemo(() => new THREE.ConeGeometry(1.45, 1.9, 4).rotateY(Math.PI / 4), []);
  const face = useCanvas(256, 256, (ctx) => {
    ctx.fillStyle = "#FFFAF0";
    ctx.beginPath(); ctx.arc(128, 128, 124, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3A001D";
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(128, 128, 118, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r0 = i % 3 === 0 ? 84 : 96;
      ctx.lineWidth = i % 3 === 0 ? 10 : 6;
      ctx.beginPath();
      ctx.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0);
      ctx.lineTo(128 + Math.sin(a) * 108, 128 - Math.cos(a) * 108);
      ctx.stroke();
    }
  });
  useFrame(() => {
    // real Dutch time on the tower: the planning never sleeps
    const d = new Date();
    const m = d.getMinutes() + d.getSeconds() / 60;
    const h = (d.getHours() % 12) + m / 60;
    const ha = -(h / 12) * Math.PI * 2;
    const ma = -(m / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = ha;
    if (minute.current) minute.current.rotation.z = ma;
    if (hour2.current) hour2.current.rotation.z = -ha;
    if (minute2.current) minute2.current.rotation.z = -ma;
  });
  const Face = ({ z, flip, h, m }: { z: number; flip: boolean; h: React.RefObject<THREE.Group | null>; m: React.RefObject<THREE.Group | null> }) => (
    <group position={[0, 1.2, z]} rotation={[0, flip ? Math.PI : 0, 0]}>
      <mesh>
        <circleGeometry args={[0.68, 32]} />
        <meshStandardMaterial map={face} roughness={0.6} />
      </mesh>
      <group ref={h} position={[0, 0, 0.03]} userData={{ dynamic: true }}>
        <mesh position={[0, 0.17, 0]} material={mat("#3A001D")}><boxGeometry args={[0.08, 0.36, 0.03]} /></mesh>
      </group>
      <group ref={m} position={[0, 0, 0.05]} userData={{ dynamic: true }}>
        <mesh position={[0, 0.25, 0]} material={mat("#EA3D5B")}><boxGeometry args={[0.05, 0.52, 0.03]} /></mesh>
      </group>
    </group>
  );
  return (
    <group position={position}>
      <Box p={[0, 1.2, 0]} s={[1.7, 2.6, 1.7]} c="#EFE3CC" />
      <Face z={0.86} flip={false} h={hour} m={minute} />
      <Face z={-0.86} flip h={hour2} m={minute2} />
      <mesh geometry={roof} position={[0, 3.45, 0]} material={mat("#3B2D2A")} castShadow />
      <Box p={[0, 4.6, 0]} s={[0.08, 0.6, 0.08]} c="#C9A54C" />
    </group>
  );
}

const DAYS = ["MA", "DI", "WO", "DO", "VR"];
const SLOT_COLORS = ["#FF6F89", "#FECB66", "#FFFAF0", "#EA3D5B", "#FECB66", "#FF6F89"];

function PlanningBoard({ position, rotation }: { position: V3; rotation: number }) {
  const cols = 5;
  const rows = 5;
  const bw = 5.6;
  const bh = 3.3;
  const header = useCanvas(512, 64, (ctx) => {
    ctx.fillStyle = "#F6E9CF";
    ctx.font = `800 34px "Figtree", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    DAYS.forEach((d, i) => ctx.fillText(d, ((i + 0.5) / cols) * 512, 34));
  });
  const slots = useMemo(() => {
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const cells = Array.from({ length: cols * rows }, (_, i) => i).filter(() => rand() > 0.18);
    const order = cells.map((c) => ({ c, k: rand() })).sort((a, b) => a.k - b.k).map((o) => o.c);
    return order.map((cell, i) => ({
      col: cell % cols,
      row: Math.floor(cell / cols),
      at: i * 0.38,
      color: SLOT_COLORS[cell % SLOT_COLORS.length],
      span: rand() > 0.75 ? 2 : 1,
    }));
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const cellW = (bw - 0.4) / cols;
  const cellH = (bh - 0.9) / rows;
  const fillTime = slots.length * 0.38;
  const cycle = fillTime + 4.5;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime % cycle;
    const fade = t > fillTime + 3.6 ? 1 - (t - fillTime - 3.6) / 0.9 : 1;
    slots.forEach((s, i) => {
      const m = refs.current[i];
      if (!m) return;
      const k = THREE.MathUtils.clamp((t - s.at) / 0.35, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const v = world.reduced ? 1 : e * fade;
      m.scale.set(Math.max(0.001, v), Math.max(0.001, v), 1);
      m.visible = v > 0.01;
    });
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-bw / 2 + 0.3, bw / 2 - 0.3].map((x) => <Box key={x} p={[x, 1.9, -0.12]} s={[0.2, 3.8, 0.2]} c="#4A3328" />)}
      <Box p={[0, 3.0, 0]} s={[bw + 0.25, bh + 0.25, 0.14]} c="#3A2A20" />
      <Box p={[0, 3.0, 0.04]} s={[bw, bh, 0.1]} c="#2F4C3D" />
      <mesh position={[0, 3.0 + bh / 2 - 0.36, 0.1]}>
        <planeGeometry args={[bw - 0.3, 0.5]} />
        <meshStandardMaterial map={header} transparent roughness={0.9} />
      </mesh>
      {/* grid lines */}
      {Array.from({ length: cols - 1 }, (_, i) => (
        <Box key={`c${i}`} p={[-bw / 2 + 0.2 + cellW * (i + 1), 3.0 - 0.3, 0.1]} s={[0.03, bh - 0.9, 0.02]} c="#5E7A66" shadow={false} />
      ))}
      <group userData={{ dynamic: true }}>
      {slots.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[
            -bw / 2 + 0.2 + cellW * (s.col + 0.5),
            3.0 + bh / 2 - 0.75 - cellH * (s.row + 0.5) - (s.span === 2 ? 0 : 0),
            0.13,
          ]}
          material={mat(s.color, 0.6)}
        >
          <boxGeometry args={[cellW * 0.84, cellH * (s.span === 2 && s.row < rows - 1 ? 1.84 : 0.8), 0.06]} />
        </mesh>
      ))}
      </group>
    </group>
  );
}

/* ═══ DG Rubber Profiles: de rubberwerkplaats ═════════════════════════ */
export function Rubberwerkplaats() {
  const barrel = useMemo(() => new THREE.CylinderGeometry(3.8, 3.8, 12.8, 14, 1, false, 0, Math.PI), []);
  const endCap = useMemo(() => new THREE.CircleGeometry(3.5, 14, 0, Math.PI), []);
  const coil = useMemo(() => new THREE.TorusGeometry(0.85, 0.3, 8, 18), []);
  const rubber = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2A2426", roughness: 0.55, flatShading: true }), []);
  const gauge = useCanvas(512, 512, (ctx) => {
    const cx = 256, cy = 290;
    ctx.fillStyle = "#FFFAF0";
    ctx.beginPath(); ctx.arc(256, 256, 250, 0, Math.PI * 2); ctx.fill();
    const seg = [["#EA3D5B", 0, 0.5], ["#FECB66", 0.5, 0.9], ["#4F9A5B", 0.9, 1]] as const;
    ctx.lineWidth = 44;
    for (const [c, a, b] of seg) {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(cx, cy, 170, Math.PI + a * Math.PI, Math.PI + b * Math.PI);
      ctx.stroke();
    }
    // needle at 100
    ctx.strokeStyle = "#3A001D";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 150 * Math.cos(-0.04), cy + 150 * Math.sin(-0.04)); ctx.stroke();
    ctx.fillStyle = "#3A001D";
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = "center";
    ctx.font = `800 118px "Figtree", sans-serif`;
    ctx.fillText("100", 256, 420);
    ctx.font = `800 34px "Figtree", sans-serif`;
    ctx.fillStyle = "#9A1436";
    ctx.fillText("PAGESPEED", 256, 470);
  });

  return (
    <group>
      <group position={[0, 0, -1.2]}>
        <Box p={[0, 1.7, 0]} s={[12, 3.4, 7]} c={materials().brick} />
        <Box p={[0, 0.3, 0]} s={[12.15, 0.6, 7.15]} c={materials().brickDark} />
        <mesh geometry={barrel} position={[0, 3.4, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.62, 1, 1]} material={materials().zinc} castShadow receiveShadow />
        <mesh geometry={endCap} position={[6.1, 3.4, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1, 0.62, 1]} material={materials().brick} />
        <mesh geometry={endCap} position={[-6.1, 3.4, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[1, 0.62, 1]} material={materials().brick} />
        {/* big sliding door + painted name */}
        <Box p={[0, 1.15, 3.55]} s={[3.2, 2.3, 0.1]} c={materials().door} />
        <Board text="DG Rubber Profiles" w={6.6} h={0.82} position={[0, 2.88, 3.62]} bg="#3A001D" accent="#FF6F89" />
        {[-4.6, -2.4, 2.4, 4.6].map((x) => <Window key={x} p={[x, 1.9, 3.5]} w={1.2} h={1.1} glass={windowMat} />)}
      </group>
      {/* rubber profile coils on pallets */}
      {[[4.4, 4.6, 3], [2.4, 5.6, 2], [5.6, 6.8, 1]].map(([x, z, n]) => (
        <group key={`${x}`} position={[x, 0, z]}>
          <Box p={[0, 0.1, 0]} s={[2.1, 0.2, 2.1]} c={materials().woodLight} />
          {Array.from({ length: n }, (_, i) => (
            <mesh key={i} geometry={coil} material={rubber} position={[0, 0.42 + i * 0.6, 0]} rotation={[Math.PI / 2, 0, i * 0.4]} castShadow />
          ))}
        </group>
      ))}
      <mesh geometry={coil} material={rubber} position={[1.0, 1.15, 6.9]} rotation={[0, -0.7, 0]} castShadow />
      {/* the PageSpeed gauge */}
      <group position={[-5.4, 0, 4.6]} rotation={[0, 0.45, 0]}>
        <Box p={[0, 1.6, -0.1]} s={[0.18, 3.2, 0.18]} c="#4A3328" />
        <mesh position={[0, 4.4, 0]} castShadow>
          <cylinderGeometry args={[1.62, 1.62, 0.16, 32]} />
          <meshStandardMaterial color="#3A2A20" roughness={0.8} />
        </mesh>
        <mesh position={[0, 4.4, 0.09]}>
          <circleGeometry args={[1.5, 40]} />
          <meshStandardMaterial map={gauge} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ═══ GSM Team: de verhuizing (WordPress → Shopify, nul dagen dicht) ══ */
export function Verhuizing({ roofSide = 1 }: { roofSide?: number }) {
  const screen = useCanvas(256, 480, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 480);
    g.addColorStop(0, "#FF6F89");
    g.addColorStop(1, "#FECB66");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 480);
    ctx.fillStyle = "#3A001D";
    ctx.textAlign = "center";
    ctx.font = `800 44px "Figtree", sans-serif`;
    ctx.fillText("GSM", 128, 92);
    ctx.fillText("TEAM", 128, 140);
    ctx.beginPath(); ctx.arc(128, 250, 58, 0, Math.PI * 2); ctx.fillStyle = "#FFFAF0"; ctx.fill();
    ctx.strokeStyle = "#3A001D"; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(100, 252); ctx.lineTo(121, 274); ctx.lineTo(158, 228); ctx.stroke();
    ctx.fillStyle = "#3A001D";
    ctx.font = `800 30px "Figtree", sans-serif`;
    ctx.fillText("0 DAGEN", 128, 360);
    ctx.fillText("DOWNTIME", 128, 396);
  });
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: screen }), [screen]);
  const wheel = useMemo(() => new THREE.CylinderGeometry(0.55, 0.55, 0.14, 12).rotateZ(Math.PI / 2), []);

  return (
    <group>
      {/* new shop */}
      <Cottage position={[2.6, 0, -2.2]} w={6.6} l={8.4} wallH={3.3} roofH={3.6} wall={materials().brickWarm} roofText="GSM Team" roofSide={roofSide} gableWindows={false} />
      <Box p={[2.0, 1.55, 2.05]} s={[3.4, 1.7, 0.08]} c={windowMat} shadow={false} />
      <Box p={[4.85, 1.2, 2.05]} s={[1.0, 2.4, 0.1]} c={materials().door} />
      <Box p={[2.6, 3.0, 2.5]} s={[6.4, 0.12, 1.0]} rot={[0.25, 0, 0]} c="#2F5A44" />
      {/* the phone on its pole */}
      <group position={[-1.2, 0, 4.6]} rotation={[0, -0.5, 0]}>
        <Box p={[0, 1.6, -0.05]} s={[0.16, 3.2, 0.16]} c="#4A3328" />
        <Box p={[0, 4.9, 0]} s={[1.75, 3.2, 0.24]} c="#231A1E" />
        <mesh position={[0, 4.95, 0.125]} material={screenMat}>
          <planeGeometry args={[1.5, 2.8]} />
        </mesh>
      </group>
      {/* the old place: a weathered shed */}
      <group position={[-5.4, 0, -3.4]}>
        <group rotation={[0, 0.15, 0]}>
          <Cottage w={3.6} l={4.2} wallH={2.4} roofH={1.6} wall={materials().weathered} roof={materials().tilesDark} chimney={false} gableWindows={false} />
          <WallPaint text="WordPress" w={3.2} h={0.6} position={[0, 1.7, 2.12]} />
          <Box p={[0, 0.9, 2.12]} s={[1.0, 1.8, 0.06]} c="#5A4A3C" />
        </group>
      </group>
      {/* a cart full of moving boxes on its way over */}
      <group position={[-3.4, 0, 1.6]} rotation={[0, 0.9, 0]}>
        <Box p={[0, 0.95, 0]} s={[1.5, 0.5, 2.5]} c="#8A6446" />
        {[-0.82, 0.82].map((x) => <mesh key={x} geometry={wheel} position={[x, 0.55, 0.2]} material={mat("#3A2A20")} castShadow />)}
        <Beam a={[-0.5, 0.95, -1.2]} b={[-0.5, 0.6, -2.6]} t={0.1} c="#5A4030" />
        <Beam a={[0.5, 0.95, -1.2]} b={[0.5, 0.6, -2.6]} t={0.1} c="#5A4030" />
        {[[-0.35, 1.5, 0.6], [0.35, 1.5, 0.5], [0, 1.5, -0.4], [0.1, 2.05, 0.3]].map((p, i) => (
          <Box key={i} p={p as V3} s={[0.62, 0.55, 0.62]} c={i % 2 ? "#C99A62" : "#D4A96F"} rot={[0, i * 0.3, 0]} />
        ))}
      </group>
      {[[-3.8, -0.4], [-3.1, 0.9]].map(([x, z], i) => (
        <Box key={i} p={[x, 0.28, z]} s={[0.6, 0.55, 0.6]} c="#C99A62" rot={[0, i, 0]} />
      ))}
    </group>
  );
}

/* ═══ Ascendio: de uitkijktoren en een groeiende hooistapel ═══════════ */
export function Uitkijktoren() {
  const H = 11;
  const B = 1.7;
  const T = 1.1;
  const roof = useMemo(() => new THREE.ConeGeometry(2.1, 1.7, 4).rotateY(Math.PI / 4), []);
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const at = (cx: number, cz: number, y: number): V3 => {
    const k = B + (T - B) * (y / H);
    return [cx * k, y, cz * k];
  };
  return (
    <group>
      <group position={[-2.2, 0, -1.6]}>
        {corners.map(([cx, cz], i) => (
          <Beam key={i} a={at(cx, cz, 0)} b={at(cx, cz, H)} t={0.26} c="#6E4F37" />
        ))}
        {/* cross bracing */}
        {[0, 3.7, 7.4].map((y0) =>
          corners.map(([cx, cz], i) => {
            const [nx, nz] = corners[(i + 1) % 4];
            return (
              <group key={`${y0}${i}`}>
                <Beam a={at(cx, cz, y0)} b={at(nx, nz, y0 + 3.6)} t={0.12} c="#7A573D" />
                <Beam a={at(nx, nz, y0)} b={at(cx, cz, y0 + 3.6)} t={0.12} c="#7A573D" />
              </group>
            );
          }),
        )}
        <Box p={[0, H + 0.12, 0]} s={[3.0, 0.24, 3.0]} c={materials().woodLight} />
        {corners.map(([cx, cz], i) => (
          <Box key={i} p={[cx * 1.4, H + 1.25, cz * 1.4]} s={[0.14, 2.2, 0.14]} c="#5A4030" />
        ))}
        {[[0, 1.42, 3, 0.1], [0, -1.42, 3, 0.1], [1.42, 0, 0.1, 3], [-1.42, 0, 0.1, 3]].map(([x, z, w, d], i) => (
          <Box key={i} p={[x, H + 1.0, z]} s={[w, 0.1, d]} c="#5A4030" />
        ))}
        <mesh geometry={roof} position={[0, H + 3.15, 0]} material={mat("#3B2D2A")} castShadow />
        <mesh position={[0, H + 1.8, 0]} material={lampMat}>
          <icosahedronGeometry args={[0.32, 1]} />
        </mesh>
        <Board text="Ascendio" w={2.8} h={0.7} position={[0, H + 0.62, 1.52]} bg="#3A001D" accent="#FECB66" />
        {/* a ladder up */}
        <Beam a={[0.35, 0, 2.6]} b={[0.35, H, 1.25]} t={0.1} c="#5A4030" />
        <Beam a={[-0.35, 0, 2.6]} b={[-0.35, H, 1.25]} t={0.1} c="#5A4030" />
      </group>
      {/* 1× → 2× → 3×: organic traffic, stacked in hay */}
      <group position={[2.6, 0, 3.2]} rotation={[0, -0.25, 0]}>
        {[2, 4, 6].map((n, col) =>
          Array.from({ length: n }, (_, k) => (
            <Box key={`${col}${k}`} p={[col * 1.5, 0.4 + k * 0.8, (k % 2) * 0.05]} s={[1.3, 0.78, 0.95]} c={k % 2 ? "#E8C266" : "#DDB255"} />
          )),
        )}
        <Beam a={[-0.2, 2.3, 0.6]} b={[3.3, 5.7, 0.6]} t={0.22} c="#EA3D5B" />
        <mesh position={[3.45, 5.85, 0.6]} rotation={[0, 0, -Math.PI / 4]} material={mat("#EA3D5B")} castShadow>
          <coneGeometry args={[0.42, 0.8, 4]} />
        </mesh>
      </group>
    </group>
  );
}
