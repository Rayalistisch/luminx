import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { height, SNOW_ZONES } from "./landscape";
import { mulberry32 } from "./noise";
import { world } from "./store";

// Here and there winter has already arrived: a heavy cloud, falling flakes,
// and (baked into the terrain and trees) a white dusting underneath.

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute float aGround;
  attribute float aHeight;
  varying float vFade;
  void main() {
    float speed = 2.2 + aSeed * 1.6;
    float fall = mod(uTime * speed + aSeed * aHeight, aHeight);
    vec3 p = position;
    p.y = aGround + aHeight - fall;
    p.x += sin(uTime * 0.9 + aSeed * 40.0) * 0.9 + fall * 0.12;
    p.z += cos(uTime * 0.7 + aSeed * 25.0) * 0.7;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((1.4 + aSeed) * uPixelRatio * (260.0 / -mv.z), 1.2, 9.0);
    // fade in under the cloud, out just above the ground
    vFade = smoothstep(0.0, 4.0, fall) * smoothstep(0.0, 2.0, aHeight - fall);
  }
`;
const fragment = /* glsl */ `
  varying float vFade;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, r) * vFade * 0.95;
    gl_FragColor = vec4(vec3(1.0, 0.99, 0.97) * a, a);
  }
`;

export function Snow({ perZone = 650 }: { perZone?: number }) {
  const gl = useThree((s) => s.gl);
  const { geometry, material } = useMemo(() => {
    const rng = mulberry32(1212);
    const n = perZone * SNOW_ZONES.length;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const ground = new Float32Array(n);
    const hgt = new Float32Array(n);
    let i = 0;
    for (const z of SNOW_ZONES) {
      const top = height(z.x, z.z) + 46;
      for (let k = 0; k < perZone; k++, i++) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * z.r * 0.85;
        const x = z.x + Math.cos(a) * r;
        const zz = z.z + Math.sin(a) * r;
        const g = height(x, zz);
        pos.set([x, g, zz], i * 3);
        seed[i] = rng();
        ground[i] = g;
        hgt[i] = top - g;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aGround", new THREE.BufferAttribute(ground, 1));
    geo.setAttribute("aHeight", new THREE.BufferAttribute(hgt, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, -80), 400);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
    });
    return { geometry: geo, material: mat };
  }, [perZone]);

  // snow clouds: heavier, cooler and lower than the fair-weather ones
  const cloud = useMemo(() => {
    const rng = mulberry32(55);
    const m = new THREE.MeshStandardMaterial({ color: "#ECE8EE", emissive: new THREE.Color("#C9C2D2"), emissiveIntensity: 0.45, flatShading: true, roughness: 1, transparent: true, opacity: 0.92 });
    m.fog = false;
    const g = new THREE.IcosahedronGeometry(1, 1);
    const zones = SNOW_ZONES.filter((z) => z.cloud !== false).map((z) => ({
      x: z.x,
      y: height(z.x, z.z) + 58,
      z: z.z,
      puffs: Array.from({ length: 16 }, () => ({
        x: (rng() - 0.5) * z.r * 1.2,
        y: (rng() - 0.5) * 5,
        z: (rng() - 0.5) * z.r * 1.0,
        s: 5 + rng() * 6,
      })),
    }));
    return { m, g, zones };
  }, []);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = world.reduced ? clock.elapsedTime * 0.3 : clock.elapsedTime;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    cloud.m.emissiveIntensity = 0.45 - world.dusk * 0.3;
  });

  return (
    <group>
      <points geometry={geometry} material={material} frustumCulled={false} />
      {cloud.zones.map((z, i) => (
        <group key={i} position={[z.x, z.y, z.z]}>
          {z.puffs.map((p, k) => (
            <mesh key={k} geometry={cloud.g} material={cloud.m} position={[p.x, p.y, p.z]} scale={[p.s, p.s * 0.5, p.s]} />
          ))}
        </group>
      ))}
    </group>
  );
}
