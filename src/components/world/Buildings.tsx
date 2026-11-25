import { useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { glowMats, lampMat, mat, windowMat } from "./materials";
import { dusk, select, world } from "./store";
import { height, smoothstep, PROJECT_IDS, ROT, SITES, OVERVIEW, type Site } from "./landscape";
import { Board, ChimneyLetters, WallPaint } from "./Signs";
import { Planbureau, Rubberwerkplaats, Uitkijktoren, Verhuizing } from "./Projects";
import { PROJECTS } from "./content";
import { Beam, Box, triangleGeo, Window, type V3 } from "./parts";
import { Yard, type YardItem } from "./Props";
import { materials, wrapMaterial } from "./textures";
import { StaticBatch } from "./StaticBatch";

const CREAM = "#F1E7D6";
const WOOD = "#4A3226";
const GUTTER = "#3B2F2B";

/* ═══ Twents los hoes ════════════════════════════════════════════════ */
export function Farmhouse({ position, rotation = 0, scale = 1, home = false, board }: {
  position: V3; rotation?: number; scale?: number; home?: boolean; board?: { text: string; sub?: string };
}) {
  const M = materials();
  const W = 9;
  const L = 16;
  const WH = 3;
  const RH = 6.6;
  const OV = 0.8;
  const run = W / 2 + OV;
  const slope = Math.hypot(run, RH);
  const ang = Math.atan2(RH, run);
  const gableH = (RH * (W / 2)) / run;
  const geos = useMemo(() => ({ gable: triangleGeo(W, gableH, 0.22) }), [gableH]);
  const chimneyMat = useMemo(() => wrapMaterial(M.brickDark, 2.8, 2.6), [M]);
  const sideWindows = [-5.4, -2.0, 1.6, 5.0];

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* plinth, walls, cream corner stones */}
      <Box p={[0, 0.3, 0]} s={[W + 0.14, 0.6, L + 0.14]} c={M.brickDark} />
      <Box p={[0, WH / 2 + 0.15, 0]} s={[W, WH - 0.3, L]} c={M.brick} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) =>
        [0.8, 1.7, 2.6].map((y) => (
          <Box key={`${sx}${sz}${y}`} p={[sx * (W / 2 - 0.12), y, sz * (L / 2 - 0.12)]} s={[0.3, 0.22, 0.3]} c="#E9DEC9" shadow={false} />
        )),
      )}

      {/* steep thatched roof on two slopes, with gutters along the eaves */}
      {[1, -1].map((sd) => (
        <group key={sd}>
          <group position={[(sd * run) / 2, WH + RH / 2, 0]} rotation={[0, 0, sd * -ang]}>
            <Box p={[0, 0, 0]} s={[slope, 0.46, L + OV * 2]} c={M.thatch} />
          </group>
          <Box p={[(sd * run) / 2, WH + RH / 2 + 0.12, L / 2 + OV + 0.02]} s={[slope + 0.1, 0.22, 0.1]} rot={[0, 0, sd * -ang]} c={CREAM} />
          <Box p={[sd * (run - 0.05), WH - 0.08, 0]} s={[0.16, 0.14, L + OV * 2]} c={GUTTER} />
        </group>
      ))}
      <Box p={[0, WH + RH - 0.02, 0]} s={[0.6, 0.4, L + OV * 2 + 0.05]} c="#5E4430" />
      {/* the little hip at the back (wolfseind) */}
      <mesh geometry={geos.gable} position={[0, WH + RH * 0.62, -L / 2 - OV + 0.25]} rotation={[-0.55, 0, 0]} scale={[0.42, 0.42, 1]} material={M.thatch} castShadow />

      {/* gables: timber at the front, brick at the back */}
      <mesh geometry={geos.gable} position={[0, WH, L / 2 - 0.08]} material={M.wood} castShadow receiveShadow />
      <mesh geometry={geos.gable} position={[0, WH, -L / 2 + 0.08]} material={M.brick} castShadow receiveShadow />

      {/* makelaar with two stylised horse heads, and an "uilenbord" */}
      <group position={[0, WH + RH, L / 2 + OV + 0.06]}>
        <Box p={[0, 0.5, 0]} s={[0.22, 1.6, 0.12]} c={CREAM} />
        <Box p={[0, 1.05, 0]} s={[0.8, 0.14, 0.12]} c={CREAM} />
        {[1, -1].map((sd) => (
          <group key={sd}>
            <Box p={[sd * 0.36, 0.05, 0]} s={[0.5, 0.18, 0.12]} rot={[0, 0, sd * 0.6]} c={CREAM} />
            <Box p={[sd * 0.62, 0.22, 0]} s={[0.24, 0.3, 0.12]} rot={[0, 0, sd * -0.4]} c={CREAM} />
          </group>
        ))}
        <mesh position={[0, -0.85, -0.02]} material={mat("#1F1612")}>
          <circleGeometry args={[0.26, 12]} />
        </mesh>
      </group>

      {/* hayloft windows or the name board */}
      {board ? (
        <Board text={board.text} sub={board.sub} w={6.2} h={1.55} position={[0, WH + 0.62, L / 2 + 0.16]} />
      ) : (
        <>
          <Window p={[-1.15, WH + 1.25, L / 2 + 0.02]} w={0.8} h={0.9} glass={windowMat} />
          <Window p={[1.15, WH + 1.25, L / 2 + 0.02]} w={0.8} h={0.9} glass={windowMat} />
        </>
      )}
      <Window p={[0, WH + 2.9, L / 2 + 0.02]} w={0.55} h={0.6} glass={windowMat} />

      {/* the big barn door (niendeur): arch, leaves, a little half-door beside */}
      <Box p={[0, 1.5, L / 2 + 0.03]} s={[3.7, 3.0, 0.08]} c={CREAM} />
      <mesh position={[0, 2.95, L / 2 + 0.05]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]} material={mat(CREAM)}>
        <cylinderGeometry args={[1.85, 1.85, 0.1, 18, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      <Box p={[-0.84, 1.38, L / 2 + 0.08]} s={[1.6, 2.7, 0.08]} c={M.door} />
      <Box p={[0.84, 1.38, L / 2 + 0.08]} s={[1.6, 2.7, 0.08]} c={M.door} />
      {home && <Box p={[0, 1.38, L / 2 + 0.06]} s={[0.1, 2.7, 0.1]} c={windowMat} shadow={false} />}

      {/* front windows with shutters and flower boxes */}
      {[-3.25, 3.25].map((x) => (
        <group key={x}>
          <Window p={[x, 1.75, L / 2 + 0.02]} w={0.95} h={1.1} glass={windowMat} shutters shutterMat={M.shutter} />
          <Box p={[x, 1.02, L / 2 + 0.28]} s={[1.1, 0.22, 0.26]} c={WOOD} />
          {[-0.36, -0.12, 0.12, 0.36].map((fx, k) => (
            <mesh key={fx} position={[x + fx, 1.2, L / 2 + 0.3]} material={mat(k % 2 ? "#E8B53E" : "#D8484A")}>
              <icosahedronGeometry args={[0.12, 0]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* side windows with hourglass shutters (luiken) */}
      {[1, -1].map((sd) =>
        sideWindows.map((z) => (
          <Window key={`${sd}${z}`} p={[sd * (W / 2 + 0.02), 1.75, z]} side={sd > 0 ? "x" : "-x"} w={0.85} h={1.05} glass={windowMat} shutters shutterMat={M.shutter} />
        )),
      )}

      {/* side door + lean-to (aanbouw) on the back corner */}
      <Box p={[W / 2 + 0.05, 1.2, -1.9]} s={[0.08, 2.3, 1.0]} c={M.door} />
      <group position={[-W / 2 - 1.5, 0, -4.5]}>
        <Box p={[0, 1.15, 0]} s={[3, 2.3, 5]} c={M.brick} />
        <Box p={[-0.15, 2.55, 0]} s={[3.6, 0.2, 5.4]} rot={[0, 0, 0.32]} c={M.tiles} />
        <Window p={[-1.52, 1.3, 0.6]} side="-x" w={0.7} h={0.8} glass={windowMat} />
      </group>

      {/* stoep in klinkers in front of the door */}
      <Box p={[0, 0.03, L / 2 + 1.6]} s={[5.2, 0.08, 2.6]} c={M.paving} shadow={false} />

      {/* chimney with a cap */}
      <group position={[1.5, WH + RH - 0.4, -L / 4]}>
        <mesh material={chimneyMat} castShadow>
          <boxGeometry args={[0.7, 2.6, 0.7]} />
        </mesh>
        <Box p={[0, 1.36, 0]} s={[0.95, 0.14, 0.95]} c="#4A3A34" />
        <Box p={[0, 1.55, 0]} s={[0.5, 0.25, 0.5]} c="#2B2320" />
      </group>
      {home && <Smoke position={[1.5, WH + RH + 1.1, -L / 4]} />}
    </group>
  );
}

/* ─── chimney smoke: slow, warm puffs ────────────────────────────────── */
function Smoke({ position }: { position: V3 }) {
  const group = useRef<THREE.Group>(null);
  const puffs = 7;
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#E8D6C4", transparent: true, opacity: 0.5, flatShading: true, roughness: 1, depthWrite: false }),
    [],
  );
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.5, 0), []);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((c, i) => {
      const k = ((t * 0.12 + i / puffs) % 1 + 1) % 1;
      c.position.set(Math.sin(k * 3 + i) * 0.4 + k * 2.2, k * 7, Math.cos(k * 2 + i) * 0.3);
      c.scale.setScalar(0.5 + k * 2.2);
      c.rotation.set(k * 2 + i, k * 3, 0);
    });
    material.opacity = 0.42 * (1 - dusk() * 0.5);
  });
  return (
    <group ref={group} position={position} userData={{ dynamic: true }}>
      {Array.from({ length: puffs }, (_, i) => (
        <mesh key={i} geometry={geo} material={material} />
      ))}
    </group>
  );
}

/* ─── hooiberg: four poles and a roof that slides over the hay ───────── */
export function Hooiberg({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const M = materials();
  const roof = useMemo(() => new THREE.ConeGeometry(2.75, 1.9, 4).rotateY(Math.PI / 4), []);
  const roofMat = useMemo(() => wrapMaterial(M.thatch, 11, 2.2), [M]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Box p={[x, 2.9, z]} s={[0.2, 5.8, 0.2]} c={WOOD} />
          {[1.5, 2.5, 3.5].map((y) => <Box key={y} p={[x * 1.07, y, z * 1.07]} s={[0.08, 0.08, 0.08]} c="#2B2320" shadow={false} />)}
        </group>
      ))}
      <Box p={[0, 1.35, 0]} s={[3.0, 2.7, 3.0]} c="#E2B85B" />
      <mesh position={[0, 2.85, 0]} material={mat("#EDC873")}>
        <icosahedronGeometry args={[1.5, 0]} />
      </mesh>
      <mesh geometry={roof} position={[0, 4.95, 0]} material={roofMat} castShadow receiveShadow />
      <Box p={[0, 4.05, 0]} s={[3.9, 0.12, 3.9]} c={WOOD} />
    </group>
  );
}

