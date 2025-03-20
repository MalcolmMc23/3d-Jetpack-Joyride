import * as THREE from 'three';
import { scene } from '../systems/sceneSetup.js';
import {
    HALLWAY_WIDTH,
    HALLWAY_HEIGHT,
    HALLWAY_LENGTH,
    WINDOW_SPACING,
    WINDOW_SIZE
} from '../constants/gameConstants.js';

// Create skybox that exactly matches hallway dimensions
export const createSkybox = () => {
    const skyboxGroup = new THREE.Group();

    // Skybox materials - dark blue similar to Jetpack Joyride background
    const skyBlue = new THREE.MeshBasicMaterial({ color: 0x1a2a40, side: THREE.BackSide });

    // Outside box slightly larger than hallway
    const skyboxGeometry = new THREE.BoxGeometry(
        HALLWAY_WIDTH + 0.2,
        HALLWAY_HEIGHT + 0.2,
        HALLWAY_LENGTH
    );
    const skybox = new THREE.Mesh(skyboxGeometry, skyBlue);
    skybox.position.z = -HALLWAY_LENGTH / 2;
    skybox.position.y = HALLWAY_HEIGHT / 2;

    skyboxGroup.add(skybox);
    scene.add(skyboxGroup);

    return skyboxGroup;
};

// Create a panel texture for the walls
const createPanelTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Background color - dark bluish-gray like in Jetpack Joyride
    context.fillStyle = '#2a3b55';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add panel lines
    context.strokeStyle = '#1a2a40';
    context.lineWidth = 6;

    // Horizontal panel lines
    for (let y = 64; y < canvas.height; y += 128) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
    }

    // Vertical panel lines
    for (let x = 64; x < canvas.width; x += 128) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
    }

    // Add bolts/rivets in the corners of each panel
    context.fillStyle = '#5a697e';
    const boltRadius = 5;
    for (let x = 64; x < canvas.width; x += 128) {
        for (let y = 64; y < canvas.height; y += 128) {
            context.beginPath();
            context.arc(x, y, boltRadius, 0, Math.PI * 2);
            context.fill();
        }
    }

    // Add yellow warning stripe in the middle of the wall
    context.fillStyle = '#ffcc00'; // Bright yellow
    const stripeHeight = 20;
    const stripeY = canvas.height * 0.5 - stripeHeight / 2; // Center the stripe
    context.fillRect(0, stripeY, canvas.width, stripeHeight);

    // Add black diagonal lines on the yellow stripe
    context.fillStyle = '#000000';
    const lineWidth = 8;
    const lineSpacing = 24;
    for (let x = -canvas.width; x < canvas.width * 2; x += lineSpacing) {
        context.beginPath();
        context.moveTo(x, stripeY);
        context.lineTo(x + lineWidth + stripeHeight, stripeY + stripeHeight);
        context.lineTo(x + lineWidth * 2 + stripeHeight, stripeY + stripeHeight);
        context.lineTo(x + stripeHeight, stripeY);
        context.closePath();
        context.fill();
    }

    // Add some subtle highlights
    context.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const width = 20 + Math.random() * 30;
        const height = 10 + Math.random() * 20;

        context.beginPath();
        context.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
        context.fill();
    }

    return new THREE.CanvasTexture(canvas);
};

// Create worker/scientist texture
const createWorkerTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');

    // Clear background (will be transparent)
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw scientist in a hazmat suit (simplified)
    // Head
    context.fillStyle = '#ffdbac'; // Skin tone
    context.beginPath();
    context.arc(32, 20, 8, 0, Math.PI * 2);
    context.fill();

    // Body (hazmat suit - yellowish)
    context.fillStyle = '#f0e68c'; // Light yellow
    context.fillRect(26, 28, 12, 20); // Torso
    context.fillRect(26, 48, 4, 14); // Left leg
    context.fillRect(34, 48, 4, 14); // Right leg
    context.fillRect(22, 30, 4, 16); // Left arm
    context.fillRect(38, 30, 4, 16); // Right arm

    // Hazmat suit details
    context.strokeStyle = '#daa520'; // Darker yellow for details
    context.lineWidth = 1;
    context.strokeRect(26, 28, 12, 20); // Torso outline

    return new THREE.CanvasTexture(canvas);
};

