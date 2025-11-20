// src/components/GlobalCanvas.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import SceneManager from "./SceneManager";

export default function GlobalCanvas({ currentIndex, periods }) {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 4, 12], fov: 60, near: 0.1, far: 20000 }}
            style={{ position: "fixed", inset: 0, zIndex: 0, background: "#000" }}
        >
            <SceneManager currentIndex={currentIndex} periods={periods} />
        </Canvas>
    );
}
