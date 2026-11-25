import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { height, ROAD_H, ROAD_PTS, smoothstep } from "./landscape";
import { mulberry32 } from "./noise";
import { world } from "./store";

// "Van ruis naar omzet": every mote starts as loose noise drifting over the
// fields and, as you travel, finds its place in a lit line along the lane home.

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uOrder;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec3 aOrder;
  attribute float aSeed;
  attribute float aAlong;
  varying float vAlpha;
  varying float vSettled;

  void main() {
    vec3 drift = vec3(
      sin(uTime * 0.35 + aSeed * 31.0) * 2.2,
      sin(uTime * 0.5 + aSeed * 17.0) * 1.4,
      cos(uTime * 0.3 + aSeed * 11.0) * 2.2
    );
    vec3 loose = position + drift;

    // lights settle from the start of the lane to the farm, one after another
    float k = clamp(uOrder * 1.7 - aAlong * 0.7, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    vec3 settled = aOrder + vec3(0.0, sin(uTime * 1.8 + aSeed * 40.0) * 0.04, 0.0);
    // arc upward while travelling so the motes don't slide through hills
    vec3 p = mix(loose, settled, k) + vec3(0.0, sin(k * 3.14159) * 6.0, 0.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float tw = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 60.0);
    float size = uSize * mix(0.6 + aSeed * 0.8, 0.85, k) * mix(tw, 1.0, k);
    gl_PointSize = clamp(size * uPixelRatio * (380.0 / -mv.z), 1.5, 30.0);
    vAlpha = mix(0.35 + 0.65 * tw, 1.0, k);
    vSettled = k;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColorSettled;
  uniform float uGlow;
  varying float vAlpha;
  varying float vSettled;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, r);
    float a = pow(core, 2.2) * vAlpha;
    vec3 col = mix(uColor, uColorSettled, vSettled) * uGlow;
    gl_FragColor = vec4(col * a, a);
  }
`;

export function Fireflies({ count = 900 }: { count?: number }) {
  const gl = useThree((s) => s.gl);

  const { geometry, uniforms, material } = useMemo(() => {
    const rng = mulberry32(7);
    const loose = new Float32Array(count * 3);
    const order = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const along = new Float32Array(count);
    const n = ROAD_PTS.length;
    // start the lit line a little after the first view so the lane leads into the land
    const start = Math.floor(n * 0.18);
    const span = n - 1 - start;
    const pairs = Math.floor(count / 2);
    const side = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const pair = Math.floor(i / 2);
      const f = pair / Math.max(1, pairs - 1);
      const idx = Math.min(n - 1, start + Math.round(f * span));
      const p = ROAD_PTS[idx];
      const q = ROAD_PTS[Math.min(n - 1, idx + 1)];
      const o = ROAD_PTS[Math.max(0, idx - 1)];
      side.set(q.z - o.z, 0, -(q.x - o.x)).normalize();
      const s = i % 2 === 0 ? 1 : -1;
      order[i * 3] = p.x + side.x * 2.9 * s;
      order[i * 3 + 1] = ROAD_H[idx] + 0.55;
      order[i * 3 + 2] = p.z + side.z * 2.9 * s;

      const lx = p.x + (rng() - 0.5) * 90;
      const lz = p.z + (rng() - 0.5) * 70;
      loose[i * 3] = lx;
      loose[i * 3 + 1] = height(lx, lz) + 3 + rng() * 20;
      loose[i * 3 + 2] = lz;
      seed[i] = rng();
      along[i] = f;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(loose, 3));
    g.setAttribute("aOrder", new THREE.BufferAttribute(order, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -20), 400);

    const u = {
      uTime: { value: 0 },
      uOrder: { value: 0 },
      uSize: { value: 2.4 },
      uPixelRatio: { value: 1 },
      uGlow: { value: 2.4 },
      uColor: { value: new THREE.Color("#ffd27a") },
      uColorSettled: { value: new THREE.Color("#ffb54d") },
    };
    const m = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, uniforms: m.uniforms as typeof u, material: m };
  }, [count]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    uniforms.uOrder.value = smoothstep(0.05, 0.95, world.dusk);
    // brighter as the light drops, so the lane really glows at the end
    uniforms.uGlow.value = 2.0 + world.dusk * 2.6;
  });

  return (
    <points geometry={geometry} material={material} frustumCulled={false} />
  );
}
