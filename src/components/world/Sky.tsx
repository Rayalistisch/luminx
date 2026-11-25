import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { skyUniforms } from "./materials";

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uStars;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;

    vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.16, h));
    col = mix(col, uTop, smoothstep(0.12, 0.62, h));

    // warm glow around the sun, wider along the horizon
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    float band = exp(-abs(h - uSunDir.y) * 9.0);
    col += uSunColor * (pow(s, 6.0) * 0.32 + pow(s, 48.0) * 0.55 + band * pow(s, 2.0) * 0.18);
    // sun disc, soft-edged
    col += uSunColor * smoothstep(0.99935, 0.99975, s) * 6.0 * smoothstep(-0.01, 0.03, h) * smoothstep(-0.03, 0.01, uSunDir.y);

    // stars once the evening sets in
    vec2 uv = vec2(atan(d.z, d.x) * 70.0, h * 110.0);
    vec2 id = floor(uv);
    float r = hash(id);
    vec2 f = fract(uv) - 0.5;
    float tw = 0.6 + 0.4 * sin(uTime * (1.0 + r * 3.0) + r * 40.0);
    float star = step(0.986, r) * smoothstep(0.12, 0.0, length(f)) * tw;
    col += vec3(1.0, 0.92, 0.82) * star * uStars * smoothstep(0.06, 0.35, h) * 2.2;

    // subtle dither against banding in the long gradients
    col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;

    gl_FragColor = vec4(col * 0.82, 1.0);
  }
`;

export function Sky() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera, clock }) => {
    skyUniforms.uTime.value = clock.elapsedTime;
    ref.current?.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[600, 48, 24]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={skyUniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </mesh>
  );
}
