import gameState from './gameState.js';

// UI elements
const distanceElement = document.getElementById('distance');
const coinsElement = document.getElementById('coins');
const finalDistanceElement = document.getElementById('final-distance');
const finalCoinsElement = document.getElementById('final-coins');
const gameOverScreen = document.querySelector('.game-over');
const retryButton = document.querySelector('.retry');

// UI management
export const updateUI = () => {
    distanceElement.textContent = Math.floor(gameState.distance);
    coinsElement.textContent = gameState.coins;
};

// Game over UI
export const showGameOver = () => {
    finalDistanceElement.textContent = Math.floor(gameState.distance);
    finalCoinsElement.textContent = gameState.coins;
    gameOverScreen.style.display = 'block';
};

export const hideGameOver = () => {
    gameOverScreen.style.display = 'none';
};

// Setup retry button
export const setupRetryButton = (callback) => {
    retryButton.addEventListener('click', callback);
}; 