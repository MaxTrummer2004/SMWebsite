"use client";

import React, { useRef, useMemo, useEffect } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  extend,
  createPortal,
} from "@react-three/fiber";
import { useFBO, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// Type definitions for custom shader materials
interface SimulationMaterialUniforms {
  uTime: number;
  uMouse: THREE.Vector2;
  uPreviousState: THREE.Texture | null;
  uResolution: THREE.Vector2;
  uRadius: number;
  uDecay: number;
  uIntensity: number;
  uSpeed: number;
  uDirection: THREE.Vector2;
}

interface DitherMaterialUniforms {
  uSimulationState: THREE.Texture | null;
  uDitherSize: number;
  uExponent: number;
  uResolution: THREE.Vector2;
  uColor: THREE.Vector3;
}

type SimulationMaterialImpl = THREE.ShaderMaterial & SimulationMaterialUniforms;
type DitherMaterialImpl = THREE.ShaderMaterial & DitherMaterialUniforms;

const SimulationMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uPreviousState: null,
    uResolution: new THREE.Vector2(0, 0),
    uRadius: 0.1,
    uDecay: 0.01,
    uIntensity: 1.0,
    uSpeed: 0.0,
    uDirection: new THREE.Vector2(0, 0),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform sampler2D uPreviousState;
    uniform vec2 uResolution;
    uniform float uRadius;
    uniform float uDecay;
    uniform float uIntensity;
    uniform float uSpeed;
    uniform vec2 uDirection;

    varying vec2 vUv;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    vec2 curl(vec2 p) {
      float eps = 0.1;
      float n1 = snoise(p + vec2(0, eps));
      float n2 = snoise(p - vec2(0, eps));
      float n3 = snoise(p + vec2(eps, 0));
      float n4 = snoise(p - vec2(eps, 0));
      float x = (n1 - n2) / (2.0 * eps);
      float y = (n3 - n4) / (2.0 * eps);
      return vec2(y, -x);
    }

    void main() {
      vec2 uv = vUv;
      vec2 texel = 1.0 / uResolution;

      vec2 noiseUV = uv * 0.5;
      vec2 velocity = curl(noiseUV + uTime * 0.1);

      float advectionStrength = 0.001;
      vec2 advectedUV = uv - velocity * advectionStrength;

      float prev = texture2D(uPreviousState, advectedUV).r;
      float top = texture2D(uPreviousState, advectedUV + vec2(0.0, texel.y)).r;
      float bottom = texture2D(uPreviousState, advectedUV - vec2(0.0, texel.y)).r;
      float left = texture2D(uPreviousState, advectedUV - vec2(texel.x, 0.0)).r;
      float right = texture2D(uPreviousState, advectedUV + vec2(texel.x, 0.0)).r;

      float diffused = (prev + top + bottom + left + right) / 5.0;

      float aspect = uResolution.x / uResolution.y;
      vec2 aspectCorrection = vec2(aspect, 1.0);
      vec2 mouseUV = uMouse;

      float dist = length((uv - mouseUV) * aspectCorrection);

      float brush = exp(-pow(dist / uRadius, 2.0));

      float speedFactor = smoothstep(0.0, 0.01, uSpeed);

      brush *= uIntensity * speedFactor * 0.5;

      float value = min(0.95, diffused + brush);

      value -= uDecay;

      gl_FragColor = vec4(vec3(max(0.0, value)), 1.0);
    }
  `,
);

const DitherMaterial = shaderMaterial(
  {
    uSimulationState: null,
    uDitherSize: 8.0,
    uExponent: 2.0,
    uResolution: new THREE.Vector2(0, 0),
    uColor: new THREE.Vector3(0, 0, 0),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform sampler2D uSimulationState;
    uniform float uDitherSize;
    uniform float uExponent;
    uniform vec2 uResolution;
    uniform vec3 uColor;

    varying vec2 vUv;

    float bayer8(vec2 uv) {
        int x = int(mod(uv.x, 8.0));
        int y = int(mod(uv.y, 8.0));

        int M[64];
        M[0]=0;  M[1]=32; M[2]=8;  M[3]=40; M[4]=2;  M[5]=34; M[6]=10; M[7]=42;
        M[8]=48; M[9]=16; M[10]=56;M[11]=24;M[12]=50;M[13]=18;M[14]=58;M[15]=26;
        M[16]=12;M[17]=44;M[18]=4; M[19]=36;M[20]=14;M[21]=46;M[22]=6; M[23]=38;
        M[24]=60;M[25]=28;M[26]=52;M[27]=20;M[28]=62;M[29]=30;M[30]=54;M[31]=22;
        M[32]=3; M[33]=35;M[34]=11;M[35]=43;M[36]=1; M[37]=33;M[38]=9; M[39]=41;
        M[40]=51;M[41]=19;M[42]=59;M[43]=27;M[44]=49;M[45]=17;M[46]=57;M[47]=25;
        M[48]=15;M[49]=47;M[50]=7; M[51]=39;M[52]=13;M[53]=45;M[54]=5; M[55]=37;
        M[56]=63;M[57]=31;M[58]=55;M[59]=23;M[60]=61;M[61]=29;M[62]=53;M[63]=21;

        int idx = y * 8 + x;
        return float(M[idx]) / 64.0;
    }

    void main() {
      vec2 uv = vUv;

      float signal = texture2D(uSimulationState, uv).r;

      signal = pow(signal, uExponent);

      float threshold = bayer8(gl_FragCoord.xy / uDitherSize);

      float mask = step(threshold, signal);

      if (signal < 0.01) mask = 0.0;

      vec3 finalColor = uColor;

      // Discard unlit pixels and render lit pixels fully opaque.
      // Previously this fragment shader output a vec4(finalColor, mask)
      // with non-premultiplied alpha, then relied on standard
      // alpha-blending against the page background. That blend happens
      // in the framebuffer's encoded color space (sRGB), which is
      // mathematically incorrect for alpha compositing and visibly
      // desaturates/darkens midtones — the rendered hex no longer
      // matches the authored hex. Switching to a hard discard means each
      // lit dot is the literal hex with no compositing math at all,
      // restoring fidelity to the color picker. Areas without dots are
      // fully transparent so the tile background still shows through.
      if (mask < 0.5) discard;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
);

extend({ SimulationMaterial, DitherMaterial });

const SceneInternal = ({
  simulationScene,
  ditherSize,
  radius,
  exponent,
  decay,
  intensity,
  color,
}: {
  simulationScene: THREE.Scene;
  ditherSize: number;
  radius: number;
  exponent: number;
  decay: number;
  intensity: number;
  color: string;
}) => {
  const { size, viewport, gl } = useThree();
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const prevMouseRef = useRef(new THREE.Vector2(0, 0));
  const speedRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvasEl = gl.domElement;
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - (e.clientY - rect.top) / rect.height;
        mouseRef.current.set(x, y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [gl.domElement]);

  const simTargetA = useFBO({
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
  const simTargetB = useFBO({
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });

  const simMaterialRef = useRef<SimulationMaterialImpl>(null);
  const ditherMaterialRef = useRef<DitherMaterialImpl>(null);
  const frameRef = useRef(0);

  useFrame((state) => {
    const { gl, clock } = state;
    const writeBuffer = frameRef.current % 2 === 0 ? simTargetA : simTargetB;
    const readBuffer = frameRef.current % 2 === 0 ? simTargetB : simTargetA;

    if (simMaterialRef.current) {
      simMaterialRef.current.uTime = clock.elapsedTime;
      simMaterialRef.current.uMouse = mouseRef.current;
      simMaterialRef.current.uPreviousState = readBuffer.texture;
      simMaterialRef.current.uResolution = new THREE.Vector2(
        size.width,
        size.height,
      );
      simMaterialRef.current.uRadius = radius;
      simMaterialRef.current.uDecay = decay;
      simMaterialRef.current.uIntensity = intensity;

      simMaterialRef.current.uDecay = decay;
      simMaterialRef.current.uIntensity = intensity;

      const curMouse = mouseRef.current;
      const prevMouse = prevMouseRef.current;

      const dist = curMouse.distanceTo(prevMouse);
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, dist, 0.1);
      simMaterialRef.current.uSpeed = speedRef.current;

      const dir = new THREE.Vector2()
        .subVectors(curMouse, prevMouse)
        .normalize();
      simMaterialRef.current.uDirection = dir;

      prevMouseRef.current.copy(curMouse);
    }

    gl.setRenderTarget(writeBuffer);
    gl.render(simulationScene, state.camera);
    gl.setRenderTarget(null);

    if (ditherMaterialRef.current) {
      ditherMaterialRef.current.uSimulationState = writeBuffer.texture;
      ditherMaterialRef.current.uDitherSize = ditherSize;
      ditherMaterialRef.current.uExponent = exponent;
      ditherMaterialRef.current.uResolution = new THREE.Vector2(
        size.width,
        size.height,
      );
      // Parse hex directly to raw 0-1 sRGB floats and bypass THREE.Color.
      // THREE.Color applies sRGB->linear conversion (ColorManagement), then
      // the renderer's output pass does linear->sRGB. In theory that round-
      // trips, but in practice the dither pipeline (FBO ping-pong + custom
      // ShaderMaterial) drops the encode pass and the user sees darker
      // colors than authored. Feeding raw sRGB floats into a Vector3 uniform
      // and pairing with LinearSRGBColorSpace canvas output (see <Canvas>
      // gl prop) means what you type is what you get, identical to how
      // LightDroplets handles its color uniform.
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      ditherMaterialRef.current.uColor = new THREE.Vector3(r, g, b);
    }

    frameRef.current++;
  });

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[viewport.width, viewport.height]} />
          {/* @ts-expect-error - Custom shader material from drei */}
          <simulationMaterial ref={simMaterialRef} />
        </mesh>,
        simulationScene,
      )}

      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        {/* @ts-expect-error - Custom shader material from drei */}
        <ditherMaterial ref={ditherMaterialRef} transparent />
      </mesh>
    </>
  );
};

export interface DitherCursorProps {
  ditherSize?: number;
  radius?: number;
  exponent?: number;
  decay?: number;
  intensity?: number;
  color?: string;
  className?: string;
}

const DitherCursor: React.FC<DitherCursorProps> = ({
  ditherSize = 2.0,
  radius = 0.1,
  exponent = 2.0,
  decay = 0.01,
  intensity = 0.5,
  color = "#000000",
  className,
}) => {
  const simulationScene = useMemo(() => new THREE.Scene(), []);

  return (
    <div
      className={cn(
        "absolute top-0 left-0 w-full h-full pointer-events-none z-10",
        className,
      )}
    >
      <Canvas
        orthographic
        camera={{ zoom: 1, position: [0, 0, 1], near: 0.1, far: 1000 }}
        gl={{ alpha: true, antialias: false }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.LinearSRGBColorSpace;
        }}
        className="w-full h-full"
      >
        <SceneInternal
          simulationScene={simulationScene}
          ditherSize={ditherSize}
          radius={radius}
          exponent={exponent}
          decay={decay}
          intensity={intensity}
          color={color}
        />
      </Canvas>
    </div>
  );
};

export default DitherCursor;