/* ─── lantern on a pole, lights up with the evening ──────────────────── */
export function Lantern({ position, height = 3.2, light = false, beacon = false }: { position: V3; height?: number; light?: boolean; beacon?: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const halo = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const d = smoothstep(0.25, 0.85, dusk());
    if (lightRef.current) lightRef.current.intensity = d * (beacon ? 30 : 22);
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.6 + position[0]) * 0.06);
  });
  const r = beacon ? 0.42 : 0.26;
  return (
    <group position={position}>
      <Box p={[0, height / 2, 0]} s={[0.12, height, 0.12]} c="#2B2320" />
      <Box p={[0, 0.15, 0]} s={[0.3, 0.3, 0.3]} c="#2B2320" />
      <mesh ref={halo} position={[0, height + 0.3, 0]} material={lampMat} userData={{ dynamic: true }}>
        <icosahedronGeometry args={[r, 1]} />
      </mesh>
      {/* lamp housing */}
      <Box p={[0, height + 0.3 + r + 0.08, 0]} s={[r * 2.4, 0.08, r * 2.4]} c="#2B2320" />
      <mesh position={[0, height + 0.3 + r + 0.28, 0]} material={mat("#2B2320")}>
        <coneGeometry args={[r * 1.2, 0.35, 4]} />
      </mesh>
      {light && <pointLight ref={lightRef} position={[0, height + 0.3, 0]} color="#ffb860" distance={beacon ? 22 : 16} decay={1.6} intensity={0} />}
    </group>
  );
}

