import * as THREE from 'three';
import { scene } from '../systems/sceneSetup.js';
import {
    COIN_COUNT,
    HALLWAY_LENGTH,
    HALLWAY_HEIGHT
} from '../constants/gameConstants.js';

// Coins setup
export const createCoins = () => {
    const coins = [];
    const coinGeometry = new THREE.SphereGeometry(0.3, 16, 16); // Restored original geometry complexity
    const coinMaterial = new THREE.MeshStandardMaterial({ // Changed back to StandardMaterial
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5
    });

    for (let i = 0; i < COIN_COUNT; i++) {
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        // Position coins at various positions within the hallway
        const distance = -(i * (HALLWAY_LENGTH / COIN_COUNT)) - 10;
        const offsetX = (Math.random() - 0.5) * 4; // Keep coins within hallway width
        const offsetY = Math.random() * (HALLWAY_HEIGHT - 2) + 1; // Distribute coins throughout hallway height

        coin.position.x = offsetX;
        coin.position.y = offsetY;
        coin.position.z = distance;

        scene.add(coin);
        coins.push(coin);
    }

    return coins;
}; 