// Store workers in an array for easy access in game loop
let workers = [];

// Environment setup (hallway with windows)
export const createHallway = () => {
    const hallway = new THREE.Group();

    // Hallway dimensions
    const width = HALLWAY_WIDTH;
    const height = HALLWAY_HEIGHT;

    // Create panel texture for walls
    const panelTexture = createPanelTexture();
    panelTexture.wrapS = THREE.RepeatWrapping;
    panelTexture.wrapT = THREE.RepeatWrapping;
    panelTexture.repeat.set(5, 1);

    // Materials
    const wallMaterial = new THREE.MeshLambertMaterial({
        map: panelTexture,
        color: 0xffffff, // Use white color to show texture properly
    });

    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const ceilingMaterial = new THREE.MeshLambertMaterial({
        map: panelTexture,
        color: 0xcccccc // Lighter ceiling
    });

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(width, HALLWAY_LENGTH);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.position.z = -HALLWAY_LENGTH / 2;
    hallway.add(floor);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(width, HALLWAY_LENGTH);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    ceiling.position.z = -HALLWAY_LENGTH / 2;
    hallway.add(ceiling);

    // Left wall base
    const leftWallGeometry = new THREE.PlaneGeometry(HALLWAY_LENGTH, height);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -width / 2;
    leftWall.position.y = height / 2;
    leftWall.position.z = -HALLWAY_LENGTH / 2;
    leftWall.rotation.y = Math.PI / 2;
    hallway.add(leftWall);

    // Right wall base
    const rightWallGeometry = new THREE.PlaneGeometry(HALLWAY_LENGTH, height);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.x = width / 2;
    rightWall.position.y = height / 2;
    rightWall.position.z = -HALLWAY_LENGTH / 2;
    rightWall.rotation.y = -Math.PI / 2;
    hallway.add(rightWall);

    // Add ambient light to see the environment
    const ambientLight = new THREE.AmbientLight(0x606060, 1);
    hallway.add(ambientLight);

    // Add some directional lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 5);
    hallway.add(directionalLight);

    // Create workers texture
    const workerTexture = createWorkerTexture();
    const workerMaterial = new THREE.MeshBasicMaterial({
        map: workerTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    // Add workers along the floor
    const workerCount = 20; // Number of workers to add
    const workerGeometry = new THREE.PlaneGeometry(1.2, 2); // Worker size

    // Clear previous workers array
    workers = [];

    for (let i = 0; i < workerCount; i++) {
        const workerZ = -i * WINDOW_SPACING * 1.5 - WINDOW_SPACING; // Space them out
        const workerX = (Math.random() - 0.5) * (width - 1.5); // Random position across width

        const worker = new THREE.Mesh(workerGeometry, workerMaterial);
        worker.position.set(workerX, 1, workerZ); // Position at floor level
        worker.rotation.y = Math.random() > 0.5 ? 0 : Math.PI; // Random initial direction

        // Store original position for animation
        worker.userData = {
            originalX: workerX,
            originalZ: workerZ,
            direction: worker.rotation.y === 0 ? 1 : -1, // Match direction to rotation
            speed: 0.002 + Math.random() * 0.004 // Much slower speed
        };

        workers.push(worker);
        hallway.add(worker);
    }

    // No need to start animation here - will be handled in the game loop

    scene.add(hallway);
    return hallway;
};

// Update workers animation - will be called from game loop
export const updateWorkers = (delta) => {
    workers.forEach(worker => {
        // Move worker back and forth
        worker.position.x += worker.userData.direction * worker.userData.speed * delta;

        // Change direction if too far from original position
        if (Math.abs(worker.position.x - worker.userData.originalX) > 1.5) {
            worker.userData.direction *= -1;
            // Flip the worker to face the new direction
            worker.rotation.y = (worker.userData.direction > 0) ? 0 : Math.PI;
        }
    });
}; 