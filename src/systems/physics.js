import * as THREE from 'three';
import gameState from './gameState.js';
import {
    GRAVITY,
    INITIAL_JETPACK_FORCE,
    MAX_JETPACK_FORCE,
    JETPACK_ACCELERATION_RATE,
    HORIZONTAL_SPEED,
    HALLWAY_WIDTH,
    HALLWAY_HEIGHT,
    HALLWAY_LENGTH,
    GAME_SPEED
} from '../constants/gameConstants.js';
import { camera } from './sceneSetup.js';

// Update player physics
export const updatePlayerPhysics = (player, delta) => {
    // Player physics (vertical movement with gradual jetpack acceleration)
    if (gameState.isAscending) {
        // Increase jetpack active time
        gameState.jetpackActiveTime += delta;

        // Calculate current force based on how long jetpack has been active
        const currentForce = Math.min(
            INITIAL_JETPACK_FORCE + (gameState.jetpackActiveTime * JETPACK_ACCELERATION_RATE),
            MAX_JETPACK_FORCE
        );

        player.velocity += currentForce * delta;
    } else {
        // Reset jetpack active time when not ascending
        gameState.jetpackActiveTime = 0;
    }

    player.velocity -= GRAVITY * delta;
    player.position.y += player.velocity;

    // Horizontal movement (left/right)
    if (gameState.moveLeft) {
        player.position.x -= HORIZONTAL_SPEED * delta;
    }
    if (gameState.moveRight) {
        player.position.x += HORIZONTAL_SPEED * delta;
    }

    // Keep player within hallway bounds (horizontal)
    if (player.position.x < -HALLWAY_WIDTH / 2 + 0.5) {
        player.position.x = -HALLWAY_WIDTH / 2 + 0.5;
    } else if (player.position.x > HALLWAY_WIDTH / 2 - 0.5) {
        player.position.x = HALLWAY_WIDTH / 2 - 0.5;
    }

    // Keep player within hallway bounds (vertical)
    if (player.position.y < 0.5) {
        player.position.y = 0.5;
        player.velocity = 0;
    } else if (player.position.y > HALLWAY_HEIGHT - 0.5) {
        player.position.y = HALLWAY_HEIGHT - 0.5;
        player.velocity = 0;
    }

    // Update camera position (follows player height and horizontal position)
    camera.position.y = player.position.y;
    camera.position.x = player.position.x;
};

// Check for coin collisions
export const checkCoinCollisions = (coins, delta, onCollect) => {
    coins.forEach(coin => {
        // Move coin with game speed
        coin.position.z += GAME_SPEED * delta;

        // Check if coin passed the end of hallway
        if (coin.position.z > 10) {
            // Reset coin to beginning of hallway
            coin.position.z -= HALLWAY_LENGTH;
            const offsetX = (Math.random() - 0.5) * 4;
            const offsetY = Math.random() * (HALLWAY_HEIGHT - 2) + 1;
            coin.position.x = offsetX;
            coin.position.y = offsetY;
            coin.visible = true;
        }

        // Check for collection (if coin is near player)
        if (coin.visible && coin.position.z > -1 && coin.position.z < 1) {
            const dx = coin.position.x - camera.position.x;
            const dy = coin.position.y - camera.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 1) {
                coin.visible = false;
                onCollect();
            }
        }
    });
};

// Check for laser collisions
export const checkLaserCollision = (laser, delta) => {
    // Get the laser's start and end points in world space
    const startPoint = laser.userData.startPoint.clone();
    const endPoint = laser.userData.endPoint.clone();

    // Adjust Z positions based on laser position
    startPoint.z += laser.position.z;
    endPoint.z += laser.position.z;

    // Calculate the closest point on the laser line to the player (in 3D)
    const playerPos = camera.position.clone();
    const line = endPoint.clone().sub(startPoint);
    const lineLength = line.length();
    const lineDirection = line.clone().normalize();

    // Vector from start of line to player
    const startToPlayer = playerPos.clone().sub(startPoint);

    // Project startToPlayer onto line
    const projection = startToPlayer.dot(lineDirection);

    // Clamp projection to line segment
    const clampedProjection = Math.max(0, Math.min(lineLength, projection));

    // Get closest point on line to player
    const closestPoint = startPoint.clone().add(lineDirection.multiplyScalar(clampedProjection));

    // Distance from player to closest point
    const distance = playerPos.distanceTo(closestPoint);

    // If player is too close to the laser (radius of 0.5)
    return distance < 0.5;
}; 