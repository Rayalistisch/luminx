import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FAR, SITES, ROT, LAND_C } from "./landscape";
import { glowMats, lampMat, mat, windowMat } from "./materials";
import { mulberry32 } from "./noise";
import { Box, type V3 } from "./parts";
import { materials, wrapMaterial } from "./textures";
import { world } from "./store";
import { Stadium } from "./Stadium";

// Twente on the horizon: the stadium in Enschede red, a brewery's tanks,
// the city lights, Oldenzaal's basilica, a village spire, and the Twentse Ros
// flying from the flagpoles. Distant, unclickable, unmistakable.

const faceCentre = (x: number, z: number) => Math.atan2(LAND_C.x - x, LAND_C.z - z);

/** A window texture tiled across a facade, glowing with the others at dusk. */
function useFacadeGlass(cols: number, rows: number, scale = 0.5) {
  return useMemo(() => {
    const m = windowMat.clone();
    m.map = windowMat.map!.clone();
    m.emissiveMap = windowMat.emissiveMap!.clone();
    for (const t of [m.map, m.emissiveMap]) { t.repeat.set(cols, rows); t.needsUpdate = true; }
    m.userData.glowScale = scale;
    glowMats.add(m);
    return m;
  }, [cols, rows, scale]);
}

/* ─── city edge: a handful of towers, lit windows after dark ──────────── */
function Skyline() {
  const s = FAR.skyline;
  const glass = useFacadeGlass(4, 8, 0.4);
  const blocks = useMemo(() => {
    const rng = mulberry32(31);
    return Array.from({ length: 5 }, (_, i) => ({
      x: (i - 2) * 11 + (rng() - 0.5) * 4,
      z: (rng() - 0.5) * 18,
      w: 6 + rng() * 5,
      d: 6 + rng() * 4,
      h: 10 + rng() * 12 + (i === 2 ? 10 : 0),
      c: ["#B7A89A", "#8E7E72", "#C9BCB0", "#7E6E64"][i % 4],
    }));
  }, []);
  return (
    <group position={[s.x, s.h, s.z]} rotation={[0, faceCentre(s.x, s.z), 0]}>
      {blocks.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <Box p={[0, b.h / 2, 0]} s={[b.w, b.h, b.d]} c={b.c} />
          <mesh position={[0, b.h / 2, b.d / 2 + 0.1]} material={glass}>
            <planeGeometry args={[b.w * 0.86, b.h * 0.9]} />
          </mesh>
          <Box p={[0, b.h + 0.3, 0]} s={[b.w + 0.3, 0.6, b.d + 0.3]} c="#5A4E48" />
        </group>
      ))}
    </group>
  );
}

/* ─── brewery: stainless fermentation tanks and a brick brewhouse ───── */
function Brewery() {
  const s = FAR.brewery;
  const M = materials();
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#DCE1E3", metalness: 0.55, roughness: 0.32 }), []);
  const glass = useFacadeGlass(8, 3);
  const brick = useMemo(() => wrapMaterial(M.brickWarm, 30, 14), [M]);
  return (
    <group position={[s.x, s.h, s.z]} rotation={[0, faceCentre(s.x, s.z), 0]}>
      <Box p={[-8, 7, 0]} s={[22, 14, 16]} c={M.brickWarm} />
      <Box p={[-8, 14.3, 0]} s={[22.6, 0.6, 16.6]} c="#2E6E45" />
      <mesh position={[-8, 7, 8.1]} material={glass}>
        <planeGeometry args={[19, 10]} />
      </mesh>
      {/* two rows of tall tanks with cone tops */}
      {Array.from({ length: 10 }, (_, i) => {
        const x = 8 + (i % 5) * 5.4;
        const z = i < 5 ? -4 : 4;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 11, 0]} material={steel} castShadow>
              <cylinderGeometry args={[2.3, 2.3, 18, 16]} />
            </mesh>
            <mesh position={[0, 20.9, 0]} material={steel}>
              <coneGeometry args={[2.3, 1.8, 16]} />
            </mesh>
            <mesh position={[0, 1, 0]} material={mat("#4A4440")}>
              <cylinderGeometry args={[1.2, 1.6, 2, 8]} />
            </mesh>
          </group>
        );
      })}
      {/* catwalk on top of the tanks */}
      <Box p={[18.8, 21.2, 0]} s={[25, 0.3, 1.2]} c="#3B3330" />
      {/* the brewhouse chimney */}
      <mesh position={[-16, 15, -6]} material={brick} castShadow>
        <cylinderGeometry args={[1.0, 1.6, 30, 12]} />
      </mesh>
    </group>
  );
}

