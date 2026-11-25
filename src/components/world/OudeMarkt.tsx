import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FAR } from "./landscape";
import { glowMats, lampMat, mat } from "./materials";
import { mulberry32 } from "./noise";
import { Board } from "./Signs";
import { materials } from "./textures";
import { world } from "./store";

// Enschede's Oude Markt in winter: the Grote Kerk, an ice rink with skaters,
// gabled facades whose shops are our services, string lights, a Christmas
// tree, stalls and terraces. Behind you when you open "Diensten".

type V3 = [number, number, number];

const SNOW_ROOF = mat("#F3F1EC", 0.95);

/* ─── baked, vertex-coloured little models ────────────────────────────── */
function part(geo: THREE.BufferGeometry, pos: V3, color: string, rot?: V3, scale?: V3) {
  let g = (geo.index ? geo.toNonIndexed() : geo).clone();
  if (scale) g.scale(...scale);
  if (rot) g.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
  g.translate(...pos);
  const c = new THREE.Color(color);
  const arr = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < g.attributes.position.count; i++) c.toArray(arr, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute("uv");
  return g;
}
const merge = (parts: THREE.BufferGeometry[]) => {
  const g = mergeGeometries(parts)!;
  g.computeVertexNormals();
  return g;
};
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

const COATS = ["#C21F2E", "#2F5A44", "#3E5A7A", "#E3B23C", "#7A3B6E", "#F1EDE3", "#2B2F36", "#D9773A"];
const HATS = ["#F1EDE3", "#C21F2E", "#E3B23C", "#2F5A44", "#3E5A7A"];

function personGeometry(coat: string, hat: string, skating: boolean) {
  return merge([
    part(box(0.18, 0.8, 0.2), [-0.12, 0.4, 0], "#2B2320"),
    part(box(0.18, 0.8, 0.2), [0.12, 0.4, 0], "#2B2320"),
    ...(skating ? [part(box(0.06, 0.06, 0.5), [-0.12, 0.02, 0.04], "#DADDE0"), part(box(0.06, 0.06, 0.5), [0.12, 0.02, 0.04], "#DADDE0")] : []),
    part(box(0.56, 0.75, 0.34), [0, 1.18, 0], coat),
    part(box(0.6, 0.14, 0.38), [0, 1.5, 0.02], hat),
    part(new THREE.IcosahedronGeometry(0.19, 1), [0, 1.78, 0], "#E8C3A0"),
    part(new THREE.ConeGeometry(0.2, 0.32, 8), [0, 2.02, 0], hat),
    part(box(0.14, 0.62, 0.16), [-0.36, 1.12, 0], coat, [0, 0, skating ? 0.5 : 0.1]),
    part(box(0.14, 0.62, 0.16), [0.36, 1.12, 0], coat, [0, 0, skating ? -0.5 : -0.1]),
  ]);
}

/* ─── facade textures: windows that glow at dusk, a shop at street level ─ */
const FACADE_COLORS = ["#A9473A", "#C4683F", "#7E3A2E", "#E9DCC4", "#B85A3E", "#8E4E3C", "#D9C8A8"];
const AWNINGS = ["#C21F2E", "#2F5A44", "#3E5A7A", "#E3B23C", "#7A3B6E", "#2B2F36"];

