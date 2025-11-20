// components/scenes/SunsetScene3D.jsx
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars, Clouds, Cloud, useTexture } from "@react-three/drei";
import { EffectComposer, GodRaysPass } from "@react-three/postprocessing";
import * as THREE from "three";
import WaterSurface from "./WaterSurface";

export default function SunsetScene3D() {
  const sunRef = useRef();
  const nebula = useTexture("/galaxy_gradient.jpg");

  useFrame(({ clock }) => {
    if (sunRef.current) {
      const t = clock.getElapsedTime();
      sunRef.current.position.z = -900 + Math.sin(t * 0.08) * 40;
    }
  });

  return (
    <>
      {/* Sky Nebula */}
      <mesh scale={3000}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial side={THREE.BackSide} map={nebula} />
      </mesh>

      {/* Stars */}
      <Stars count={5000} depth={80} radius={300} fade />

      {/* Clouds */}
      <Clouds>
        <Cloud position={[0, 60, -500]} opacity={0.4} scale={20} />
      </Clouds>

      {/* Sun Mesh */}
      <mesh ref={sunRef} position={[0, 40, -900]}>
        <sphereGeometry args={[150, 32, 32]} />
        <meshBasicMaterial color="#ffb46b" toneMapped={false} />
      </mesh>

      {/* Light from sun */}
      <pointLight intensity={4.5} position={[0, 40, -900]} />

      {/* Water */}
      <WaterSurface />

      {/* God Rays */}
      <GodRays
        sun={sunRef}
        samples={60}
        density={0.9}
        decay={0.97}
        weight={0.7}
        exposure={0.9}
      />
    </>
  );
}
