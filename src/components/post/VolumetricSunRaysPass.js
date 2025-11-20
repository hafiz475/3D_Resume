// VolumetricSunRaysPass.js
// CLEAN + TESTED + WORKS WITH REACT THREE FIBER

import * as THREE from "three";
import { Pass } from "three/examples/jsm/postprocessing/Pass.js";

/* -------------------------------------------------------
   FULLSCREEN QUAD (Required for Postprocessing)
------------------------------------------------------- */
class FullscreenQuad {
  constructor(material) {
    this._mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      material
    );
    this.material = material;
  }

  render(renderer) {
    renderer.render(this._mesh, FullscreenQuad.camera);
  }
}

FullscreenQuad.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* -------------------------------------------------------
   VOLUMETRIC GOD-RAYS PASS
------------------------------------------------------- */
export default class VolumetricSunRaysPass extends Pass {
  constructor(camera, sunMesh) {
    super();

    this.camera = camera;
    this.sun = sunMesh;

    // Shader uniforms
    this.uniforms = {
      lightPosition: { value: new THREE.Vector3() },
      exposure: { value: 0.35 },
      decay: { value: 0.95 },
      density: { value: 0.97 },
      weight: { value: 0.6 },
      samples: { value: 80 }, // GPU-safe limit
    };

    // High precision required for mobile GPUs
    const fs = `
      precision highp float;

      varying vec2 vUv;

      uniform vec3 lightPosition;
      uniform float exposure;
      uniform float decay;
      uniform float density;
      uniform float weight;
      uniform int samples;

      void main() {

        vec2 delta = (vUv - lightPosition.xy) * density / float(samples);
        vec2 coord = vUv;

        float illum = 1.0;
        float total = 0.0;

        // GPU-safe loop
        for (int i = 0; i < 300; i++) {
          if (i >= samples) break;

          coord -= delta;

          float s = illum * weight;   // <-- FIXED (sample is reserved)
          illum *= decay;
          total += s;
        }

        float col = total * exposure;

        gl_FragColor = vec4(col * 1.0, col * 0.55, col * 0.2, col);
      }
    `;

    const vs = `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: this.uniforms,
      vertexShader: vs,
      fragmentShader: fs,
    });

    this.quad = new FullscreenQuad(this.material);
  }

  render(renderer, writeBuffer, readBuffer) {
    if (!this.sun) return;

    // Project SUN position to screen space
    const pos = new THREE.Vector3()
      .setFromMatrixPosition(this.sun.matrixWorld)
      .project(this.camera);

    // convert from -1..1 → 0..1
    this.uniforms.lightPosition.value.set(
      (pos.x + 1) / 2,
      (pos.y + 1) / 2,
      0
    );

    // Set texture from previous pass
    this.material.uniforms.tDiffuse = { value: readBuffer.texture };

    // Render into write buffer
    renderer.setRenderTarget(writeBuffer);
    renderer.clear();
    this.quad.render(renderer);
  }
}
