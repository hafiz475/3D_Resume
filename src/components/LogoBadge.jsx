// components/LogoBadge.jsx (Debug Mode + Smarter Scaling)
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
    root.position.sub(center);  // Center

    const size = new THREE.Vector3();
    bbox.getSize(size);
    console.log(`Logo ${modelUrl} BBox:`, { x: size.x, y: size.y, z: size.z });  // 👀 DEBUG: Check these!

    // Smarter scale: Use max of X/Y (width/height) for flat logos, ignore thin Z
    const visibleMax = Math.max(size.x, size.y);  // Skip Z if it's the thin dim
    let scale = 4.0 / visibleMax;  // Base 4.0: Bigger starting point
    scale = Math.max(scale, 2.5);  // Min scale: No tinier than this

    root.scale.setScalar(scale);
    console.log(`Applied scale: ${scale}`);  // 👀 DEBUG

    root.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = false;
        n.receiveShadow = false;
        if (n.material) {
          n.material.emissiveIntensity = 0.2;  // Glow up
        }
      }
    });

    // Rotation roulette: Try these one-by-one based on console dims
    // If Z is tiny (thin), rotate to show XY face
    root.rotation.y = 0;  // Start neutral
    root.rotation.x = 0;
    root.rotation.z = 0;
    // UNCOMMENT ONE LINE BELOW PER LOGO (test in browser):
    // root.rotation.y = Math.PI / 2;  // 90° Y: If side-profile
    // root.rotation.x = Math.PI / 2;  // 90° X: If upside-down
    // root.rotation.z = Math.PI / 2;  // 90° Z: If twisted
  }, [root]);

  return (
    <group>
      <ambientLight intensity={1.0} />  {/* Max brightness */}
      <directionalLight position={[5, 5, 3]} intensity={2.0} />  {/* Harsh light to reveal edges */}
      <primitive object={root} />
    </group>
  );
}