function facadeMaterial(i: number) {
  const base = FACADE_COLORS[i % FACADE_COLORS.length];
  const plaster = base === "#E9DCC4" || base === "#D9C8A8";
  const paint = (glow: boolean) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = glow ? "#000" : base;
    ctx.fillRect(0, 0, 256, 512);
    if (!glow && !plaster) {
      for (let y = 0; y < 512; y += 8) {
        ctx.fillStyle = "rgba(255,240,220,0.14)";
        ctx.fillRect(0, y, 256, 1.5);
      }
    }
    // upper floors: three rows of tall windows with cream frames
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = 26 + col * 76;
        const y = 34 + row * 106;
        if (glow) {
          const lit = (i * 7 + row * 3 + col) % 4 !== 0;
          ctx.fillStyle = lit ? "#FFC27A" : "#1A0E08";
          ctx.fillRect(x + 6, y + 6, 40, 72);
        } else {
          ctx.fillStyle = "#F1E7D6";
          ctx.fillRect(x, y, 52, 84);
          ctx.fillStyle = "#24303A";
          ctx.fillRect(x + 6, y + 6, 40, 72);
          ctx.fillStyle = "#F1E7D6";
          ctx.fillRect(x + 24, y + 6, 4, 72);
          ctx.fillRect(x + 6, y + 40, 40, 4);
        }
      }
    }
    // shopfront and door
    if (glow) {
      ctx.fillStyle = "#FFD08A";
      ctx.fillRect(18, 386, 150, 100);
      ctx.fillStyle = "#FFB45E";
      ctx.fillRect(190, 400, 46, 86);
    } else {
      ctx.fillStyle = "#2B2320";
      ctx.fillRect(10, 370, 236, 142);
      ctx.fillStyle = "#3A4652";
      ctx.fillRect(18, 386, 150, 100);
      ctx.fillStyle = "#5A3A2A";
      ctx.fillRect(190, 400, 46, 112);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(24, 392, 40, 90);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const m = new THREE.MeshStandardMaterial({ map: paint(false), emissive: new THREE.Color("#ffffff"), emissiveMap: paint(true), emissiveIntensity: 0.05, roughness: 0.85 });
  m.userData.glowScale = 0.55;
  glowMats.add(m);
  return { facade: m, side: mat(base), awning: AWNINGS[i % AWNINGS.length] };
}

/* ─── one gabled house: facade at +z ───────────────────────────────────── */
function gableShape(w: number, h: number, type: number) {
  const s = new THREE.Shape();
  if (type === 0) {
    // trapgevel: a stepped gable
    const steps = 4;
    s.moveTo(-w / 2, 0);
    for (let i = 0; i < steps; i++) {
      const x = -w / 2 + (i * w) / (steps * 2);
      const y = ((i + 1) * h) / steps;
      s.lineTo(x, y);
      s.lineTo(x + w / (steps * 2), y);
    }
    for (let i = steps - 1; i >= 0; i--) {
      const x = w / 2 - (i * w) / (steps * 2);
      const y = ((i + 1) * h) / steps;
      s.lineTo(x - w / (steps * 2), y);
      s.lineTo(x, y);
    }
    s.lineTo(w / 2, 0);
  } else if (type === 1) {
    // halsgevel: shoulders and a raised neck
    s.moveTo(-w / 2, 0);
    s.lineTo(-w / 2, h * 0.25);
    s.lineTo(-w / 4, h * 0.35);
    s.lineTo(-w / 4, h * 0.85);
    s.quadraticCurveTo(0, h * 1.15, w / 4, h * 0.85);
    s.lineTo(w / 4, h * 0.35);
    s.lineTo(w / 2, h * 0.25);
    s.lineTo(w / 2, 0);
  } else {
    s.moveTo(-w / 2, 0);
    s.lineTo(0, h);
    s.lineTo(w / 2, 0);
  }
  s.closePath();
  return s;
}

function House({ position, rotation, w, h, d, variant, sign }: { position: V3; rotation: number; w: number; h: number; d: number; variant: number; sign?: string }) {
  const M = useMemo(() => facadeMaterial(variant), [variant]);
  const type = variant % 3;
  const gh = type === 2 ? 0 : 3.6;
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(gableShape(w, gh || 0.01, type), { depth: 0.5, bevelEnabled: false });
    return g;
  }, [w, gh, type]);
  const roofMat = SNOW_ROOF;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={[M.side, M.side, M.side, M.side, M.facade, M.side]}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {type !== 2 ? (
        <mesh geometry={geo} position={[0, h, d / 2 - 0.5]} material={M.side} castShadow />
      ) : null}
      {/* snow resting on the gable top and the cornice */}
      {type !== 2 ? (
        <mesh position={[0, h + gh * 0.98, d / 2 - 0.25]} material={SNOW_ROOF}><boxGeometry args={[type === 1 ? w * 0.5 : 0.9, 0.22, 0.6]} /></mesh>
      ) : (
        <mesh position={[0, h + 0.3, d / 2 - 0.2]} material={mat("#F1E7D6")}><boxGeometry args={[w + 0.4, 0.6, 0.6]} /></mesh>
      )}
      {/* roof behind the gable */}
      <mesh position={[0, h + 1.4, -0.3]} material={roofMat} castShadow>
        <boxGeometry args={[w * 0.9, 2.8, d - 1.2]} />
      </mesh>
      {/* awning over the shop window */}
      <mesh position={[-w * 0.1, 3.05, d / 2 + 0.55]} rotation={[0.35, 0, 0]} material={mat(M.awning)} castShadow>
        <boxGeometry args={[w * 0.62, 0.08, 1.2]} />
      </mesh>
      {sign && <Board text={sign} w={Math.min(w * 0.82, 5.2)} h={0.8} position={[0, 3.95, d / 2 + 0.08]} bg="#3A001D" fg="#F8E7BE" accent="#FECB66" />}
    </group>
  );
}

