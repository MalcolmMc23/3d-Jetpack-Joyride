import gameState from './gameState.js';

// UI elements
const distanceElement = document.getElementById('distance');
const coinsElement = document.getElementById('coins');
const finalDistanceElement = document.getElementById('final-distance');
const finalCoinsElement = document.getElementById('final-coins');
const gameOverScreen = document.querySelector('.game-over');
const retryButton = document.querySelector('.retry');

// Create god mode UI
const createGodModeUI = () => {
    // Create god mode indicator
    const godModeIndicator = document.createElement('div');
    godModeIndicator.id = 'god-mode-indicator';
    godModeIndicator.style.position = 'fixed';
    godModeIndicator.style.top = '10px';
    godModeIndicator.style.right = '10px';
    godModeIndicator.style.background = 'rgba(0, 0, 0, 0.5)';
    godModeIndicator.style.color = '#FFDD22';
    godModeIndicator.style.padding = '5px 10px';
    godModeIndicator.style.borderRadius = '5px';
    godModeIndicator.style.fontFamily = 'Arial, sans-serif';
    godModeIndicator.style.fontWeight = 'bold';
    godModeIndicator.style.display = 'none';
    godModeIndicator.textContent = 'GOD MODE';

    // Add pause info
    const pauseInfo = document.createElement('span');
    pauseInfo.id = 'pause-info';
    pauseInfo.style.display = 'block';
    pauseInfo.style.fontSize = '12px';
    pauseInfo.style.marginTop = '5px';
    pauseInfo.textContent = 'Press P to pause';
    godModeIndicator.appendChild(pauseInfo);

    document.body.appendChild(godModeIndicator);

    return godModeIndicator;
};

let godModeIndicator;

// UI management
export const updateUI = () => {
    distanceElement.textContent = Math.floor(gameState.distance);
    coinsElement.textContent = gameState.coins;

    // Update god mode indicator
    if (!godModeIndicator) {
        godModeIndicator = createGodModeUI();
    }

    godModeIndicator.style.display = gameState.isGodMode ? 'block' : 'none';

    // Update pause info
    const pauseInfo = document.getElementById('pause-info');
    if (pauseInfo) {
        pauseInfo.textContent = gameState.isPaused ? 'PAUSED - Press P to resume' : 'Press P to pause';
    }
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