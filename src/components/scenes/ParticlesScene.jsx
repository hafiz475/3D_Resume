// src/components/scenes/ParticlesScene.jsx
import React from "react";
import Particles from "../Particles";

export default function ParticlesScene({ count = 200 }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <Particles count={count} />
        </>
    );
}