/* ─── ice rink with skaters ─────────────────────────────────────────────── */
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(w / 2, h / 2 - r);
  s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, h / 2);
  s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-w / 2, -h / 2 + r);
  s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function Rink({ position }: { position: V3 }) {
  const W = 28;
  const H = 15;
  const geos = useMemo(() => {
    const ice = new THREE.ShapeGeometry(roundedRect(W, H, 5), 24).rotateX(-Math.PI / 2);
    const outer = roundedRect(W + 0.6, H + 0.6, 5.3);
    outer.holes.push(roundedRect(W, H, 5) as unknown as THREE.Path);
    const boards = new THREE.ExtrudeGeometry(outer, { depth: 1.0, bevelEnabled: false, curveSegments: 24 }).rotateX(-Math.PI / 2);
    const outer2 = roundedRect(W + 0.7, H + 0.7, 5.35);
    outer2.holes.push(roundedRect(W - 0.1, H - 0.1, 4.95) as unknown as THREE.Path);
    const trim = new THREE.ExtrudeGeometry(outer2, { depth: 0.15, bevelEnabled: false, curveSegments: 24 }).rotateX(-Math.PI / 2);
    return { ice, boards, trim };
  }, []);
  const ice = useMemo(() => new THREE.MeshStandardMaterial({ color: "#EEF6FB", emissive: new THREE.Color("#9FC2D8"), emissiveIntensity: 0.12, roughness: 0.15, metalness: 0.1 }), []);

  const skaters = useMemo(() => {
    const rng = mulberry32(55);
    return Array.from({ length: 16 }, (_, i) => ({
      geo: personGeometry(COATS[i % COATS.length], HATS[i % HATS.length], true),
      phase: rng() * Math.PI * 2,
      s: 0.45 + rng() * 0.45,
      speed: (0.22 + rng() * 0.2) * (rng() < 0.12 ? -1 : 1),
    }));
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const skaterMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 }), []);
  useFrame(({ clock }) => {
    const t = world.reduced ? 0 : clock.elapsedTime;
    skaters.forEach((sk, i) => {
      const m = refs.current[i];
      if (!m) return;
      const a = sk.phase + t * sk.speed;
      const rx = (W / 2 - 2.2) * sk.s + 1.5;
      const rz = (H / 2 - 1.8) * sk.s + 0.6;
      m.position.set(Math.cos(a) * rx, 0.05 + Math.abs(Math.sin(t * 3 + i)) * 0.05, Math.sin(a) * rz);
      // face along the direction of travel, leaning into the curve
      const dx = -Math.sin(a) * rx * Math.sign(sk.speed);
      const dz = Math.cos(a) * rz * Math.sign(sk.speed);
      m.rotation.set(0, Math.atan2(dx, dz), 0);
      m.rotateZ(-0.12 * Math.sign(sk.speed));
    });
  });

  return (
    <group position={position}>
      <mesh geometry={geos.ice} material={ice} position={[0, 0.06, 0]} receiveShadow />
      <mesh geometry={geos.boards} material={mat("#F4F1EA", 0.6)} castShadow receiveShadow />
      <mesh geometry={geos.trim} position={[0, 1.0, 0]} material={mat("#C21F2E")} />
      <group userData={{ dynamic: true }}>
        {skaters.map((sk, i) => (
          <mesh key={i} ref={(el) => { refs.current[i] = el; }} geometry={sk.geo} material={skaterMat} castShadow />
        ))}
      </group>
    </group>
  );
}

