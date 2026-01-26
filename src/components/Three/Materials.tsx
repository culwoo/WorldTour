import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Distortion Material (Wave)
const DistortionMaterial = shaderMaterial(
    { uTime: 0, uHover: 0, uTexture: null },
    // Vertex
    `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uHover;
    void main() {
        vUv = uv;
        vec3 pos = position;
        // Simple wave on hover
        pos.z += sin(pos.x * 10.0 + uTime * 2.0) * 0.1 * uHover; 
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
    `,
    // Fragment
    `
    uniform sampler2D uTexture;
    uniform float uHover;
    varying vec2 vUv;
    void main() {
        vec2 uv = vUv;
        // Distort UV on hover
        uv.y += sin(uv.x * 10.0) * 0.05 * uHover;
        vec4 color = texture2D(uTexture, uv);
        gl_FragColor = color;
    }
    `
);

// 2. Pixelation Material
const PixelationMaterial = shaderMaterial(
    { uTime: 0, uHover: 0, uTexture: null, uPixels: 20 }, // pixels variable relative to size?
    // Vertex
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment
    `
    uniform sampler2D uTexture;
    uniform float uHover;
    varying vec2 vUv;
    void main() {
        // Pixelate loop
        // uHover 0 -> High pixels (sharp)
        // uHover 1 -> Low pixels (blocky)
        
        // Use a very high number for sharp default, e.g., 4096.0
        float pixels = mix(4096.0, 15.0, uHover);
        
        vec2 uv = vUv;
        float dx = 1.0 / pixels;
        float dy = 1.0 / pixels;
        vec2 coord = vec2(dx * floor(uv.x / dx), dy * floor(uv.y / dy));
        gl_FragColor = texture2D(uTexture, coord);
    }
    `
);

// 3. RGB Shift Material
const RGBShiftMaterial = shaderMaterial(
    { uTime: 0, uHover: 0, uTexture: null },
    // Vertex
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment
    `
    uniform sampler2D uTexture;
    uniform float uHover;
    varying vec2 vUv;
    void main() {
        float shift = uHover * 0.05;
        vec4 r = texture2D(uTexture, vUv + vec2(shift, 0.0));
        vec4 g = texture2D(uTexture, vUv);
        vec4 b = texture2D(uTexture, vUv - vec2(shift, 0.0));
        gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
    }
    `
);


// 4. Noise Dissolve Material / Simple noise overlay
const NoiseMaterial = shaderMaterial(
    { uTime: 0, uHover: 0, uTexture: null },
    `
     varying vec2 vUv;
     void main() {
         vUv = uv;
         gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
     }
     `,
    `
     uniform sampler2D uTexture;
     uniform float uHover;
     uniform float uTime;
     varying vec2 vUv;
     
     // Simple hash function for noise
     float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
     }
     
     void main() {
         vec4 color = texture2D(uTexture, vUv);
         float noise = random(vUv + uTime);
         // Add noise on hover
         vec3 noisyColor = mix(color.rgb, vec3(noise), uHover * 0.5);
         gl_FragColor = vec4(noisyColor, color.a);
     }
     `
);


extend({ DistortionMaterial, PixelationMaterial, RGBShiftMaterial, NoiseMaterial });

export type EffectType = 'distortion' | 'pixelation' | 'rgb' | 'noise';

