import * as THREE from 'three';
import { initScene } from './systems/sceneSetup.js';
import { createSkybox, createHallway } from './objects/environment.js';
import { createCoins } from './objects/coins.js';
import { createLasers } from './objects/lasers.js';
import { setupInputHandlers } from './systems/inputHandler.js';
import { setupRetryButton, hideGameOver } from './systems/uiManager.js';
import { startGame } from './systems/gameLoop.js';
import gameState from './systems/gameState.js';

// Initialize the scene
initScene();

// Create game objects
const skybox = createSkybox();
const hallway = createHallway();
const coins = createCoins();
const lasers = createLasers();

// Setup input handlers
setupInputHandlers();

// Setup retry button
setupRetryButton(() => {
    // Reset game state and start again
    hideGameOver();
    startGame(hallway, skybox, coins, lasers);
});

// Start the game initially
startGame(hallway, skybox, coins, lasers); 