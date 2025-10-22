// components/LogoBadge.jsx (Matched Global Brightness)
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
    // console.log... (remove these debug lines now)

    const visibleMax = Math.max(size.x, size.y);
    let scale = 5.0 / visibleMax;
    scale = Math.max(scale, 3.0);

    root.scale.setScalar(scale);

    root.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = false;
        n.receiveShadow = false;
        if (n.material) {
          n.material.emissiveIntensity = 0.6; // UP: Matches Timeline glow
          if (n.material.roughness !== undefined) {
            n.material.roughness = 0.1; // NEW: Extra shiny for logos
          }
        }
      }
    });

    root.rotation.y = 0;
    root.rotation.x = 0;
    root.rotation.z = 0;
  }, [root]);

  return (
    <group>
      <ambientLight intensity={1.8} /> // UP: Total flood
      <hemisphereLight args={["#ffffff", "#444444", 2.0]} /> // UP: Max evenness
      <directionalLight position={[5, 5, 3]} intensity={5.0} /> // UP: Blinding
      shine
      <primitive object={root} />
    </group>
  );
}