/* ═══ stenen beltmolen ═══════════════════════════════════════════════ */
export function Windmill({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const M = materials();
  const sails = useRef<THREE.Group>(null);
  const cap = useMemo(() => new THREE.SphereGeometry(2.05, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), []);
  const bodyMat = useMemo(() => wrapMaterial(M.brickDark, 13, 11), [M]);
  const capMat = useMemo(() => wrapMaterial(M.thatch, 13, 3), [M]);
  useFrame((_, dt) => {
    const fast = world.hover === "marketing" || world.focus === "marketing";
    if (sails.current && !world.reduced) sails.current.rotation.z -= Math.min(dt, 0.05) * (fast ? 1.6 : 0.45);
  });
  const SH = 4.4; // stelling height
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* mound (belt) with a brick retaining edge */}
      <mesh position={[0, 0.2, 0]} material={mat("#93A256")} receiveShadow>
        <cylinderGeometry args={[5.5, 7.2, 1.6, 14]} />
      </mesh>
      <mesh position={[0, 6, 0]} material={bodyMat} castShadow receiveShadow>
        <cylinderGeometry args={[1.55, 2.7, 11, 8]} />
      </mesh>
      {/* white band and the "baard" under the cap */}
      <mesh position={[0, 11.35, 0]} material={mat(CREAM)}>
        <cylinderGeometry args={[1.66, 1.66, 0.3, 8]} />
      </mesh>

      {/* gallery (stelling): deck, eight braces, posts and a rail */}
      <mesh position={[0, SH, 0]} material={M.woodLight} castShadow receiveShadow>
        <cylinderGeometry args={[3.9, 3.9, 0.22, 8]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const c = Math.cos(a);
        const s = Math.sin(a);
        return (
          <group key={i}>
            <Beam a={[c * 2.4, 1.2, s * 2.4]} b={[c * 3.6, SH - 0.1, s * 3.6]} t={0.16} c={WOOD} />
            <Box p={[c * 3.75, SH + 0.55, s * 3.75]} s={[0.1, 1.1, 0.1]} c={WOOD} />
          </group>
        );
      })}
      <mesh position={[0, SH + 1.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat(WOOD)}>
        <torusGeometry args={[3.75, 0.05, 4, 8]} />
      </mesh>

      {/* doors and windows */}
      <group rotation={[0, 0, 0]}>
        <Box p={[0, 2.3, 2.56]} s={[1.1, 2.0, 0.12]} c={M.door} />
        <Window p={[0, 7.7, 2.0]} w={0.55} h={0.7} glass={windowMat} />
        <Window p={[0, SH + 1.4, 2.32]} w={0.9} h={1.35} glass={windowMat} />
      </group>
      <group rotation={[0, Math.PI / 2, 0]}>
        <Window p={[0, 5.9, 2.2]} w={0.5} h={0.65} glass={windowMat} />
      </group>
      <Board text="Online marketing" sub="SEO · ADS · SOCIAL · E-MAIL · GEO" w={6.6} h={1.7} position={[0, 5.55, 4.0]} />

      {/* cap (kap) in reed, with the tail (staart) and steering wheel at the back */}
      <mesh geometry={cap} position={[0, 11.5, 0]} scale={[1, 0.95, 1.28]} material={capMat} castShadow />
      <Beam a={[0, 11.8, -2.2]} b={[0, SH + 0.4, -4.4]} t={0.26} c={WOOD} />
      <Beam a={[0.6, 11.4, -1.8]} b={[0, SH + 1.2, -4.2]} t={0.12} c={WOOD} />
      <Beam a={[-0.6, 11.4, -1.8]} b={[0, SH + 1.2, -4.2]} t={0.12} c={WOOD} />
      <mesh position={[0, SH + 0.9, -4.55]} rotation={[0, Math.PI / 2, 0]} material={mat(WOOD)}>
        <torusGeometry args={[0.6, 0.07, 4, 10]} />
      </mesh>

      {/* sails: stocks with a lattice and sail cloth on both sides */}
      <group ref={sails} position={[0, 12.2, 2.5]} rotation={[0, 0, 0.35]} userData={{ dynamic: true }}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mat("#3B2D2A")}>
          <cylinderGeometry args={[0.34, 0.34, 0.7, 8]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
            <Box p={[0, 5.8, 0.05]} s={[0.26, 11.6, 0.26]} c="#4A3328" />
            <mesh position={[1.05, 6.8, 0.16]} material={M.sail}>
              <planeGeometry args={[2.0, 8.6]} />
            </mesh>
            <Box p={[2.05, 6.8, 0.16]} s={[0.08, 8.6, 0.08]} c="#4A3328" shadow={false} />
          </group>
        ))}
      </group>
    </group>
  );
}

