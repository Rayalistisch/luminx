import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FAR, LAND_C } from "./landscape";
import { glowMats, lampMat, mat } from "./materials";
import { mulberry32 } from "./noise";
import { materials } from "./textures";
import { world } from "./store";

// The stadium in Enschede, after its real silhouette: a red horseshoe roof
// carried by a white steel space frame on top, a separate straight main stand
// with a grey roof and open corners, white columns before a red band, two
// round stair towers and a brick entrance block. No logos, no names.

const A = 32; // half length of the stands' inner edge
const B = 21; // half width
const R = 8; // front corner radius
const K = 8; // samples per corner

type P = { x: number; z: number; nx: number; nz: number };

/** Inner edge of the horseshoe: -x side, rounded front corners, +x side. */
function horseshoePath(): P[] {
  const out: P[] = [];
  for (let z = B - 1.5; z > -(B - R); z -= 3.5) out.push({ x: -A, z, nx: -1, nz: 0 });
  for (let k = 0; k <= K; k++) {
    const a = Math.PI + (k / K) * (Math.PI / 2);
    out.push({ x: -(A - R) + Math.cos(a) * R, z: -(B - R) + Math.sin(a) * R, nx: Math.cos(a), nz: Math.sin(a) });
  }
  for (let x = -(A - R) + 3.5; x < A - R; x += 3.5) out.push({ x, z: -B, nx: 0, nz: -1 });
  for (let k = 0; k <= K; k++) {
    const a = Math.PI * 1.5 + (k / K) * (Math.PI / 2);
    out.push({ x: A - R + Math.cos(a) * R, z: -(B - R) + Math.sin(a) * R, nx: Math.cos(a), nz: Math.sin(a) });
  }
  for (let z = -(B - R) + 3.5; z <= B - 1.5; z += 3.5) out.push({ x: A, z, nx: 1, nz: 0 });
  return out;
}

/** Inner edge of the straight main stand along +z. */
function mainPath(): P[] {
  const out: P[] = [];
  for (let x = -(A - 4); x <= A - 4 + 0.01; x += 3.5) out.push({ x, z: B, nx: 0, nz: 1 });
  return out;
}

