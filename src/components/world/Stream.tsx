import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRIDGE, height, roadDist, STREAM_H, STREAM_PTS } from "./landscape";
import { mat, skyUniforms } from "./materials";
import { mulberry32 } from "./noise";
import { world } from "./store";

const vertex = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform float uTime;
  uniform float uDusk;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    float edge = abs(vUv.y - 0.5) * 2.0;
    vec3 col = mix(uDeep, uShallow, smoothstep(0.25, 1.0, edge));

    // the sky in the water, stronger at grazing angles
    vec3 V = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - max(V.y, 0.0), 2.5);
    col = mix(col, uSky * 0.75, 0.08 + 0.3 * fres);

    // current: long ripples drifting downstream, little glints on top
    float flow = vUv.x - uTime * 0.45;
    float w1 = sin(flow * 9.0 + sin(vUv.y * 7.0 + uTime * 0.8) * 1.4);
    float w2 = sin(vUv.x * 31.0 - uTime * 1.7 + vUv.y * 11.0);
    float glint = smoothstep(0.9, 1.0, w1 * w2);
    vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
    float spec = pow(max(dot(R, normalize(uSunDir)), 0.0), 140.0) * smoothstep(-0.02, 0.06, uSunDir.y);
    col += uSun * (glint * 0.28 + spec * (0.45 + w1 * 0.2));

    // soft foam where water meets the bank
    col += vec3(1.0, 0.95, 0.85) * smoothstep(0.9, 1.0, edge) * 0.1;
    col *= mix(1.0, 0.3, uDusk);

    gl_FragColor = vec4(col, 0.94);
    #include <fog_fragment>
  }