/* ─── the Grote Kerk ───────────────────────────────────────────────────── */
function GroteKerk({ position }: { position: V3 }) {
  const stone = "#BFAE8C";
  const stoneDark = "#A8977A";
  const spire = useMemo(() => new THREE.ConeGeometry(4.6, 14, 4).rotateY(Math.PI / 4), []);
  const roof = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-7.6, 0);
    s.lineTo(0, 7);
    s.lineTo(7.6, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 26, bevelEnabled: false }).translate(0, 0, -13);
  }, []);
  return (
    <group position={position}>
      {/* tower towards the square */}
      <mesh position={[0, 17, 0]} material={mat(stone)} castShadow receiveShadow><boxGeometry args={[9, 34, 9]} /></mesh>
      {[8, 16, 24].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={mat(stoneDark)}><boxGeometry args={[9.3, 0.5, 9.3]} /></mesh>
      ))}
      {[[0, 4.56], [4.56, 0], [-4.56, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 0, -z]} rotation={[0, i === 0 ? Math.PI : i === 1 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          {[12, 20, 28.5].map((y) => (
            <mesh key={y} position={[0, y, 0.02]} material={mat("#2A2420")}>
              <boxGeometry args={[1.5, y > 28 ? 3.6 : 2.6, 0.1]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 34.4, 0]} material={mat(stoneDark)}><boxGeometry args={[9.6, 0.8, 9.6]} /></mesh>
      <mesh geometry={spire} position={[0, 41.8, 0]} material={mat("#4F5A5A")} castShadow />
      <mesh position={[0, 49.2, 0]} material={mat("#C9A54C")}><sphereGeometry args={[0.35, 8, 6]} /></mesh>
      {/* the clock */}
      <mesh position={[0, 30.5, -4.56]} rotation={[0, Math.PI, 0]} material={mat("#F1ECE2")}><circleGeometry args={[1.5, 24]} /></mesh>
      {/* nave behind the tower */}
      <mesh position={[0, 8, 17]} material={mat(stone)} castShadow receiveShadow><boxGeometry args={[14, 16, 26]} /></mesh>
      <mesh geometry={roof} position={[0, 16, 17]} material={SNOW_ROOF} castShadow />
      {[9, 14, 19, 24].map((z) => [-7.05, 7.05].map((x) => (
        <mesh key={`${x}${z}`} position={[x, 8.5, z]} rotation={[0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={mat("#2A2420")}>
          <planeGeometry args={[1.8, 6]} />
        </mesh>
      )))}
      {/* entrance */}
      <mesh position={[0, 2.4, -4.6]} material={mat("#3A2418")}><boxGeometry args={[2.4, 4.6, 0.2]} /></mesh>
    </group>
  );
}

/* ─── stall, tree, terrace, lamppost, string lights ─────────────────────── */
function Stall({ position, rotation, sign }: { position: V3; rotation: number; sign: string }) {
  const M = materials();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.3, 0]} material={M.woodLight} castShadow><boxGeometry args={[4, 2.6, 2.6]} /></mesh>
      <mesh position={[0, 3.1, 0]} rotation={[0, 0, 0]} material={SNOW_ROOF} castShadow>
        <cylinderGeometry args={[0.01, 3.4, 1.4, 4, 1, false, Math.PI / 4]} />
      </mesh>
      <mesh position={[0, 1.55, 1.32]} material={lampMat}><boxGeometry args={[3.2, 1.0, 0.05]} /></mesh>
      <mesh position={[0, 1.0, 1.55]} material={mat("#5A4030")}><boxGeometry args={[3.6, 0.12, 0.5]} /></mesh>
      <Board text={sign} w={3.2} h={0.6} position={[0, 2.35, 1.34]} bg="#2F5A44" fg="#F8E7BE" accent="#E3B23C" />
    </group>
  );
}

function ChristmasTree({ position }: { position: V3 }) {
  const lights = useMemo(() => {
    const rng = mulberry32(25);
    return Array.from({ length: 40 }, () => {
      const y = 1.5 + rng() * 9;
      const r = (1 - (y - 1) / 11) * 3.4 + 0.2;
      const a = rng() * Math.PI * 2;
      return [Math.cos(a) * r, y, Math.sin(a) * r] as V3;
    });
  }, []);
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} material={mat("#5A3F30")}><cylinderGeometry args={[0.4, 0.5, 1.2, 8]} /></mesh>
      {[[3.8, 4.5, 3.4], [3.0, 4, 6.2], [2.1, 3.6, 8.8], [1.2, 3, 11]].map(([r, h, y], i) => (
        <mesh key={i} position={[0, y, 0]} material={mat("#2F5A3A")} castShadow><coneGeometry args={[r, h, 9]} /></mesh>
      ))}
      {lights.map((p, i) => (
        <mesh key={i} position={p} material={lampMat}><sphereGeometry args={[0.13, 6, 4]} /></mesh>
      ))}
      <mesh position={[0, 12.8, 0]} material={lampMat}><octahedronGeometry args={[0.6, 0]} /></mesh>
    </group>
  );
}