/* ═══ textielfabriek: sawtooth roof, water tower and the tall chimney ═ */
const CHIMNEY_R = (y: number) => 1.55 - (0.7 * y) / 30;

export function TextileMill({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const M = materials();
  const teeth = 6;
  const hallW = 26;
  const tw = hallW / teeth;
  const tooth = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(tw, 0);
    s.lineTo(tw, 2.7);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 14, bevelEnabled: false });
    g.translate(0, 0, -7);
    return g;
  }, [tw]);
  const chimneyMat = useMemo(() => wrapMaterial(M.brickChimney, 7.5, 30), [M]);
  // north-light glazing: many small panes, glowing at night
  const sawGlass = useMemo(() => {
    const m = windowMat.clone();
    m.map = windowMat.map!.clone();
    m.emissiveMap = windowMat.emissiveMap!.clone();
    for (const t of [m.map, m.emissiveMap]) { t.repeat.set(9, 1); t.needsUpdate = true; }
    m.userData.glowScale = 0.8;
    glowMats.add(m);
    return m;
  }, []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box p={[0, 0.35, 0]} s={[hallW + 0.2, 0.7, 14.2]} c={M.brickDark} />
      <Box p={[0, 2.95, 0]} s={[hallW, 4.5, 14]} c={M.brickWarm} />
      {/* cream cornice */}
      <Box p={[0, 5.12, 0]} s={[hallW + 0.3, 0.24, 14.3]} c={CREAM} />
      {Array.from({ length: teeth }, (_, i) => {
        const x0 = -hallW / 2 + i * tw;
        return (
          <group key={i}>
            <mesh geometry={tooth} position={[x0, 5.24, 0]} material={M.tilesDark} castShadow receiveShadow />
            <mesh position={[x0 + tw + 0.08, 6.55, 0]} rotation={[0, Math.PI / 2, 0]} material={sawGlass}>
              <planeGeometry args={[13.2, 2.2]} />
            </mesh>
          </group>
        );
      })}
      {/* front: pilasters between tall windows with cream lintels */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -11 + i * 2.75;
        return (
          <group key={i}>
            <Window p={[x, 2.4, 7.0]} w={1.3} h={2.1} glass={windowMat} />
            <Box p={[x, 3.7, 7.08]} s={[1.6, 0.2, 0.14]} c={CREAM} shadow={false} />
            {i < 8 && <Box p={[x + 1.375, 2.3, 7.06]} s={[0.4, 3.2, 0.14]} c={M.brick} />}
          </group>
        );
      })}
      <WallPaint text="Websites · Webshops · Automatisering" w={23} h={1.1} position={[0, 4.4, 7.03]} />
      {/* loading door with canopy on the east end */}
      <Box p={[hallW / 2 + 0.05, 1.6, 2]} s={[0.1, 3.0, 2.8]} c={M.door} />
      <Box p={[hallW / 2 + 0.8, 3.3, 2]} s={[1.6, 0.12, 3.4]} rot={[0, 0, -0.15]} c={M.zinc} />

      {/* office block with an entrance */}
      <group position={[-16.2, 0, 1]}>
        <Box p={[0, 0.35, 0]} s={[6.2, 0.7, 10.2]} c={M.brickDark} />
        <Box p={[0, 5.3, 0]} s={[6, 9.9, 10]} c={M.brick} />
        <Box p={[0, 10.4, 0]} s={[6.5, 0.4, 10.5]} c={CREAM} />
        <Box p={[0, 10.75, 0]} s={[5.8, 0.4, 9.8]} c="#5C4747" />
        {[2.6, 5.4, 8.2].map((y) =>
          [-1.5, 1.5].map((x) => <Window key={`${x}${y}`} p={[x, y, 5.0]} w={1.05} h={1.5} glass={windowMat} />),
        )}
        {[2.6, 5.4, 8.2].map((y) =>
          [-3, 0, 3].map((z) => <Window key={`s${z}${y}`} p={[-3.02, y, z]} side="-x" w={1.0} h={1.5} glass={windowMat} />),
        )}
        <Box p={[0, 1.2, 5.06]} s={[1.3, 2.2, 0.1]} c={M.door} />
        <Box p={[0, 0.12, 5.6]} s={[2.4, 0.24, 1.0]} c="#BFB3A3" />
        <Box p={[0, 2.55, 5.4]} s={[2.0, 0.12, 0.9]} c={M.zinc} />
      </group>

      {/* water tower */}
      <group position={[-4.5, 0, -11]}>
        {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => (
          <Beam key={i} a={[x * 1.6, 0, z * 1.6]} b={[x * 1.1, 9, z * 1.1]} t={0.24} c="#3B3330" />
        ))}
        <mesh position={[0, 10.2, 0]} material={M.zinc} castShadow>
          <cylinderGeometry args={[1.9, 1.9, 2.6, 14]} />
        </mesh>
        <mesh position={[0, 11.9, 0]} material={mat("#3B3330")} castShadow>
          <coneGeometry args={[2.0, 0.9, 14]} />
        </mesh>
      </group>

      {/* chimney: square plinth, tapered shaft, cream bands, crown */}
      <group position={[9, 0, -10.6]}>
        <Box p={[0, 1.4, 0]} s={[3.8, 2.8, 3.8]} c={M.brickDark} />
        <Box p={[0, 2.9, 0]} s={[4.1, 0.25, 4.1]} c={CREAM} />
        <mesh position={[0, 15 + 2.9, 0]} material={chimneyMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.85, 1.55, 30, 16]} />
        </mesh>
        <ChimneyLetters text="Techniek" yFrom={10.9} yTo={25.4} rAt={(y) => CHIMNEY_R(y - 2.9)} faceAngle={0.55} position={[0, 0, 0]} />
        {[27.4, 29.1].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={mat(CREAM)}>
            <cylinderGeometry args={[CHIMNEY_R(y - 2.9) + 0.06, CHIMNEY_R(y - 2.9) + 0.08, 0.35, 16]} />
          </mesh>
        ))}
        <mesh position={[0, 33.1, 0]} material={mat("#3B2D2A")}>
          <cylinderGeometry args={[1.12, 0.95, 0.7, 16]} />
        </mesh>
      </group>
    </group>
  );
}