`;

export function Stream({ detail = true }: { detail?: boolean }) {
  const { geometry, uniforms, material } = useMemo(() => {
    const n = STREAM_PTS.length;
    const verts: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    const side = new THREE.Vector3();
    let along = 0;
    for (let i = 0; i < n; i++) {
      const p = STREAM_PTS[i];
      const q = STREAM_PTS[Math.min(n - 1, i + 1)];
      const o = STREAM_PTS[Math.max(0, i - 1)];
      side.set(q.z - o.z, 0, -(q.x - o.x)).normalize();
      // the beek breathes: wider in the bends, narrower in the straights
      const half = 2.6 + Math.sin(i * 0.05) * 0.5;
      if (i > 0) along += p.distanceTo(STREAM_PTS[i - 1]);
      for (const f of [-1, 1]) {
        verts.push(p.x + side.x * half * f, STREAM_H[i], p.z + side.z * half * f);
        uvs.push(along / 9, f < 0 ? 0 : 1);
      }
      if (i < n - 1) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();

    const u = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uDusk: { value: 0 },
        uDeep: { value: new THREE.Color("#163F48") },
        uShallow: { value: new THREE.Color("#2F6A63") },
        uSky: { value: new THREE.Color() },
        uSun: { value: new THREE.Color() },
        uSunDir: { value: new THREE.Vector3() },
      },
    ]);
    const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vertex, fragmentShader: fragment, fog: true, transparent: true, depthWrite: false });
    return { geometry: g, uniforms: m.uniforms as typeof u, material: m };
  }, []);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uDusk.value = world.dusk;
    uniforms.uSky.value.copy(skyUniforms.uMid.value).lerp(skyUniforms.uHorizon.value, 0.5);
    uniforms.uSun.value.copy(skyUniforms.uSunColor.value);
    uniforms.uSunDir.value.copy(skyUniforms.uSunDir.value);
  });

  return (
    <group>
      <mesh geometry={geometry} material={material} renderOrder={1} />
      {detail && <Reeds />}
      <Willows />
      <Bridge />
    </group>
  );
}

/* ─── rietkraag along the banks ─────────────────────────────────────── */
function Reeds() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const rng = mulberry32(42);
    const out: { x: number; y: number; z: number; s: number; r: number; c: number }[] = [];
    const side = new THREE.Vector3();
    for (let i = 2; i < STREAM_PTS.length - 2; i += 1) {
      if (rng() < 0.45) continue;
      const p = STREAM_PTS[i];
      if (Math.hypot(p.x * 0.9, p.z + 52) > 250) continue;
      const q = STREAM_PTS[i + 1];
      const o = STREAM_PTS[i - 1];
      side.set(q.z - o.z, 0, -(q.x - o.x)).normalize();
      const f = rng() < 0.5 ? -1 : 1;
      const off = 2.7 + rng() * 1.6;
      const x = p.x + side.x * off * f;
      const z = p.z + side.z * off * f;
      if (roadDist(x, z) < 6) continue;
      out.push({ x, z, y: height(x, z), s: 0.7 + rng() * 0.7, r: rng() * Math.PI, c: rng() });
    }
    return out;
  }, []);
  const geo = useMemo(() => new THREE.ConeGeometry(0.16, 2.2, 4).translate(0, 1.1, 0), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();
    const cols = ["#B9A35C", "#A89850", "#C8AE62", "#8E8E4A"];
    items.forEach((it, i) => {
      q.setFromEuler(e.set((it.c - 0.5) * 0.4, it.r, (it.c - 0.5) * 0.3));
      m.compose(new THREE.Vector3(it.x, it.y - 0.2, it.z), q, new THREE.Vector3(1, it.s, 1));
      ref.current!.setMatrixAt(i, m);
      ref.current!.setColorAt(i, c.set(cols[Math.floor(it.c * cols.length)]));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, material, items.length]} castShadow />;
}

/* ─── knotwilgen: pollard willows, the beek's faithful guards ───────── */
function Willows() {
  const items = useMemo(() => {
    const rng = mulberry32(9);
    const out: [number, number, number, number][] = [];
    const side = new THREE.Vector3();
    for (let i = 20; i < STREAM_PTS.length - 20; i += 22) {
      const p = STREAM_PTS[i];
      if (Math.hypot(p.x * 0.9, p.z + 52) > 220) continue;
      const q = STREAM_PTS[i + 1];
      const o = STREAM_PTS[i - 1];
      side.set(q.z - o.z, 0, -(q.x - o.x)).normalize();
      const f = (i / 22) % 2 === 0 ? 1 : -1;
      const x = p.x + side.x * 5.2 * f;
      const z = p.z + side.z * 5.2 * f;
      if (roadDist(x, z) < 7) continue;
      out.push([x, height(x, z), z, 0.8 + rng() * 0.4]);
    }
    return out;
  }, []);
  const crown = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  return (
    <group>
      {items.map(([x, y, z, s], i) => (
        <group key={i} position={[x, y, z]} scale={s}>
          <mesh position={[0, 1.1, 0]} material={mat("#5B4636")} castShadow>
            <cylinderGeometry args={[0.55, 0.7, 2.4, 7]} />
          </mesh>
          <mesh position={[0, 2.45, 0]} material={mat("#4E3B2E")}>
            <cylinderGeometry args={[0.75, 0.55, 0.4, 7]} />
          </mesh>
          <mesh geometry={crown} position={[0, 3.6, 0]} scale={[1.9, 1.5, 1.9]} material={mat(i % 3 === 0 ? "#C9A54C" : "#9AA866")} castShadow />
        </group>
      ))}
    </group>
  );
}

/* ─── wooden bridge where the lane crosses ───────────────────────────── */
function Bridge() {
  const { x, z, y, angle } = BRIDGE;
  const planks = Array.from({ length: 13 }, (_, i) => -4.8 + i * 0.8);
  return (
    <group position={[x, y, z]} rotation={[0, angle, 0]}>
      {planks.map((pz) => (
        <mesh key={pz} position={[0, 0.12, pz]} material={mat(pz % 1.6 === 0 ? "#8A6446" : "#7A573D")} castShadow receiveShadow>
          <boxGeometry args={[4.8, 0.2, 0.72]} />
        </mesh>
      ))}
      {[-2.5, 2.5].map((sx) => (
        <group key={sx}>
          <mesh position={[sx, 1.05, 0]} material={mat("#5A4030")} castShadow>
            <boxGeometry args={[0.16, 0.16, 10.4]} />
          </mesh>
          {[-4.8, -2.4, 0, 2.4, 4.8].map((pz) => (
            <mesh key={pz} position={[sx, 0.5, pz]} material={mat("#5A4030")} castShadow>
              <boxGeometry args={[0.18, 1.1, 0.18]} />
            </mesh>
          ))}
          {/* posts down into the water */}
          {[-3.2, 3.2].map((pz) => (
            <mesh key={pz} position={[sx, -1.2, pz]} material={mat("#4A3528")}>
              <boxGeometry args={[0.3, 2.6, 0.3]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
