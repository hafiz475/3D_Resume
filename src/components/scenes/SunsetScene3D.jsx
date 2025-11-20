// src/components/scenes/SunsetScene3D.jsx
import React, { useRef, useMemo, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture, Stars, Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";
import WaterSurface from "./WaterSurface";
import LensDirtOverlay from "../post/LensDirtOverlay";

function CameraBob() {
    const { camera } = useThree();
    useFrame(({ clock }) => {
        camera.position.y = 3.6 + Math.sin(clock.getElapsedTime() * 0.35) * 0.12;
        camera.position.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.06;
    });
    return null;
}

function GalaxyBackdrop() {
    const tex = useTexture("/galaxy_gradient.jpg");
    const ref = useRef();
    useFrame(({ clock }) => {
        if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.0025;
    });
    return (
        <mesh ref={ref} scale={[3000, 3000, 3000]}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial map={tex} side={THREE.BackSide} />
        </mesh>
    );
}

function MovingClouds() {
    return (
        <Clouds limit={25} material={THREE.MeshLambertMaterial}>
            <Cloud position={[0, 60, -500]} opacity={0.36} scale={[25, 12, 25]} speed={0.2} />
            <Cloud position={[-250, 90, -900]} opacity={0.33} scale={[45, 20, 45]} speed={0.12} />
            <Cloud position={[280, 120, -1200]} opacity={0.28} scale={[60, 26, 60]} speed={0.06} />
        </Clouds>
    );
}

/* Sun mesh with strong emissive for bloom sprites */
const Sun = forwardRef((props, ref) => {
    const mesh = useRef();
    useFrame(({ clock }) => {
        if (!mesh.current) return;
        const t = clock.getElapsedTime();
        mesh.current.position.y = 42 + Math.sin(t * 0.25) * 2.2;
        mesh.current.position.z = -900 + Math.sin(t * 0.08) * 28;
    });
    React.useImperativeHandle(ref, () => mesh.current);
    return (
        <mesh ref={mesh} position={[0, 42, -900]}>
            <sphereGeometry args={[150, 32, 32]} />
            <meshBasicMaterial color={"#ffbb66"} emissive={"#ff7733"} emissiveIntensity={4.0} toneMapped={false} />
            <pointLight intensity={5.5} distance={10000} color={"#ff8844"} />
        </mesh>
    );
});

/* Bloom sprites: layered additive sprites centered on sun to emulate bloom/bloom spread */
function SunBloomSprites({ sunRef }) {
    const { scene } = useThree();
    const group = useRef();

    useFrame(() => {
        if (!sunRef.current || !group.current) return;
        // position group at sun
        group.current.position.copy(sunRef.current.position);
        // keep facing camera handled by sprite material automatically
    });

    // create a few sprite layers with different sizes and intensities
    const sprites = useMemo(() => {
        const list = [
            { size: 900, intensity: 0.7, color: 0xffc58a },
            { size: 1600, intensity: 0.45, color: 0xffb07a },
            { size: 2800, intensity: 0.22, color: 0xff8f55 },
        ];
        return list;
    }, []);

    return (
        <group ref={group}>
            {sprites.map((s, i) => (
                <sprite key={i} scale={[s.size, s.size, 1]}>
                    <spriteMaterial
                        attach="material"
                        color={s.color}
                        opacity={s.intensity}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        depthTest={false}
                        toneMapped={false}
                    />
                </sprite>
            ))}
        </group>
    );
}

/* Multi-layer god rays overlay (additive) - improved streaks + falloff */
function GodRaysLayers({ sunRef }) {
    const { gl, camera } = useThree();
    const sceneRef = useMemo(() => new THREE.Scene(), []);
    const orthoCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
    const materials = useMemo(() => {
        // three layered shaders: tight beams, mid glow, soft wash
        const makeMat = (scale, streaks, intensity, tint) =>
            new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                depthTest: false,
                blending: THREE.AdditiveBlending,
                uniforms: {
                    lightPos: { value: new THREE.Vector2(0.5, 0.5) },
                    scale: { value: scale },
                    streaks: { value: streaks },
                    intensity: { value: intensity },
                    tint: { value: new THREE.Vector3((tint >> 16 & 255) / 255, (tint >> 8 & 255) / 255, (tint & 255) / 255) },
                    time: { value: 0 },
                },
                vertexShader: `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position,1.0); }
        `,
                fragmentShader: `
          precision highp float;
          varying vec2 vUv;
          uniform vec2 lightPos;
          uniform float scale;
          uniform int streaks;
          uniform float intensity;
          uniform vec3 tint;
          uniform float time;

          // random hash
          float hash(float n){ return fract(sin(n)*43758.5453123); }

          void main(){
            // direction from current pixel to light
            vec2 dir = vUv - lightPos;
            float dist = length(dir);
            vec2 d = dir / (dist + 1e-6);

            // radial falloff
            float fall = pow(max(0.0, 1.0 - dist * scale), 3.0);

            // streaks (angular modulation)
            float angle = atan(dir.y, dir.x);
            float s = 0.0;
            for(int i=0;i<8;i++){
              if(i>=streaks) break;
              float a = angle * float(i+1) * 0.6 + time*0.05*float(i+1);
              s += (0.5 + 0.5 * sin(a)) * 0.2;
            }
            s = clamp(s, 0.0, 1.0);

            // combine
            float glow = fall * (0.6 * s + 0.4);
            vec3 color = tint * glow * intensity;
            gl_FragColor = vec4(color, clamp(glow*intensity, 0.0, 1.0));
          }
        `,
            });
        return [
            makeMat(1.2, 8, 1.8, 0xffc58a), // tight streaks
            makeMat(0.9, 5, 1.0, 0xffb07a), // mid
            makeMat(0.5, 3, 0.6, 0xff8f55), // soft wash
        ];
    }, []);

    const quads = useMemo(() => {
        const arr = materials.map((m) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
            sceneRef.add(mesh);
            return mesh;
        });
        return arr;
    }, []);

    useFrame(({ clock }) => {
        if (!sunRef.current) return;
        const pos = sunRef.current.position.clone().project(camera);
        const lp = new THREE.Vector2((pos.x + 1) / 2, (pos.y + 1) / 2);
        materials.forEach((mat, i) => {
            mat.uniforms.lightPos.value.copy(lp);
            mat.uniforms.time.value = clock.getElapsedTime();
            // animate small subtle scale change
            mat.uniforms.scale.value = mat.uniforms.scale.value * 1.0 + Math.sin(clock.getElapsedTime() * 0.1 + i) * 0.001;
        });

        const old = gl.autoClear;
        gl.autoClear = false;
        gl.render(sceneRef, orthoCam);
        gl.autoClear = old;
    }, 1);

    return null;
}


export default function SunsetScene3D() {
    const sunRef = useRef();

    return (
        <>
            <color attach="background" args={["#000"]} />

            <GalaxyBackdrop />
            <Stars radius={300} depth={80} count={7000} factor={4} fade />
            <MovingClouds />

            <Sun ref={sunRef} />

            {/* bloom sprites for glow/bloom approximation */}
            <SunBloomSprites sunRef={sunRef} />

            {/* water - stronger specular / wet reflections */}
            <WaterSurface waterColor={0x020305} distortionScale={8.5} windStrength={1.5} speed={1.2} sunIntensity={6.0} />

            <CameraBob />

            {/* layered additive god rays */}
            <GodRaysLayers sunRef={sunRef} />

            {/* lens dirt using uploaded golden texture */}
            <LensDirtOverlay
                sunRef={sunRef}
                dirtMapUrl={"/mnt/data/A_digital_astrophotograph_captures_an_expansive_vi.png"}
                intensity={0.55}
                tint={[1.05, 0.85, 0.6]}
            />
        </>
    );
}