function Terrace({ position, rotation, color }: { position: V3; rotation: number; color: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-2.4, 2.4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.75, 0]} material={mat("#3B3330")}><cylinderGeometry args={[0.7, 0.7, 0.06, 12]} /></mesh>
          <mesh position={[0, 0.38, 0]} material={mat("#3B3330")}><cylinderGeometry args={[0.05, 0.05, 0.75, 6]} /></mesh>
          <mesh position={[0, 1.6, 0]} material={mat("#5A4030")}><cylinderGeometry args={[0.05, 0.05, 3.2, 6]} /></mesh>
          <mesh position={[0, 3.0, 0]} material={mat(color)} castShadow><coneGeometry args={[2.1, 0.9, 8]} /></mesh>
          {[[-0.9, 0], [0.9, 0], [0, 0.9]].map(([cx, cz], k) => (
            <mesh key={k} position={[cx, 0.45, cz]} material={mat("#2B2320")}><boxGeometry args={[0.45, 0.9, 0.45]} /></mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Lamppost({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.2, 0]} material={mat("#1E2126")}><cylinderGeometry args={[0.09, 0.14, 4.4, 8]} /></mesh>
      <mesh position={[0, 4.6, 0]} material={lampMat}><boxGeometry args={[0.42, 0.55, 0.42]} /></mesh>
      <mesh position={[0, 5.0, 0]} material={mat("#1E2126")}><coneGeometry args={[0.38, 0.4, 4]} /></mesh>
    </group>
  );
}

function StringLights({ from, to, sag = 1.6, n = 28 }: { from: V3; to: V3; sag?: number; n?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(0.14, 6, 4), []);
  const pts = useMemo(() => Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return new THREE.Vector3(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * sag,
      from[2] + (to[2] - from[2]) * t,
    );
  }), [from, to, sag, n]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    pts.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); ref.current!.setMatrixAt(i, m); });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [pts]);
  const wire = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.025, 4, false), [pts, n]);
  return (
    <>
      <mesh geometry={wire} material={mat("#2B2320")} />
      <instancedMesh ref={ref} args={[geo, lampMat, n]} />
    </>
  );
}

function Strollers() {
  const people = useMemo(() => {
    const rng = mulberry32(77);
    const spots: [number, number, number][] = [
      [-18, -14, 0.5], [-17, -12.8, 3.6], [19, 4, -1.2], [20, 5.2, 2.1], [-6, -20, 0.2], [8, -21, 3.0],
      [-21, 9, 1.4], [16, -15, -0.6], [3, -19, 2.5], [22, -6, -1.8], [-12, 18, 0.9], [12, 17, 2.8],
    ];
    return spots.map(([x, z, r], i) => ({ x, z, r, geo: personGeometry(COATS[(i * 3) % COATS.length], HATS[(i * 2) % HATS.length], false), s: 0.95 + rng() * 0.12 }));
  }, []);
  const m = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 }), []);
  return (
    <>
      {people.map((p, i) => (
        <mesh key={i} geometry={p.geo} material={m} position={[p.x, 0, p.z]} rotation={[0, p.r, 0]} scale={p.s} castShadow />
      ))}
    </>
  );
}

