import gameState from './gameState.js';

// Input handling
export const setupInputHandlers = () => {
    document.addEventListener('mousedown', () => {
        gameState.isAscending = true;
    });

    document.addEventListener('mouseup', () => {
        gameState.isAscending = false;
    });

    document.addEventListener('touchstart', () => {
        gameState.isAscending = true;
    });

    document.addEventListener('touchend', () => {
        gameState.isAscending = false;
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        switch (event.key.toLowerCase()) {
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
    });

    document.addEventListener('keyup', (event) => {
        switch (event.key.toLowerCase()) {
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
    });
}; 