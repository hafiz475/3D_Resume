// Timeline.jsx (modified)
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Environment } from '@react-three/drei';

export default function Timeline({ modelUrl, noLights = false }) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const root = useMemo(() => gltf.scene.clone(true), [gltf]);

  useEffect(() => {
    const bbox = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    root.position.sub(center);

    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxSide = Math.max(size.x, size.y, size.z) || 1;
    const scale = 3.0 / maxSide;  // Increased from 2.5 to 3.0 for additional zoom-in
    root.scale.setScalar(scale);

    root.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
      }
    });
  }, [root]);

  const isPBR = useMemo(() => {
    let pbr = false;
    root.traverse((n) => {
      const m = n.material;
      if (n.isMesh && m) {
        if (
          m.isMeshStandardMaterial ||
          m.metalnessMap || m.roughnessMap ||
          typeof m.metalness === 'number' || typeof m.roughness === 'number' ||
          (m.name && /pbr/i.test(m.name))
        ) pbr = true;
      }
    });
    return pbr;
  }, [root]);

  return (
    <>
      {!noLights && (
        isPBR ? (
          <>
            <hemisphereLight args={['#ffffff', '#88aadd', 0.8]} />
            <directionalLight position={[5, 5, 3]} intensity={2} />
            <pointLight position={[0, 0, 5]} intensity={1.2} />
            <Environment preset="sunset" />
          </>
        ) : (
          <>
            <ambientLight intensity={0.75} />
            <directionalLight position={[4, 4, 3]} intensity={1.2} />
          </>
        )
      )}
      <primitive object={root} />
    </>
  );
}