/* ─── interaction ───────────────────────────────────────────────────── */
// A quiet invitation: a warm pool of light on the yard that breathes, with
// an occasional ripple running outward. It brightens when you hover.
const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const glowFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uSeed;
  uniform float uNight;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;           // 0 centre .. 1 edge
    float breathe = 0.75 + 0.25 * sin(uTime * 0.9 + uSeed * 6.0);
    float pool = smoothstep(1.0, 0.35, r) * (0.06 + 0.05 * uNight) * breathe;
    float wave = fract(uTime / 6.5 + uSeed);      // one slow ripple every few seconds
    float ring = exp(-pow((r - (0.45 + wave * 0.55)) * 14.0, 2.0)) * (1.0 - wave) * 0.16;
    float hover = smoothstep(1.0, 0.25, r) * 0.32 + exp(-pow((r - 0.86) * 12.0, 2.0)) * 0.35;
    float a = (hover + ring * 0.4) * uHover;
    vec3 col = mix(vec3(1.0, 0.82, 0.48), vec3(1.0, 0.9, 0.62), uHover);
    gl_FragColor = vec4(col * a, a);
  }
`;

/* ─── neon: a glowing tube that loops around every clickable place ─── */
const neonVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const neonFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uNight;
  uniform float uSeed;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    // a soft hum, and now and then a pulse of light running round the loop
    float hum = 0.92 + 0.08 * sin(uTime * 7.0 + uSeed * 30.0) * sin(uTime * 2.3);
    float run = fract(vUv.x * 2.0 - uTime * 0.12 + uSeed);
    float pulse = smoothstep(0.0, 0.05, run) * smoothstep(0.16, 0.05, run);
    // quiet by day, a soft glow at night; only a hover makes it sing
    float k = (0.6 + uNight * 0.5) * hum + pulse * 0.4 + uHover * 1.8;
    float a = clamp(0.45 + uNight * 0.25 + uHover * 0.45, 0.0, 1.0);
    gl_FragColor = vec4(uColor * k * a, a);
  }
`;

