// src/components/SceneManager.jsx
import React from "react";
import ModelScene from "./scenes/ModelScene";
import ParticlesScene from "./scenes/ParticlesScene";
import SunsetScene3D from "./scenes/SunsetScene3D";

export default function SceneManager({ currentIndex, periods }) {
    if (!Array.isArray(periods)) return null;

    const period = periods[currentIndex];
    if (!period) return null;

    if (period.isSunset) {
        return <SunsetScene3D />;
    }

    if (period.hasParticles) {
        return <ParticlesScene count={250} />;
    }

    return <ModelScene modelUrl={period.model} logoUrl={period.logo} />;
}
