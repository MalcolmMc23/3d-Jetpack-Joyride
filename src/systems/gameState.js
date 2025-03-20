import { GAME_DURATION } from '../constants/gameConstants.js';

// Game state singleton
const state = {
    distance: 0,
    coins: 0,
    isGameActive: false,
    timeRemaining: GAME_DURATION,
    isAscending: false,
    moveLeft: false,
    moveRight: false,
    jetpackActiveTime: 0 // Track how long jetpack has been active
};

export default state; 