/* ─── Plechelmusbasiliek, Oldenzaal: the heavy Romanesque tower ─────── */
function Basilica() {
  const s = FAR.basilica;
  const stone = "#9C8B78";
  const roof = useMemo(() => new THREE.ConeGeometry(7.4, 6, 4).rotateY(Math.PI / 4), []);
  return (
    <group position={[s.x, s.h, s.z]} rotation={[0, faceCentre(s.x, s.z), 0]}>
      <Box p={[0, 16, 10]} s={[10, 32, 10]} c={stone} />
      <Box p={[0, 32.3, 10]} s={[10.6, 0.6, 10.6]} c="#7E6E60" />
      <mesh geometry={roof} position={[0, 35.6, 10]} material={mat("#4F5A5A")} castShadow />
      {[10, 18, 26].map((y) => (
        <Box key={y} p={[0, y, 15.04]} s={[1.6, 3, 0.1]} c="#2A2420" shadow={false} />
      ))}
      {/* nave and aisles */}
      <Box p={[0, 9, -6]} s={[12, 18, 24]} c={stone} />
      <Box p={[0, 18.5, -6]} s={[12.4, 1, 24.4]} c="#4F5A5A" />
      <Box p={[9, 5, -6]} s={[6, 10, 22]} c="#8E7D6C" />
      <Box p={[-9, 5, -6]} s={[6, 10, 22]} c="#8E7D6C" />
    </group>
  );
}

/* ─── a village with its church spire ─────────────────────────────────── */
function Village() {
  const s = FAR.village;
  const M = materials();
  const houses = useMemo(() => {
    const rng = mulberry32(8);
    return Array.from({ length: 11 }, () => ({
      x: (rng() - 0.5) * 36,
      z: (rng() - 0.5) * 26,
      r: rng() * Math.PI,
      s: 0.8 + rng() * 0.5,
    }));
  }, []);
  const spire = useMemo(() => new THREE.ConeGeometry(2.6, 12, 8), []);
  return (
    <group position={[s.x, s.h, s.z]}>
      {houses.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.r, 0]} scale={h.s}>
          <Box p={[0, 1.6, 0]} s={[5, 3.2, 7]} c={M.brick} />
          <mesh position={[0, 3.2, 0]} rotation={[0, 0, 0]} material={M.tiles} castShadow>
            <cylinderGeometry args={[0.01, 3.8, 3.2, 4, 1, false, Math.PI / 4]} />
          </mesh>
        </group>
      ))}
      <Box p={[0, 9, 0]} s={[5, 18, 5]} c="#9A8A7A" />
      <mesh geometry={spire} position={[0, 24, 0]} material={mat("#45514F")} castShadow />
      <Box p={[0, 6, -9]} s={[7, 12, 14]} c="#9A8A7A" />
    </group>
  );
}

/* ─── Twentse vlag: red with the white rearing horse (Twentse Ros) ─── */
function useFlagTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 160;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#C8202F";
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 256, 18);
    ctx.fillRect(0, 142, 256, 18);
    // a stylised rearing horse
    ctx.save();
    ctx.translate(128, 84);
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(0, 6, 34, 15, -0.35, 0, Math.PI * 2); // body
    ctx.fill();
    ctx.beginPath(); // neck + head
    ctx.moveTo(20, -4);
    ctx.lineTo(34, -36);
    ctx.lineTo(50, -40);
    ctx.lineTo(48, -30);
    ctx.lineTo(36, -26);
    ctx.lineTo(30, 4);
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#FFFFFF";
    for (const [x0, y0, x1, y1] of [[22, 4, 40, -14], [16, 8, 30, -18], [-22, 16, -26, 44], [-12, 18, -6, 46]]) {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-32, 0); ctx.quadraticCurveTo(-50, 8, -46, 30); ctx.stroke(); // tail
    ctx.restore();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function Flag({ position, rotation = 0, tex }: { position: V3; rotation?: number; tex: THREE.Texture }) {
  const geo = useMemo(() => new THREE.PlaneGeometry(3.4, 2.2, 14, 6).translate(1.7, 0, 0), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.85 }), [tex]);
  const seed = position[0] * 0.3;
  useFrame(({ clock }) => {
    if (world.reduced) return;
    const t = clock.elapsedTime;
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      p.setZ(i, Math.sin(x * 1.6 - t * 4 + seed) * 0.22 * (x / 3.4) + Math.sin(y * 2 + t * 2) * 0.05 * (x / 3.4));
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 4, 0]} material={mat("#F1ECE2")} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 8, 6]} />
      </mesh>
      <mesh position={[0, 8.05, 0]} material={mat("#C9A54C")}>
        <sphereGeometry args={[0.14, 8, 6]} />
      </mesh>
      <mesh geometry={geo} material={material} position={[0.05, 6.8, 0]} castShadow userData={{ dynamic: true }} />
    </group>
  );
}

export function TwenteLandmarks() {
  const flag = useFlagTexture();
  const { home, windmill } = SITES;
  return (
    <group>
      <Stadium />
      <Skyline />
      <Brewery />
      <Basilica />
      <Village />
      <Flag tex={flag} position={[home.x + 6.5, home.h, home.z + 11.5]} rotation={-0.4} />
      <Flag tex={flag} position={[windmill.x + 6.8, windmill.h, windmill.z + 5]} rotation={ROT.windmill - 0.6} />
    </group>
  );
}
