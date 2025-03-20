import * as THREE from 'three';
import { VISIBLE_DISTANCE } from '../constants/gameConstants.js';

// Scene setup
export const scene = new THREE.Scene();
// Adjust fog for infinite hallway effect - start fog further away but make it thicker
scene.fog = new THREE.Fog(0x1a2a40, 80, 150);

// Camera setup (first-person view)
export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, VISIBLE_DISTANCE);
camera.position.set(0, 1.7, 0); // Adjusted to standing eye height
camera.lookAt(0, 1.7, -10);

// Renderer setup
export const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
document.body.appendChild(renderer.domElement);

// Lights
export const setupLights = () => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased ambient light to compensate for fewer point lights
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
};

// Handle window resize
export const setupResizeHandler = () => {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
};

// Initialize scene
export const initScene = () => {
    setupLights();
    setupResizeHandler();
    return { scene, camera, renderer };
}; 