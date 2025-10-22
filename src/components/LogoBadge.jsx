// components/LogoBadge.jsx (Glowing Edges & Self-Light)
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function LogoBadge({ modelUrl }) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const root = useMemo(() => gltf.scene.clone(true), [gltf]);

  useEffect(() => {
    const bbox = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    root.position.sub(center);

    const size = new THREE.Vector3();
    bbox.getSize(size);

    const visibleMax = Math.max(size.x, size.y);
    let scale = 5.0 / visibleMax;
    scale = Math.max(scale, 3.0);

    root.scale.setScalar(scale);

    root.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = false;
        n.receiveShadow = false;
        if (n.material) {
          n.material.emissiveIntensity = 1.0;  // UP: Full self-glow—makes it "lit from inside"
          if (n.material.roughness !== undefined) {
            n.material.roughness = 0.05;  // DOWN: Mirror-shiny for light bounce
          }
          // Optional: Tint emission blue-ish for "tech" vibe (comment if unwanted)
          // n.material.emissive = new THREE.Color(0x646cff).multiplyScalar(0.5);
        }
      }
    });

    root.rotation.y = 0;
    root.rotation.x = 0;
    root.rotation.z = 0;
  }, [root]);

  return (
    <group>
      <ambientLight intensity={1.8} />
      <hemisphereLight args={['#ffffff', '#444444', 2.0]} />
      <directionalLight position={[5, 5, 3]} intensity={5.0} />
      
      {/* NEW: Rim glow—soft point light offset for edge highlight */}
      <pointLight 
        position={[2, 0, 2]}  // Offset to one side for subtle wrap-around
        intensity={2.5}      // Gentle: Not blinding
        color="#646cff"      // Blue tint to match your theme
        distance={3}         // Fades naturally
      />
      
      <primitive object={root} />
    </group>
  );
}