/* ─── the square ───────────────────────────────────────────────────────── */
export function OudeMarkt() {
  const s = FAR.oudemarkt;
  // snowed-over cobbles: white, with faint stones and trodden paths
  const cobbles = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    const rng = mulberry32(90);
    ctx.fillStyle = "#EEF0F2";
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 16) {
      for (let x = (y / 16) % 2 ? 8 : 0; x < 512; x += 16) {
        if (rng() < 0.45) continue;
        ctx.strokeStyle = `rgba(150,140,135,${0.08 + rng() * 0.12})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 70; i++) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      ctx.save();
      ctx.translate(rng() * 512, rng() * 512);
      ctx.scale(20 + rng() * 40, 8 + rng() * 16);
      ctx.rotate(rng() * Math.PI);
      g.addColorStop(0, "rgba(140,120,110,0.22)");
      g.addColorStop(1, "rgba(140,120,110,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 4);
    t.anisotropy = 8;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
  }, []);
  // west row (facing +x), east row (facing -x), back row (facing -z): our services as shops
  const west = ["SEO", "Google Ads", "Social Ads", "E-mail"];
  const east = ["Websites", "Webshops", "Automatisering", "Tracking & GA4"];
  const back = ["GEO · AI", "", "Strategie", ""];
  return (
    <group position={[s.x, s.h, s.z]}>
      <mesh position={[0, 0.05, 2]} rotation={[-Math.PI / 2, 0, 0]} material={cobbles} receiveShadow>
        <planeGeometry args={[84, 72]} />
      </mesh>

      {west.map((t, i) => (
        <House key={`w${i}`} position={[-36, 0, -22 + i * 9]} rotation={Math.PI / 2} w={8.6} h={10 + (i % 3) * 1.6} d={10} variant={i} sign={t} />
      ))}
      <House position={[-36, 0, 14]} rotation={Math.PI / 2} w={8.6} h={12.5} d={10} variant={5} />
      <House position={[-36, 0, 23]} rotation={Math.PI / 2} w={8.6} h={10.5} d={10} variant={6} />
      {east.map((t, i) => (
        <House key={`e${i}`} position={[36, 0, -22 + i * 9]} rotation={-Math.PI / 2} w={8.6} h={10.6 + ((i + 1) % 3) * 1.5} d={10} variant={i + 3} sign={t} />
      ))}
      <House position={[36, 0, 14]} rotation={-Math.PI / 2} w={8.6} h={11.5} d={10} variant={1} />
      <House position={[36, 0, 23]} rotation={-Math.PI / 2} w={8.6} h={13} d={10} variant={4} />
      {back.map((t, i) => (
        <House key={`b${i}`} position={[-28 + i * 9.3 + (i > 1 ? 38 : 0), 0, 34]} rotation={Math.PI} w={9} h={11 + (i % 2) * 2} d={10} variant={i + 2} sign={t || undefined} />
      ))}

      <GroteKerk position={[0, 0, 10]} />
      <Rink position={[0, 0, -12]} />
      <ChristmasTree position={[-16, 0, 2]} />
      <Stall position={[16, 0, -2]} rotation={-0.6} sign="Glühwein" />
      <Stall position={[-17, 0, -24]} rotation={0.5} sign="Koek & zopie" />
      <Stall position={[17, 0, -25]} rotation={-0.5} sign="Oliebollen" />
      <Terrace position={[29, 0, -12]} rotation={Math.PI / 2} color="#C21F2E" />
      <Terrace position={[-29, 0, 6]} rotation={-Math.PI / 2} color="#F1EDE3" />
      {[[-16, -12], [16, -12], [-9, -22], [9, -22], [-9, -2], [9, -2]].map(([x, z], i) => (
        <Lamppost key={i} position={[x, 0, z]} />
      ))}
      <StringLights from={[-31, 9.5, -20]} to={[31, 9.5, -20]} sag={2.2} n={34} />
      <StringLights from={[-31, 9.5, -8]} to={[-4.5, 18, 5.6]} sag={1.6} n={22} />
      <StringLights from={[31, 9.5, -8]} to={[4.5, 18, 5.6]} sag={1.6} n={22} />
      <StringLights from={[-31, 10, 4]} to={[31, 10, 4]} sag={2.6} n={34} />
      <Strollers />
    </group>
  );
}
