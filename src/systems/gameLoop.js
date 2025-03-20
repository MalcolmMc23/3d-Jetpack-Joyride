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
    // Reset laser to the beginning of the hallway
    laser.position.z -= HALLWAY_LENGTH;

    // Get existing children - we'll need to reposition them
    const laserBeam = laser.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.geometry.parameters.width > 1);
    const outerGlow = laser.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.geometry.parameters.width !== laserBeam.geometry.parameters.width);
    const startNode = laser.children.find(child => child.geometry instanceof THREE.SphereGeometry && child.geometry.parameters.radius === 0.4 && child.position.x === laser.userData.startPoint.x);
    const endNode = laser.children.find(child => child.geometry instanceof THREE.SphereGeometry && child.geometry.parameters.radius === 0.4 && child.position.x === laser.userData.endPoint.x);
    const startSpike = laser.children.find(child => child.geometry instanceof THREE.SphereGeometry && child.geometry.parameters.radius === 0.7 && child.position.x === laser.userData.startPoint.x);
    const endSpike = laser.children.find(child => child.geometry instanceof THREE.SphereGeometry && child.geometry.parameters.radius === 0.7 && child.position.x === laser.userData.endPoint.x);
    const startNodeGlow = laser.children.find(child => child.geometry instanceof THREE.SphereGeometry && child.geometry.parameters.radius === 0.9 && child.position.x === laser.userData.startPoint.x);
    const endNodeGlow = laser.children.find(child => child.geometry instanceof THREE.SphereGeometry && child.geometry.parameters.radius === 0.9 && child.position.x === laser.userData.endPoint.x);

    // Random parameters for new laser configuration
    const isFullWidth = Math.random() < 0.3; // 30% chance of full-width laser
    const isDiagonal = !isFullWidth && Math.random() < 0.3; // 30% chance of diagonal laser (if not full-width)

    // Safe margins
    const safeMarginX = 1.0;
    const safeMarginY = 1.0;
    const safeMarginZ = 3.0;

    let startX, startY, startZ, endX, endY, endZ, angle, length;

    if (isFullWidth) {
        // Full-width laser logic
        startY = safeMarginY + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY);
        endY = startY;
        startX = -HALLWAY_WIDTH / 2 + safeMarginX;
        endX = HALLWAY_WIDTH / 2 - safeMarginX;
        startZ = 0;
        endZ = 0;
        angle = 0;
        length = HALLWAY_WIDTH - 2 * safeMarginX;
    } else if (isDiagonal) {
        // Diagonal laser logic
        const centerX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX * 1.5);
        startX = centerX;
        startY = safeMarginY + Math.random() * 2;
        startZ = -safeMarginZ;
        endX = centerX;
        endY = HALLWAY_HEIGHT - safeMarginY - Math.random() * 2;
        endZ = safeMarginZ;
        length = Math.sqrt(
            Math.pow(endX - startX, 2) +
            Math.pow(endY - startY, 2) +
            Math.pow(endZ - startZ, 2)
        );
        angle = Math.atan2(endY - startY, endX - startX);
    } else {
        // Regular 2D laser logic
        angle = Math.random() * Math.PI;
        length = Math.random() * 3 + 7; // Using increased minimum length from 5 to 7

        startX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX * 1.5);
        startY = safeMarginY * 1.2 + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY * 1.5);
        startZ = 0;

        endX = startX + Math.cos(angle) * length;
        endY = startY + Math.sin(angle) * length;
        endZ = 0;

        // Boundary checks for endpoint
        if (endX < -HALLWAY_WIDTH / 2 + safeMarginX) {
            endX = -HALLWAY_WIDTH / 2 + safeMarginX;
            const dy = endY - startY;
            const dx = endX - startX;
            angle = Math.atan2(dy, dx);
            length = Math.sqrt(dx * dx + dy * dy);
        } else if (endX > HALLWAY_WIDTH / 2 - safeMarginX) {
            endX = HALLWAY_WIDTH / 2 - safeMarginX;
            const dy = endY - startY;
            const dx = endX - startX;
            angle = Math.atan2(dy, dx);
            length = Math.sqrt(dx * dx + dy * dy);
        }

        if (endY < safeMarginY) {
            endY = safeMarginY;
            const dy = endY - startY;
            const dx = endX - startX;
            angle = Math.atan2(dy, dx);
            length = Math.sqrt(dx * dx + dy * dy);
        } else if (endY > HALLWAY_HEIGHT - safeMarginY) {
            endY = HALLWAY_HEIGHT - safeMarginY;
            const dy = endY - startY;
            const dx = endX - startX;
            angle = Math.atan2(dy, dx);
            length = Math.sqrt(dx * dx + dy * dy);
        }

        // Ensure minimum length for 2D lasers
        if (!isDiagonal) {
            const beamLength = Math.sqrt(
                Math.pow(endX - startX, 2) +
                Math.pow(endY - startY, 2)
            );

            // Ensure the beam length is at least 4 units
            if (beamLength < 6) {
                length = 6;

                // Extend the endpoint along the same direction
                const direction = new THREE.Vector2(endX - startX, endY - startY).normalize();
                endX = startX + direction.x * length;
                endY = startY + direction.y * length;

                // Re-check boundaries for the new endpoint
                if (endX < -HALLWAY_WIDTH / 2 + safeMarginX) {
                    endX = -HALLWAY_WIDTH / 2 + safeMarginX;
                } else if (endX > HALLWAY_WIDTH / 2 - safeMarginX) {
                    endX = HALLWAY_WIDTH / 2 - safeMarginX;
                }

                if (endY < safeMarginY) {
                    endY = safeMarginY;
                } else if (endY > HALLWAY_HEIGHT - safeMarginY) {
                    endY = HALLWAY_HEIGHT - safeMarginY;
                }

                // Recalculate length and angle with adjusted endpoint
                const dx = endX - startX;
                const dy = endY - startY;
                angle = Math.atan2(dy, dx);
                length = Math.sqrt(dx * dx + dy * dy);
            }
        }
    }

    // Update laser beam and outer glow
    if (!isDiagonal) {
        // Update 2D laser
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        // Update laser beam
        laserBeam.scale.set(1, 1, 1); // Reset scale
        laserBeam.geometry.dispose();
        laserBeam.geometry = new THREE.BoxGeometry(length, 0.3, 0.3);
        laserBeam.position.set(midX, midY, 0);
        laserBeam.rotation.z = angle;

        // Update outer glow
        outerGlow.scale.set(1, 1, 1); // Reset scale
        outerGlow.geometry.dispose();
        outerGlow.geometry = new THREE.BoxGeometry(length, 0.6, 0.6);
        outerGlow.position.set(midX, midY, 0);
        outerGlow.rotation.z = angle;
    } else {
        // Update 3D diagonal laser using the new cylinder-based approach
        // First, clean up any existing geometries
        laserBeam.geometry.dispose();
        outerGlow.geometry.dispose();

        // Create cylinder geometries that connect the points precisely
        const laserRadius = 0.15;
        const glowRadius = 0.3;

        // Create new geometries with proper segment count
        const laserGeometry = new THREE.CylinderGeometry(laserRadius, laserRadius, length, 8);
        const glowGeometry = new THREE.CylinderGeometry(glowRadius, glowRadius, length, 8);

        // Apply new geometries
        laserBeam.geometry = laserGeometry;
        outerGlow.geometry = glowGeometry;

        // Reset scales to default
        laserBeam.scale.set(1, 1, 1);
        outerGlow.scale.set(1, 1, 1);

        // Rotate 90 degrees to align with direction (cylinders are along Y axis by default)
        laserBeam.rotation.x = Math.PI / 2;
        outerGlow.rotation.x = Math.PI / 2;

        // Calculate direction vector from start to end
        const direction = new THREE.Vector3(
            endX - startX,
            endY - startY,
            endZ - startZ
        ).normalize();

        // Find midpoint between start and end
        const midpoint = new THREE.Vector3(
            (startX + endX) / 2,
            (startY + endY) / 2,
            (startZ + endZ) / 2
        );

        // Position at midpoint
        laserBeam.position.copy(midpoint);
        outerGlow.position.copy(midpoint);

        // Use quaternion for precise rotation alignment
        const quaternion = new THREE.Quaternion();

        // Default cylinder direction is Y axis (0,1,0)
        const cylinderDirection = new THREE.Vector3(0, 1, 0);

        // Calculate quaternion to rotate from cylinder direction to beam direction
        quaternion.setFromUnitVectors(cylinderDirection, direction);

        // Apply rotation
        laserBeam.quaternion.copy(quaternion);
        outerGlow.quaternion.copy(quaternion);
    }

    // Update node positions
    startNode.position.set(startX, startY, startZ);
    endNode.position.set(endX, endY, endZ);

    // Update spike positions
    startSpike.position.set(startX, startY, startZ);
    endSpike.position.set(endX, endY, endZ);

    // Update node glow positions
    startNodeGlow.position.set(startX, startY, startZ);
    endNodeGlow.position.set(endX, endY, endZ);

    // Update laser userData for collision detection
    laser.userData = {
        startPoint: new THREE.Vector3(startX, startY, startZ),
        endPoint: new THREE.Vector3(endX, endY, endZ),
        length: length,
        angle: isDiagonal ? null : angle,
        isFullWidth: isFullWidth,
        isDiagonal: isDiagonal
    };
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