function NeonRing({ site, glow }: { site: Site; glow: THREE.ShaderMaterial }) {
  const geometry = useMemo(() => {
    const n = 96;
    const r = site.r + 2.8;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      // slightly squarish loop, the way a neon sign would be bent
      const k = 1 + 0.04 * Math.cos(a * 4);
      const x = site.x + Math.cos(a) * r * k;
      const z = site.z + Math.sin(a) * r * k;
      return new THREE.Vector3(x, height(x, z) + 0.18, z);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, "centripetal"), 240, 0.11, 6, true);
  }, [site]);
  const material = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0 },
        uNight: { value: 0 },
        uSeed: { value: glow.uniforms.uSeed.value },
        uColor: { value: new THREE.Color("#FF8FA3") },
      },
      vertexShader: neonVertex,
      fragmentShader: neonFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    [glow],
  );
  useFrame(({ clock }) => {
    const u = material.uniforms;
    u.uTime.value = world.reduced ? 0 : clock.elapsedTime;
    u.uHover.value = glow.uniforms.uHover.value;
    u.uNight.value = world.dusk;
  });
  return <mesh geometry={geometry} material={material} />;
}

let placeSeed = 0;
function Place({ id, site, children }: { id: string; site: Site; children: ReactNode }) {
  const material = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uHover: { value: 0 }, uSeed: { value: (placeSeed++ * 0.37) % 1 }, uNight: { value: 0 } },
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
    [],
  );
  useFrame(({ clock }, dt) => {
    const u = material.uniforms;
    u.uTime.value = world.reduced ? 0 : clock.elapsedTime;
    const on = world.hover === id && world.focus !== id ? 1 : 0;
    u.uHover.value += (on - u.uHover.value) * (1 - Math.exp(-dt * 7));
    u.uNight.value = world.dusk;
    // stay out of the way while a place is open
    material.visible = u.uHover.value > 0.01;
  });
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    world.hover = id;
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    if (world.hover === id) world.hover = null;
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // that was a drag, not a click
    e.stopPropagation();
    select(id);
  };
  const size = (site.r + 5) * 2;
  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      <StaticBatch>{children}</StaticBatch>
      <NeonRing site={site} glow={material} />
      <mesh position={[site.x, site.h + 0.3, site.z]} rotation={[-Math.PI / 2, 0, 0]} material={material} raycast={() => null} renderOrder={2} userData={{ dynamic: true }}>
        <planeGeometry args={[size, size]} />
      </mesh>
    </group>
  );
}

