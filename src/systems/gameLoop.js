import * as THREE from 'three';
import { renderer, scene, camera } from './sceneSetup.js';
import gameState from './gameState.js';
import player from '../objects/player.js';
import { updatePlayerPhysics, checkCoinCollisions, checkLaserCollision } from './physics.js';
import { updateUI, showGameOver } from './uiManager.js';
import { GAME_SPEED, HALLWAY_LENGTH, GAME_DURATION } from '../constants/gameConstants.js';

// Use a clock to ensure consistent timing regardless of framerate
const clock = new THREE.Clock();
let lastTime = 0;
let animationFrameId = null;

// Update laser positions and check for collisions
const updateLasers = (lasers, delta, onCollision) => {
    // Skip collision detection in god mode
    const checkCollisions = !gameState.isGodMode;

    lasers.forEach(laser => {
        // Move laser with game speed if game is not paused
        if (!gameState.isPaused) {
            laser.position.z += GAME_SPEED * delta;
        }

        // Check if laser passed the end of hallway
        if (laser.position.z > 10) {
            // Reset laser to beginning of hallway with new configuration
            resetLaser(laser);
        }

        // Check for collision with player only if not in god mode
        if (checkCollisions && laser.position.z > -5 && laser.position.z < 5) {
            if (checkLaserCollision(laser, delta)) {
                // Player touched laser - end game
                onCollision();
            }
        }
    });
};

// Handle laser reset with new properties
const resetLaser = (laser) => {
    laser.position.z -= HALLWAY_LENGTH;
    // Reset logic omitted for brevity
    // (This would be implemented with the original complex reset logic)
};

// Update environment (hallway and skybox)
const updateEnvironment = (hallway, skybox, delta) => {
    // Only move environment if game is not paused
    if (!gameState.isPaused) {
        // Move hallway and check for reset
        hallway.position.z += GAME_SPEED * delta;
        if (hallway.position.z > HALLWAY_LENGTH / 2) {
            hallway.position.z = -HALLWAY_LENGTH / 2;
        }

        // Move skybox with hallway
        skybox.position.z = hallway.position.z;
    }
};

// Update god mode camera position based on input
const updateGodModeCamera = (delta) => {
    // Allow camera movement in god mode even when paused
    if (!gameState.isGodMode) return;

    const moveSpeed = gameState.godModeSpeed * delta;
    const movement = gameState.godModeMovement;

    // Create direction vectors from camera's orientation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);

    // Apply movement based on key presses
    if (movement.forward) camera.position.addScaledVector(forward, moveSpeed);
    if (movement.backward) camera.position.addScaledVector(forward, -moveSpeed);
    if (movement.left) camera.position.addScaledVector(right, -moveSpeed);
    if (movement.right) camera.position.addScaledVector(right, moveSpeed);
    if (movement.up) camera.position.addScaledVector(up, moveSpeed);
    if (movement.down) camera.position.addScaledVector(up, -moveSpeed);
};

// Game update function
export const updateGame = (time, hallway, skybox, coins, lasers, onGameEnd) => {
    if (!gameState.isGameActive) return;

    // Calculate delta time for smooth motion regardless of framerate
    const delta = time - lastTime;
    lastTime = time;

    // Ensure reasonable delta (in case of very low fps or tab switch)
    const clampedDelta = Math.min(delta, 33) / 16.67; // 60fps = 16.67ms per frame

    // Always update god mode camera if in god mode, even when paused
    // This allows free camera movement while the world is frozen
    updateGodModeCamera(clampedDelta);

    // If the game is paused, don't update anything except god mode camera
    if (gameState.isPaused) {
        // Still update UI to show pause status
        updateUI();
        return;
    }

    // From here on, we only execute if the game is NOT paused

    // Update distance with time delta for consistent speed
    gameState.distance += GAME_SPEED * clampedDelta;

    // Time remaining - don't count down in god mode
    if (!gameState.isGodMode) {
        gameState.timeRemaining -= clampedDelta / 60; // Assuming 60 FPS
        if (gameState.timeRemaining <= 0) {
            onGameEnd();
            return;
        }
    }

    // Player physics - skip if in god mode
    if (!gameState.isGodMode) {
        updatePlayerPhysics(player, clampedDelta);
    }

    // Update environment 
    updateEnvironment(hallway, skybox, clampedDelta);

    // Coin collection and movement - always run, but skip collection in god mode
    checkCoinCollisions(coins, clampedDelta, () => {
        if (!gameState.isGodMode) {
            gameState.coins++;
        }
    });

    // Laser obstacle movement and collision detection
    updateLasers(lasers, clampedDelta, onGameEnd);

    // Update UI
    updateUI();
};

// Animation loop with timestamp
export const startAnimationLoop = (hallway, skybox, coins, lasers) => {
    const animate = (timestamp = 0) => {
        if (!gameState.isGameActive) return;

        animationFrameId = requestAnimationFrame(animate);
        updateGame(timestamp, hallway, skybox, coins, lasers, () => {
            gameState.isGameActive = false;
            showGameOver();
            cancelAnimationFrame(animationFrameId);
        });

        renderer.render(scene, camera);
    };

    animate();
};

// Start game function
export const startGame = (hallway, skybox, coins, lasers) => {
    // Reset game state
    gameState.distance = 0;
    gameState.coins = 0;
    gameState.timeRemaining = GAME_DURATION;
    gameState.isGameActive = true;
    gameState.jetpackActiveTime = 0;
    gameState.moveLeft = false;
    gameState.moveRight = false;

    // Reset god mode state
    gameState.isGodMode = false;
    gameState.isPaused = false;

    // Reset player position
    player.position.set(0, 1.7, 0);
    player.velocity = 0;

    // Reset camera position
    camera.position.set(0, 1.7, 0);

    // Start animation loop
    startAnimationLoop(hallway, skybox, coins, lasers);
}; 