import gameState from './gameState.js';
import { camera } from './sceneSetup.js';

// Pointer lock variables for mouse control in god mode
let isPointerLocked = false;
const PI_2 = Math.PI / 2;

// Setup pointer lock
const setupPointerLock = () => {
    // Request pointer lock when clicking on canvas in god mode
    document.addEventListener('click', () => {
        if (gameState.isGodMode && !isPointerLocked) {
            document.body.requestPointerLock();
        }
    });

    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement !== null;
    });

    // Handle mouse movement for first-person camera in god mode
    document.addEventListener('mousemove', (event) => {
        if (gameState.isGodMode && isPointerLocked) {
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;

            // Rotate camera based on mouse movement
            gameState.godModeRotation.y -= movementX * 0.002;
            gameState.godModeRotation.x -= movementY * 0.002;

            // Limit vertical rotation to avoid flipping
            gameState.godModeRotation.x = Math.max(-PI_2, Math.min(PI_2, gameState.godModeRotation.x));

            // Apply rotation to camera
            camera.rotation.copy(gameState.godModeRotation);
        }
    });
};

// Input handling
export const setupInputHandlers = () => {
    // Standard game controls
    document.addEventListener('mousedown', () => {
        if (!gameState.isGodMode) {
            gameState.isAscending = true;
        }
    });

    document.addEventListener('mouseup', () => {
        if (!gameState.isGodMode) {
            gameState.isAscending = false;
        }
    });

    document.addEventListener('touchstart', () => {
        if (!gameState.isGodMode) {
            gameState.isAscending = true;
        }
    });

    document.addEventListener('touchend', () => {
        if (!gameState.isGodMode) {
            gameState.isAscending = false;
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();

        // Toggle god mode with 'G' key
        if (key === 'g') {
            toggleGodMode();
            return;
        }

        // Toggle pause with 'P' key when in god mode
        if (key === 'p' && gameState.isGodMode) {
            gameState.isPaused = !gameState.isPaused;
            return;
        }

        // Normal game controls when not in god mode
        if (!gameState.isGodMode) {
            switch (key) {
                case 'w':
                case ' ':  // Space bar
                    gameState.isAscending = true;
                    break;
                case 'a':
                    gameState.moveLeft = true;
                    break;
                case 'd':
                    gameState.moveRight = true;
                    break;
            }
        }
        // God mode movement controls
        else {
            switch (key) {
                case 'w':
                    gameState.godModeMovement.forward = true;
                    break;
                case 's':
                    gameState.godModeMovement.backward = true;
                    break;
                case 'a':
                    gameState.godModeMovement.left = true;
                    break;
                case 'd':
                    gameState.godModeMovement.right = true;
                    break;
                case ' ':  // Space bar - up
                    gameState.godModeMovement.up = true;
                    break;
                case 'shift':  // Shift - down
                    gameState.godModeMovement.down = true;
                    break;
                // Speed control
                case 'q':  // Decrease speed
                    gameState.godModeSpeed = Math.max(0.05, gameState.godModeSpeed - 0.05);
                    break;
                case 'e':  // Increase speed
                    gameState.godModeSpeed = Math.min(1.0, gameState.godModeSpeed + 0.05);
                    break;
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();

        // Normal game controls when not in god mode
        if (!gameState.isGodMode) {
            switch (key) {
                case 'w':
                case ' ':  // Space bar
                    gameState.isAscending = false;
                    break;
                case 'a':
                    gameState.moveLeft = false;
                    break;
                case 'd':
                    gameState.moveRight = false;
                    break;
            }
        }
        // God mode movement controls
        else {
            switch (key) {
                case 'w':
                    gameState.godModeMovement.forward = false;
                    break;
                case 's':
                    gameState.godModeMovement.backward = false;
                    break;
                case 'a':
                    gameState.godModeMovement.left = false;
                    break;
                case 'd':
                    gameState.godModeMovement.right = false;
                    break;
                case ' ':  // Space bar - up
                    gameState.godModeMovement.up = false;
                    break;
                case 'shift':  // Shift - down
                    gameState.godModeMovement.down = false;
                    break;
            }
        }
    });

    // Setup pointer lock for god mode
    setupPointerLock();
};

// Function to toggle god mode
const toggleGodMode = () => {
    gameState.isGodMode = !gameState.isGodMode;

    if (gameState.isGodMode) {
        // Store original camera position and rotation for restoration
        gameState.originalCameraPosition = camera.position.clone();
        gameState.originalCameraRotation = camera.rotation.clone();

        // Reset all god mode movement flags
        Object.keys(gameState.godModeMovement).forEach(key => {
            gameState.godModeMovement[key] = false;
        });

        // Set initial god mode rotation from current camera
        gameState.godModeRotation.copy(camera.rotation);

        console.log("God mode activated. Use WASD to move, Space/Shift for up/down, mouse to look.");
    } else {
        // Restore original camera position and rotation when exiting god mode
        if (gameState.originalCameraPosition) {
            camera.position.copy(gameState.originalCameraPosition);
        }
        if (gameState.originalCameraRotation) {
            camera.rotation.copy(gameState.originalCameraRotation);
        }

        // Unpause game when exiting god mode
        gameState.isPaused = false;

        // Exit pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        console.log("God mode deactivated. Returning to normal gameplay.");
    }
}; 