/** Which roof slope faces the overview camera, so the tiled names read from afar. */
function slopeTowardsOverview(rot: number) {
  const camX = Math.sin(OVERVIEW.az);
  const camZ = Math.cos(OVERVIEW.az);
  return Math.cos(rot) * camX - Math.sin(rot) * camZ >= 0 ? 1 : -1;
}

/* ─── what lives on each yard ────────────────────────────────────────── */
const YARDS: Record<string, YardItem[]> = {
  home: [
    ["veggies", 8, -12.5], ["coop", -9.5, -11, 0.4], ["chickens", -6.5, -8.5],
    ["milkstand", -6, 15], ["tractor", 10.5, 9.5, -0.6], ["bike", 2.6, 9.8, 1.2], ["bike", 3.5, 10.1, 1.35],
    ["fruitTree", -14.5, -4], ["fruitTree", -15, 2.5], ["fruitTree", 13.5, -7], ["flowers", 0.6, 12.6],
  ],
  windmill: [["sacks", 8.3, 2, 0.3], ["cart", -8.4, -3, 1.5], ["flowers", 6, -6.5, 0.8]],
  mill: [
    ["truck", 8, 12.5, Math.PI / 2], ["forklift", -2, 11, 0.4], ["pallets", -7, 11.5], ["textileRolls", -11.5, 10.5, 0.2],
    ["pallets", -12, -11, 0.3],
  ],
  "dg-rubber": [["container", -9.5, -1], ["forklift", 2, 9.2, 0.5], ["pallets", 5, -7.5]],
  "gsm-team": [["van", 8.8, 2], ["bikeRack", 3, 5.6], ["bike", 2.1, 6.5, 0.2], ["parcels", 6, 4.8], ["fruitTree", -8, 5.5]],
  reservax: [["pond", -7.5, 0.8], ["picnic", -5, 7, 0.3], ["flowers", 0, 7.4], ["fruitTree", 5.5, -7], ["fruitTree", 2, -8.6], ["picket", 2.5, 9.6]],
  ascendio: [["beehives", -7, 4.5, 0.3], ["fruitTree", 6, -6], ["fruitTree", 8.6, -2.5], ["fruitTree", 3.8, -9], ["picnic", -8.4, 0, 0.8]],
};

