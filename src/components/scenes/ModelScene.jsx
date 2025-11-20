// src/components/scenes/ModelScene.jsx
import React, { Suspense } from "react";
import { ContactShadows } from "@react-three/drei";

export default function ModelScene({ modelUrl, logoUrl }) {
    // Replace this stub with your GLTF model loader (Timeline / Timeline component).
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 6, 2]} intensity={0.9} />
            <Suspense fallback={null}>
                <mesh position={[0, -1.2, 0]}>
                    <boxGeometry args={[2.4, 2.4, 2.4]} />
                    <meshStandardMaterial color="#646cff" metalness={0.3} roughness={0.4} />
                </mesh>
                <ContactShadows position={[0, -1.35, 0]} opacity={0.6} scale={10} blur={2.8} far={4} />
            </Suspense>
        </>
    );
}
