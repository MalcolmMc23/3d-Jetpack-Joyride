import * as THREE from 'three';
import { renderer, scene, camera } from './sceneSetup.js';
import gameState from './gameState.js';
import player from '../objects/player.js';
import { updatePlayerPhysics, checkCoinCollisions, checkLaserCollision } from './physics.js';
import { updateUI, showGameOver } from './uiManager.js';
import { GAME_SPEED, HALLWAY_LENGTH, GAME_DURATION } from '../constants/gameConstants.js';
import { updateWorkers } from '../objects/environment.js';

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

        // Update workers animation
        updateWorkers(delta);
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

// Update game state for this frame
export const updateGame = (time, hallway, skybox, coins, lasers, onGameEnd) => {
    // Calculate time delta in milliseconds
    const delta = time - (gameState.lastFrameTime || time);
    gameState.lastFrameTime = time;

    // Normalize delta to match expected framerate (60fps)
    // This helps maintain consistent speed regardless of actual framerate
    const normalizedDelta = Math.min(delta, 100) / 16.67;

    // Skip updating if game is paused and not in god mode
    if (gameState.isPaused && !gameState.isGodMode) {
        return;
    }

    // Update time remaining if game is active
    if (gameState.isGameActive && !gameState.isPaused) {
        gameState.timeRemaining -= delta / 1000; // Convert to seconds

        if (gameState.timeRemaining <= 0) {
            // Time's up!
            gameState.timeRemaining = 0;
            gameState.isGameActive = false;
            onGameEnd();
        }

        // Update distance traveled
        gameState.distance += GAME_SPEED * normalizedDelta / 10; // Convert to units
    }

    // Update HUD with current game state
    updateUI();

    // Update player
    if (gameState.isGameActive && !gameState.isPaused) {
        updatePlayerPhysics(player, normalizedDelta);
    }

    // Update environment
    updateEnvironment(hallway, skybox, normalizedDelta);

    // Update coins
    if (gameState.isGameActive && !gameState.isPaused) {
        checkCoinCollisions(coins, normalizedDelta, () => {
            // On coin collection
            gameState.coins += 1;
        });
    }

    // Update lasers/obstacles
    if (gameState.isGameActive && !gameState.isPaused && !gameState.isGodMode) {
        updateLasers(lasers, normalizedDelta, () => {
            // On laser collision
            gameState.isGameActive = false;
            onGameEnd();
        });
    }

    // Handle camera based on mode
    if (gameState.isGodMode) {
        updateGodModeCamera(normalizedDelta);
    } else {
        // Use default camera position (follow player)
        camera.position.x = player.position.x;
        camera.position.y = player.position.y + 0.7;
        camera.position.z = player.position.z + 5;
        camera.lookAt(player.position.x, player.position.y, player.position.z - 10);
    }
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