export function Landmarks({ lights }: { lights: boolean }) {
  const { windmill, mill, home, projects } = SITES;
  return (
    <group>
      <Place id="marketing" site={windmill}>
        <Windmill position={[windmill.x, windmill.h - 0.6, windmill.z]} rotation={ROT.windmill} />
        <Yard site={windmill} rot={ROT.windmill} items={YARDS.windmill} />
      </Place>
      <Place id="techniek" site={mill}>
        <TextileMill position={[mill.x, mill.h, mill.z]} rotation={ROT.mill} />
        <Yard site={mill} rot={ROT.mill} items={YARDS.mill} />
      </Place>

      <Place id="luminx" site={home}>
        <Farmhouse position={[home.x, home.h, home.z]} rotation={ROT.home} home board={{ text: "LuminX", sub: "ONLINE MARKETING · ENSCHEDE" }} />
        <Hooiberg position={[home.x + 11, home.h, home.z + 3]} rotation={0.2} />
        <BigOak position={[home.x - 11, home.h, home.z + 7]} />
        <Yard site={home} rot={ROT.home} items={YARDS.home} />
      </Place>
      <Lantern position={[home.x - 3, home.h, home.z + 10.5]} light={lights} />
      <Lantern position={[home.x + 4.2, home.h, home.z + 10.5]} />

      {projects.map((s, i) => (
        <Place key={i} id={PROJECT_IDS[i]} site={s}>
          <group position={[s.x, s.h, s.z]} rotation={[0, ROT.projects[i], 0]}>
            {i === 0 && <Rubberwerkplaats />}
            {i === 1 && <Verhuizing roofSide={slopeTowardsOverview(ROT.projects[i])} />}
            {i === 2 && <Planbureau roofSide={slopeTowardsOverview(ROT.projects[i])} />}
            {i === 3 && <Uitkijktoren />}
            <Lantern position={[-7.5, 0, -6.5]} height={5} beacon light={lights} />
          </group>
          <Erfbord site={s} text={PROJECTS[i].title} sub={PROJECTS[i].result} />
          <Yard site={s} rot={ROT.projects[i]} items={YARDS[PROJECT_IDS[i]]} />
        </Place>
      ))}
    </group>
  );
}

/**
 * Erfbord: in Twente every yard carries its name at the entrance. Ours stand
 * at the edge of each yard, turned towards the overview so they read from afar.
 */
function Erfbord({ site, text, sub }: { site: Site; text: string; sub: string }) {
  const dx = Math.sin(OVERVIEW.az);
  const dz = Math.cos(OVERVIEW.az);
  const x = site.x + dx * (site.r + 3.5);
  const z = site.z + dz * (site.r + 3.5);
  return (
    <group position={[x, site.h, z]} rotation={[0, OVERVIEW.az, 0]}>
      {[-3.6, 3.6].map((px) => (
        <Box key={px} p={[px, 1.6, -0.1]} s={[0.22, 3.2, 0.22]} c="#3A2A20" />
      ))}
      <Box p={[0, 3.35, -0.1]} s={[8.2, 0.16, 0.3]} c="#3A2A20" />
      <Board text={text} sub={sub.toUpperCase()} w={7.6} h={1.9} position={[0, 2.25, 0]} bg="#3A001D" fg="#F8E7BE" accent="#FECB66" />
    </group>
  );
}

function BigOak({ position }: { position: V3 }) {
  const crown = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  return (
    <group position={position}>
      <mesh position={[0, 2.2, 0]} material={mat("#5A3F30")} castShadow>
        <cylinderGeometry args={[0.35, 0.6, 4.4, 6]} />
      </mesh>
      <Beam a={[0, 3.8, 0]} b={[1.8, 5.4, 0.8]} t={0.28} c="#5A3F30" />
      <Beam a={[0, 3.6, 0]} b={[-1.9, 5.2, -0.6]} t={0.28} c="#5A3F30" />
      <mesh geometry={crown} position={[0, 6.6, 0]} scale={[4.4, 3.7, 4.2]} material={mat("#C8803A")} castShadow receiveShadow />
      <mesh geometry={crown} position={[2.1, 5.6, 1.2]} scale={[2.6, 2.3, 2.6]} material={mat("#D99A42")} castShadow />
      <mesh geometry={crown} position={[-2.2, 5.9, -0.8]} scale={[2.8, 2.4, 2.6]} material={mat("#B86634")} castShadow />
    </group>
  );
}