/** Sweep a profile of [offset, height] pairs along a path. */
function sweep(path: P[], profile: [number, number][], uScale = 4) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const rows = profile.length;
  let u = 0;
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    if (i > 0) {
      const q = path[i - 1];
      const d0 = profile[0][0];
      u += Math.hypot(p.x + p.nx * d0 - (q.x + q.nx * d0), p.z + p.nz * d0 - (q.z + q.nz * d0));
    }
    for (let j = 0; j < rows; j++) {
      const [d, h] = profile[j];
      pos.push(p.x + p.nx * d, h, p.z + p.nz * d);
      uv.push(u / uScale, j / (rows - 1));
    }
  }
  for (let i = 0; i < path.length - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j;
      const b = (i + 1) * rows + j;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const at = (p: P, d: number, h: number) => new THREE.Vector3(p.x + p.nx * d, h, p.z + p.nz * d);

/** Many beams merged into one geometry: the whole space frame is one draw call. */
function beams(list: [THREE.Vector3, THREE.Vector3, number][]) {
  const up = new THREE.Vector3(0, 1, 0);
  const geos = list.map(([a, b, t]) => {
    const d = b.clone().sub(a);
    const len = d.length();
    const g = new THREE.BoxGeometry(t, len, t);
    const q = new THREE.Quaternion().setFromUnitVectors(up, d.normalize());
    g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
    g.deleteAttribute("uv");
    return g;
  });
  return mergeGeometries(geos)!;
}

/** Space frame over a roof: triangulated trusses with top chords and diagonals. */
function spaceFrame(path: P[], dIn: number, dOut: number, hIn: number, hOut: number, rise: number, step = 2) {
  const list: [THREE.Vector3, THREE.Vector3, number][] = [];
  const apex = (p: P) => at(p, (dIn + dOut) / 2, (hIn + hOut) / 2 + rise);
  for (let i = 0; i < path.length; i += step) {
    const p = path[i];
    const a = at(p, dIn, hIn);
    const c = at(p, dOut, hOut);
    const b = apex(p);
    list.push([a, b, 0.32], [b, c, 0.32], [a, c, 0.26]);
    const n = path[i + step];
    if (n) {
      const b2 = apex(n);
      list.push([b, b2, 0.28], [a, b2, 0.18], [c, b2, 0.18], [a, at(n, dIn, hIn), 0.2], [c, at(n, dOut, hOut), 0.2]);
    }
  }
  return beams(list);
}

function canvasTex(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

export function Stadium() {
  const s = FAR.stadium;
  // the front (horseshoe long side, -z) faces the land
  const rot = Math.atan2(LAND_C.x - s.x, LAND_C.z - s.z) + Math.PI;

  const parts = useMemo(() => {
    const hs = horseshoePath();
    const ms = mainPath();

    const seats = canvasTex(256, 256, (ctx) => {
      for (let r = 0; r < 16; r++) {
        ctx.fillStyle = r === 9 || r === 10 ? "#EDE6DF" : r % 2 ? "#C42430" : "#B11F2B";
        ctx.fillRect(0, r * 16, 256, 12);
        ctx.fillStyle = "#3A1418";
        ctx.fillRect(0, r * 16 + 12, 256, 4);
      }
      ctx.fillStyle = "#5C4A48";
      for (let x = 0; x < 256; x += 64) ctx.fillRect(x, 0, 5, 256);
    });
    const roofRed = canvasTex(256, 128, (ctx) => {
      for (let x = 0; x < 256; x += 32) {
        ctx.fillStyle = (x / 32) % 2 ? "#E24A33" : "#D93F2B";
        ctx.fillRect(x, 0, 32, 128);
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(x, 0, 2, 128);
      }
      for (let y = 0; y < 128; y += 21) {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(0, y, 256, 2);
      }
    });
    const roofGrey = canvasTex(256, 128, (ctx) => {
      ctx.fillStyle = "#B9BCBE";
      ctx.fillRect(0, 0, 256, 128);
      for (let x = 0; x < 256; x += 16) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(x, 0, 2, 128);
      }
      ctx.fillStyle = "#8E9396";
      ctx.fillRect(0, 50, 256, 12);
    });
    const facadeMap = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#2E333B";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#4D5560";
      for (let x = 0; x < 256; x += 16) ctx.fillRect(x, 96, 2, 160);
      for (let y = 120; y < 256; y += 40) ctx.fillRect(0, y, 256, 2);
      ctx.fillStyle = "#D7242F";
      ctx.fillRect(0, 0, 256, 88);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let x = 0; x < 256; x += 8) ctx.fillRect(x, 0, 2, 88);
      ctx.fillStyle = "#EDEBE7";
      ctx.fillRect(0, 88, 256, 8);
    });
    const facadeGlow = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#FFC680";
      for (let x = 0; x < 256; x += 16) ctx.fillRect(x + 3, 124, 10, 110);
    });
    const facade = new THREE.MeshStandardMaterial({ map: facadeMap, emissive: new THREE.Color("#ffffff"), emissiveMap: facadeGlow, emissiveIntensity: 0.05, roughness: 0.45, side: THREE.DoubleSide });
    facade.userData.glowScale = 0.35;
    glowMats.add(facade);

    const pitchTex = canvasTex(512, 340, (ctx) => {
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = i % 2 ? "#4C8F3C" : "#589C45";
        ctx.fillRect(i * 32, 0, 32, 340);
      }
      ctx.strokeStyle = "#F4F4EE";
      ctx.lineWidth = 3;
      ctx.strokeRect(16, 16, 480, 308);
      ctx.beginPath(); ctx.moveTo(256, 16); ctx.lineTo(256, 324); ctx.stroke();
      ctx.beginPath(); ctx.arc(256, 170, 44, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeRect(16, 90, 72, 160);
      ctx.strokeRect(424, 90, 72, 160);
      ctx.strokeRect(16, 135, 26, 70);
      ctx.strokeRect(470, 135, 26, 70);
    });

    const standProfile: [number, number][] = [[0, 1.2], [3, 3.0], [6, 5.0], [9, 7.0]];
    const upperProfile: [number, number][] = [[9.3, 9.2], [12, 11.6], [15, 14.2], [17.5, 16.4]];
    const geo = {
      hsLower: sweep(hs, standProfile, 3),
      hsBoxes: sweep(hs, [[9, 7.0], [9.3, 9.2]], 2),
      hsUpper: sweep(hs, upperProfile, 3),
      hsBack: sweep(hs, [[17.5, 16.4], [19.2, 17.6]], 3),
      hsFacade: sweep(hs, [[19.6, 0], [19.6, 18.6]], 6),
      hsRoof: sweep(hs, [[4.5, 19.6], [12, 19.3], [21, 18.8]], 5),
      hsEdge: sweep(hs, [[4.3, 19.2], [4.7, 19.2]], 4),
      hsFrame: spaceFrame(hs, 5.5, 20.5, 19.7, 18.9, 5.5, 2),
      hsColumns: beams(hs.filter((_, i) => i % 2 === 0).map((p) => [at(p, 21.4, 0), at(p, 20.4, 18.8), 0.7] as [THREE.Vector3, THREE.Vector3, number])),
      msLower: sweep(ms, standProfile, 3),
      msBoxes: sweep(ms, [[9, 7.0], [9.3, 9.2]], 2),
      msUpper: sweep(ms, upperProfile, 3),
      msFacade: sweep(ms, [[19.6, 0], [19.6, 18.6]], 6),
      msRoof: sweep(ms, [[4.5, 19.2], [21, 19.2]], 5),
      msEdge: sweep(ms, [[4.3, 18.8], [4.7, 18.8]], 4),
      msFrame: spaceFrame(ms, 7, 18, 19.3, 19.3, 4.5, 4),
    };
    const boxesMat = new THREE.MeshStandardMaterial({ color: "#20242B", emissive: new THREE.Color("#FFC27A"), emissiveIntensity: 0.05, roughness: 0.3, side: THREE.DoubleSide });
    boxesMat.userData.glowScale = 0.4;
    glowMats.add(boxesMat);
    return {
      geo,
      facade,
      boxesMat,
      roofRedMat: new THREE.MeshStandardMaterial({ map: roofRed, roughness: 0.55, side: THREE.DoubleSide }),
      roofGreyMat: new THREE.MeshStandardMaterial({ map: roofGrey, roughness: 0.6, side: THREE.DoubleSide }),
      steel: new THREE.MeshStandardMaterial({ color: "#E1E3E4", metalness: 0.35, roughness: 0.4 }),
      seatsMat: new THREE.MeshStandardMaterial({ map: seats, roughness: 0.7, side: THREE.DoubleSide }),
      pitch: new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.9 }),
      columns: new THREE.MeshStandardMaterial({ color: "#EEEDEA", roughness: 0.5 }),
    };
  }, []);

  const lights = useRef<THREE.Group>(null);
  useFrame(() => {
    if (lights.current) lights.current.visible = world.dusk > 0.3;
  });

  const M = materials();
  const front = -(B + 19.6);

  return (
    <group position={[s.x, s.h, s.z]} rotation={[0, rot, 0]}>
      {/* horseshoe */}
      <mesh geometry={parts.geo.hsFacade} material={parts.facade} castShadow receiveShadow />
      <mesh geometry={parts.geo.hsColumns} material={parts.columns} castShadow />
      <mesh geometry={parts.geo.hsLower} material={parts.seatsMat} receiveShadow />
      <mesh geometry={parts.geo.hsBoxes} material={parts.boxesMat} />
      <mesh geometry={parts.geo.hsUpper} material={parts.seatsMat} receiveShadow />
      <mesh geometry={parts.geo.hsBack} material={mat("#7F1621")} />
      <mesh geometry={parts.geo.hsRoof} material={parts.roofRedMat} castShadow receiveShadow />
      <mesh geometry={parts.geo.hsFrame} material={parts.steel} castShadow />

      {/* main stand with the grey roof */}
      <mesh geometry={parts.geo.msFacade} material={parts.facade} castShadow />
      <mesh geometry={parts.geo.msLower} material={parts.seatsMat} receiveShadow />
      <mesh geometry={parts.geo.msBoxes} material={parts.boxesMat} />
      <mesh geometry={parts.geo.msUpper} material={parts.seatsMat} receiveShadow />
      <mesh geometry={parts.geo.msRoof} material={parts.roofGreyMat} castShadow receiveShadow />
      <mesh geometry={parts.geo.msFrame} material={parts.steel} castShadow />

      <group ref={lights} userData={{ dynamic: true }}>
        <mesh geometry={parts.geo.hsEdge} material={lampMat} />
        <mesh geometry={parts.geo.msEdge} material={lampMat} />
      </group>

      {/* the pitch and goals */}
      <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={parts.pitch} receiveShadow>
        <planeGeometry args={[A * 2 - 2, B * 2 - 2]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * (A - 3), 1.0, 0]}>
          <mesh position={[0, 1.2, -3.6]} material={mat("#FFFFFF")}><boxGeometry args={[0.14, 2.4, 0.14]} /></mesh>
          <mesh position={[0, 1.2, 3.6]} material={mat("#FFFFFF")}><boxGeometry args={[0.14, 2.4, 0.14]} /></mesh>
          <mesh position={[0, 2.4, 0]} material={mat("#FFFFFF")}><boxGeometry args={[0.14, 0.14, 7.3]} /></mesh>
        </group>
      ))}

      {/* two round stair towers and the brick entrance block at the front */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * A * 0.62, 0, front - 4]}>
          <mesh position={[0, 8.6, 0]} material={mat("#E4E5E3", 0.5)} castShadow>
            <cylinderGeometry args={[3.1, 3.1, 17.2, 20]} />
          </mesh>
          {[3, 6, 9, 12, 15].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={mat("#B9BDC0")}>
              <cylinderGeometry args={[3.22, 3.22, 0.5, 20]} />
            </mesh>
          ))}
          <mesh position={[0, 17.5, 0]} material={mat("#9DA2A6")}>
            <cylinderGeometry args={[3.4, 3.4, 0.6, 20]} />
          </mesh>
          <mesh position={[0, 8.6, -3.12]} material={mat("#C21F2E")}>
            <boxGeometry args={[1.4, 9, 0.12]} />
          </mesh>
        </group>
      ))}
      <group position={[0, 0, front - 3]}>
        <mesh position={[0, 4.6, 0]} material={M.brickWarm} castShadow>
          <boxGeometry args={[26, 9.2, 5.5]} />
        </mesh>
        <mesh position={[0, 4.4, -2.8]} material={mat("#2E333B", 0.3)}>
          <boxGeometry args={[19, 4.2, 0.1]} />
        </mesh>
        <mesh position={[0, 9.4, 0]} material={mat("#6E3A2C")}>
          <boxGeometry args={[26.6, 0.4, 6]} />
        </mesh>
      </group>
      <mesh position={[0, 0.06, front - 12]} rotation={[-Math.PI / 2, 0, 0]} material={mat("#8C8A86")} receiveShadow>
        <planeGeometry args={[70, 10]} />
      </mesh>

      <Parking z={front - 24} />
      <Railway z={B + 30} />
    </group>
  );
}

