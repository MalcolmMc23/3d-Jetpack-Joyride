import { GAME_DURATION } from '../constants/gameConstants.js';
import * as THREE from 'three';

// Game state singleton
const state = {
    distance: 0,
    coins: 0,
    isGameActive: false,
    timeRemaining: GAME_DURATION,
    isAscending: false,
    moveLeft: false,
    moveRight: false,
    jetpackActiveTime: 0, // Track how long jetpack has been active

    // God mode properties
    isGodMode: false,
    isPaused: false,
    godModeSpeed: 0.3,
    godModeRotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    godModeMovement: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false
    }
};

export default state; 