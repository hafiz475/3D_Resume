// src/components/scenes/WaterSurface.jsx
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Water } from "three-stdlib";

extend({ Water });

export default function WaterSurface({
    waterColor = 0x030406,
    distortionScale = 6,
    windStrength = 1.2,
    speed = 1.05,
    sunIntensity = 4.0,
}) {
    const ref = useRef();
    const gl = useThree((s) => s.gl);
    const normals = useTexture("/waternormals.jpg");

    useMemo(() => {
        if (normals) {
            normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
            normals.repeat.set(12, 12);
        }
    }, [normals]);

    const config = useMemo(
        () => ({
            textureWidth: 2048,
            textureHeight: 2048,
            waterNormals: normals || null,
            sunDirection: new THREE.Vector3(0, 0.15, -1).normalize(),
            sunColor: 0xffb366,
            waterColor,
            distortionScale,
            fog: true,
            format: gl.outputEncoding ?? gl.encoding,
        }),
        [normals, gl, waterColor, distortionScale]
    );

    useEffect(() => {
        if (ref.current && ref.current.material) {
            // Prevent other systems from injecting uniforms on older three.js versions
            ref.current.material.isRawShaderMaterial = true;
            // Boost initial specular shine for wet reflections
            if (ref.current.material.uniforms && ref.current.material.uniforms.sunColor) {
                ref.current.material.uniforms.sunColor.value = new THREE.Color(0xffb366);
            }
            // optionally increase reflectivity-like behavior
            if (ref.current.material.uniforms && ref.current.material.uniforms.distortionScale) {
                ref.current.material.uniforms.distortionScale.value = distortionScale;
            }
        }
    }, [distortionScale]);

    useFrame(({ clock }, delta) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        if (ref.current.material && ref.current.material.uniforms) {
            if (ref.current.material.uniforms.time) ref.current.material.uniforms.time.value += delta * speed;
            // gusty wind modifies distortion for choppy wet look
            const gust = Math.sin(t * 0.7) * 0.28 + Math.sin(t * 1.9) * 0.14;
            if (ref.current.material.uniforms.distortionScale)
                ref.current.material.uniforms.distortionScale.value = distortionScale * (1 + gust * windStrength * 0.9);
            // enhance specular intensity by nudging sunColor (works with three-stdlib water shader)
            if (ref.current.material.uniforms.sunColor)
                ref.current.material.uniforms.sunColor.value.lerp(new THREE.Color(0xffcfa0), 0.02);
        }
    });

    return (
        <water
            ref={ref}
            args={[new THREE.PlaneGeometry(16000, 16000), config]}
            rotation-x={-Math.PI / 2}
            position={[0, -1.6, 0]}
        />
    );
}
