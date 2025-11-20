// src/components/post/VolumetricSunRays.jsx
import React, { useMemo, useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Simple fullscreen overlay shader that draws radial volumetric rays
 * based on the sun mesh position (screen-space). This does NOT sample the scene
 * and therefore doesn't require RenderPass or compositors.
 *
 * Place this component inside the same Canvas tree. It will render a full-screen
 * quad after the main scene by using useFrame with low priority.
 *
 * Props:
 *  - sunRef: React ref to the THREE.Mesh representing the sun
 */
export default function VolumetricSunRays({ sunRef }) {
    const { gl, camera, size } = useThree();
    const materialRef = useRef();
    const sceneRef = useRef(null);
    const meshRef = useRef(null);
    const orthoCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

    // create fullscreen scene + material once
    useEffect(() => {
        const mat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: false,
            uniforms: {
                lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
                exposure: { value: 0.35 },
                decay: { value: 0.95 },
                density: { value: 0.97 },
                weight: { value: 0.6 },
                samples: { value: 80 },
                resolution: { value: new THREE.Vector2(size.width, size.height) },
            },
            vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
            fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform vec2 lightPosition;
        uniform float exposure;
        uniform float decay;
        uniform float density;
        uniform float weight;
        uniform int samples;

        void main(){
          vec2 delta = (vUv - lightPosition) * density / float(samples);
          vec2 coord = vUv;
          float illum = 1.0;
          float total = 0.0;
          for (int i = 0; i < 300; i++) {
            if (i >= samples) break;
            coord -= delta;
            float s = illum * weight;
            illum *= decay;
            total += s;
          }
          float col = total * exposure;
          gl_FragColor = vec4(col * 1.0, col * 0.55, col * 0.2, col);
        }
      `,
        });

        const sc = new THREE.Scene();
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
        sc.add(quad);
        sceneRef.current = sc;
        meshRef.current = quad;
        materialRef.current = mat;

        return () => {
            mat.dispose();
            quad.geometry.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // update resolution when canvas resizes
    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.resolution.value.set(size.width, size.height);
        }
    }, [size.width, size.height]);

    // render overlay AFTER main scene (priority 1)
    useFrame(() => {
        if (!materialRef.current || !meshRef.current) return;
        if (!sunRef || !sunRef.current) return;

        // compute sun screen-space pos
        const pos = sunRef.current.position.clone().project(camera);
        materialRef.current.uniforms.lightPosition.value.set((pos.x + 1) / 2, (pos.y + 1) / 2);

        // render the fullscreen quad on top of existing scene
        const oldAutoClear = gl.autoClear;
        gl.autoClear = false;
        gl.render(sceneRef.current, orthoCam);
        gl.autoClear = oldAutoClear;
    }, 1);

    return null;
}
