// src/components/post/LensDirtOverlay.jsx
import React, { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

export default function LensDirtOverlay({ sunRef, dirtMapUrl, intensity = 0.5, tint = [1, 1, 1] }) {
    const { gl, camera } = useThree();
    const screenScene = useMemo(() => new THREE.Scene(), []);
    const orthoCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
    const quad = useMemo(() => {
        const mat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NormalBlending,
            uniforms: {
                dirtMap: { value: null },
                lightPos: { value: new THREE.Vector2(0.5, 0.5) },
                intensity: { value: intensity },
                tint: { value: new THREE.Vector3(tint[0], tint[1], tint[2]) },
            },
            vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position,1.0); }
      `,
            fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D dirtMap;
        uniform vec2 lightPos;
        uniform float intensity;
        uniform vec3 tint;
        void main(){
          vec4 d = texture2D(dirtMap, vUv);
          // radial falloff based on sun
          float dist = distance(vUv, lightPos);
          float fall = smoothstep(0.9, 0.2, dist);
          // highlight the bright parts of dirt map and tint them
          float highlight = pow(d.r * 0.8 + d.g * 0.15 + d.b * 0.05, 1.6);
          vec3 color = tint * highlight * intensity * fall;
          // composite: add subtle warm sheen + subtle darkening
          gl_FragColor = vec4(color, clamp(highlight * intensity * fall, 0.0, 1.0));
        }
      `,
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
        screenScene.add(mesh);
        return { mesh, mat };
    }, []);

    useEffect(() => {
        // load texture from user-uploaded local path
        const loader = new TextureLoader();
        loader.load(
            dirtMapUrl,
            (tex) => {
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                quad.mat.uniforms.dirtMap.value = tex;
            },
            undefined,
            (err) => {
                console.warn("LensDirtOverlay: failed to load dirt map:", err);
            }
        );
        // cleanup on unmount
        return () => {
            try {
                if (quad.mat.uniforms.dirtMap.value) quad.mat.uniforms.dirtMap.value.dispose();
                quad.mat.dispose();
                quad.mesh.geometry.dispose();
            } catch (e) { }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirtMapUrl]);

    useEffect(() => {
        // nothing
    }, []);

    useFrame(() => {
        if (!sunRef?.current || !quad.mat) return;
        // project sun to screen-space
        const pos = sunRef.current.position.clone().project(camera);
        quad.mat.uniforms.lightPos.value.set((pos.x + 1) / 2, (pos.y + 1) / 2);

        const old = gl.autoClear;
        // render on top of scene; use Normal blend to subtly tint
        gl.autoClear = false;
        gl.render(screenScene, orthoCam);
        gl.autoClear = old;
    }, 1);

    return null;
}
