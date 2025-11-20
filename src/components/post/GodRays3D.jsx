// src/components/post/GodRays3D.jsx
import { useThree, useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import {
    GodRaysPass
} from "three/examples/jsm/postprocessing/GodRaysPass";
import { EffectComposer } from "@react-three/postprocessing";

export default function GodRays3D({ sun }) {
    const { scene, camera } = useThree();

    const pass = useMemo(() => {
        return new GodRaysPass(scene, camera, sun.current, {
            density: 0.9,
            decay: 0.96,
            weight: 0.6,
            exposure: 0.95,
            samples: 60,
            clampMax: 1.0,
        });
    }, [scene, camera, sun]);

    useFrame((_, delta) => {
        pass.render(delta);
    });

    return <EffectComposer>{/* pass handled manually */}</EffectComposer>;
}