/* ─── a car park in front: rows of cars, lines and lamp posts ──────────── */
function Parking({ z }: { z: number }) {
  const cars = useRef<THREE.InstancedMesh>(null);
  const list = useMemo(() => {
    const rng = mulberry32(19);
    const out: { x: number; z: number; r: number; c: string }[] = [];
    const cols = ["#F2F0EC", "#2B2F36", "#8C9298", "#1E2126", "#3E5A7A", "#D9CFC2", "#2B2F36"];
    for (let row = 0; row < 5; row++) {
      for (let k = 0; k < 22; k++) {
        if (rng() < 0.25) continue;
        out.push({ x: -40 + k * 3.8, z: z - 12 + row * 6, r: row % 2 ? Math.PI : 0, c: cols[Math.floor(rng() * cols.length)] });
      }
    }
    return out;
  }, [z]);
  const geo = useMemo(() => {
    const body = new THREE.BoxGeometry(1.9, 0.75, 4.1).translate(0, 0.6, 0);
    const cabin = new THREE.BoxGeometry(1.7, 0.6, 2.2).translate(0, 1.25, -0.2);
    const g = mergeGeometries([body.toNonIndexed(), cabin.toNonIndexed()])!;
    g.computeVertexNormals();
    return g;
  }, []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.3, flatShading: true }), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    list.forEach((it, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.r);
      m.compose(new THREE.Vector3(it.x, 0, it.z), q, new THREE.Vector3(1, 1, 1));
      cars.current!.setMatrixAt(i, m);
      cars.current!.setColorAt(i, c.set(it.c));
    });
    cars.current!.instanceMatrix.needsUpdate = true;
    if (cars.current!.instanceColor) cars.current!.instanceColor.needsUpdate = true;
    cars.current!.computeBoundingSphere();
  }, [list]);
  const lines = useMemo(() => canvasTex(256, 128, (ctx) => {
    ctx.fillStyle = "#4E5155";
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "#E8E6E0";
    for (let x = 0; x < 256; x += 12) { ctx.fillRect(x, 0, 2, 22); ctx.fillRect(x, 106, 2, 22); }
  }, [3, 1]), []);
  return (
    <group>
      <mesh position={[0, 0.07, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[92, 34]} />
        <meshStandardMaterial map={lines} roughness={0.95} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <instancedMesh ref={cars} args={[geo, material, list.length]} castShadow />
      {[-30, -10, 10, 30].map((x) => (
        <group key={x} position={[x, 0, z]}>
          <mesh position={[0, 4, 0]} material={mat("#3B3F45")}><cylinderGeometry args={[0.12, 0.16, 8, 6]} /></mesh>
          <mesh position={[0, 8.1, 0]} material={lampMat}><boxGeometry args={[1.2, 0.25, 0.5]} /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── the railway behind the main stand, with the odd train passing ──── */
function Railway({ z }: { z: number }) {
  const train = useRef<THREE.Group>(null);
  const len = 200;
  useFrame(({ clock }) => {
    if (!train.current) return;
    const t = world.reduced ? 0 : clock.elapsedTime;
    const cycle = (t % 40) / 40;
    train.current.position.x = -len / 2 - 30 + cycle * (len + 60);
  });
  const sleepers = useMemo(() => canvasTex(256, 32, (ctx) => {
    ctx.fillStyle = "#6E655C";
    ctx.fillRect(0, 0, 256, 32);
    ctx.fillStyle = "#4A3A30";
    for (let x = 0; x < 256; x += 10) ctx.fillRect(x, 4, 5, 24);
  }, [40, 1]), []);
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[len, 3]} />
        <meshStandardMaterial map={sleepers} roughness={1} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {[-0.7, 0.7].map((zz) => (
        <mesh key={zz} position={[0, 0.25, zz]} material={mat("#9DA2A6", 0.3)}>
          <boxGeometry args={[len, 0.12, 0.12]} />
        </mesh>
      ))}
      <group ref={train} userData={{ dynamic: true }}>
        {[0, 1, 2].map((k) => (
          <group key={k} position={[-k * 13.5, 0, 0]}>
            <mesh position={[0, 2.2, 0]} material={mat("#F1EDE3", 0.5)} castShadow>
              <boxGeometry args={[13, 3.4, 2.9]} />
            </mesh>
            <mesh position={[0, 1.2, 0]} material={mat("#C21F2E")}>
              <boxGeometry args={[13.05, 0.5, 2.95]} />
            </mesh>
            <mesh position={[0, 2.7, 0]} material={mat("#2E333B", 0.3)}>
              <boxGeometry args={[12, 0.9, 2.95]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
