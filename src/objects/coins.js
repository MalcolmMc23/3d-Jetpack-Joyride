import * as THREE from 'three';
import { scene } from '../systems/sceneSetup.js';
import {
    COIN_COUNT,
    HALLWAY_LENGTH,
    HALLWAY_HEIGHT,
    HALLWAY_WIDTH
} from '../constants/gameConstants.js';

// Coins setup
export const createCoins = () => {
    const coins = [];
    const coinGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const coinMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5
    });

    // Total coins we'll create across all patterns
    let totalCoins = 0;

    // 1. VERTICAL LINE OF COINS - for falling into
    const lineCoinsCount = 15;
    const lineStartDistance = -80;
    const lineEndDistance = -150; // Length of vertical line
    const lineX = -1.5; // Position to the left side

    for (let i = 0; i < lineCoinsCount; i++) {
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        // Position in vertical line
        const t = i / (lineCoinsCount - 1); // 0 to 1
        const distance = lineStartDistance + t * (lineEndDistance - lineStartDistance);

        // Gradually descend from top to bottom
        const height = HALLWAY_HEIGHT - 1.5 - (t * (HALLWAY_HEIGHT - 3));

        coin.position.x = lineX;
        coin.position.y = height;
        coin.position.z = distance;

        scene.add(coin);
        coins.push(coin);
        totalCoins++;
    }

    // 2. SQUARE PATTERN OF COINS
    const squareSize = 3; // Size of square in coins
    const squareDistance = -250; // Position further down hallway
    const squareWidth = 4; // Width of square in world units
    const squareCenterY = HALLWAY_HEIGHT / 2; // Center in hallway height

    for (let row = 0; row < squareSize; row++) {
        for (let col = 0; col < squareSize; col++) {
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);

            // Map grid positions to world coordinates
            const x = (col / (squareSize - 1) - 0.5) * squareWidth;
            const y = squareCenterY + (row / (squareSize - 1) - 0.5) * squareWidth;

            coin.position.x = x;
            coin.position.y = y;
            coin.position.z = squareDistance;

            scene.add(coin);
            coins.push(coin);
            totalCoins++;
        }
    }

    // 3. SPIRAL PATTERN OF COINS
    const spiralCoinsCount = 24;
    const spiralDistance = -400; // Position even further down hallway
    const spiralRadius = 2; // Max radius of spiral
    const spiralCenterY = HALLWAY_HEIGHT / 2; // Center height

    for (let i = 0; i < spiralCoinsCount; i++) {
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);

        // Create spiral using parametric equations
        const t = i / spiralCoinsCount;
        const angle = t * Math.PI * 4; // 2 full rotations
        const radius = t * spiralRadius;

        const x = Math.cos(angle) * radius;
        const y = spiralCenterY + Math.sin(angle) * radius;

        coin.position.x = x;
        coin.position.y = y;
        coin.position.z = spiralDistance - i * 1; // Spread spiral along hallway

        scene.add(coin);
        coins.push(coin);
        totalCoins++;
    }

    // 4. Distribute remaining coins randomly throughout the hallway
    const remainingCoins = Math.max(0, COIN_COUNT - totalCoins);

    for (let i = 0; i < remainingCoins; i++) {
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);

        // Skip the areas where we've placed pattern coins
        let distance;
        do {
            distance = -Math.random() * HALLWAY_LENGTH;
        } while ((distance > lineStartDistance && distance < lineEndDistance) ||
        (Math.abs(distance - squareDistance) < 20) ||
            (Math.abs(distance - spiralDistance) < 40));

        const offsetX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 1);
        const offsetY = Math.random() * (HALLWAY_HEIGHT - 2) + 1;

        coin.position.x = offsetX;
        coin.position.y = offsetY;
        coin.position.z = distance;

        scene.add(coin);
        coins.push(coin);
    }

    return coins;
}; 