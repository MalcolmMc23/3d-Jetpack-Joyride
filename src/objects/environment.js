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

// Create door texture similar to the one in Jetpack Joyride
const createDoorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    // Dark background
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Door frame with blue glow
    context.strokeStyle = '#3399ff';
    context.lineWidth = 8;
    context.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

    // Inner door panels
    context.fillStyle = '#333333';
    context.fillRect(64, 64, canvas.width - 128, canvas.height - 128);

    // Cross in the middle
    context.strokeStyle = '#555555';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(canvas.width / 2, 64);
    context.lineTo(canvas.width / 2, canvas.height - 64);
    context.moveTo(64, canvas.width / 2);
    context.lineTo(canvas.width - 64, canvas.width / 2);
    context.stroke();

    // Add glow effect
    const gradient = context.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 50,
        canvas.width / 2, canvas.height / 2, 150
    );
    gradient.addColorStop(0, 'rgba(51, 153, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(51, 153, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

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

    // Create door texture
    const doorTexture = createDoorTexture();

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

    // Emissive blue window material
    const windowMaterial = new THREE.MeshLambertMaterial({
        color: 0x74ccf4,
        transparent: true,
        opacity: 0.7,
        emissive: 0x74ccf4,
        emissiveIntensity: 0.4
    });

    // Door material with texture
    const doorMaterial = new THREE.MeshLambertMaterial({
        map: doorTexture,
        emissive: 0x3399ff,
        emissiveIntensity: 0.2
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

    // Add some doors to the walls at intervals
    const doorCount = Math.floor(HALLWAY_LENGTH / (WINDOW_SPACING * 3)); // Fewer doors than windows
    const doorGeometry = new THREE.PlaneGeometry(3, 4); // Door size

    for (let i = 0; i < doorCount; i++) {
        // Position doors along the hallway
        const doorZ = -i * WINDOW_SPACING * 3 - WINDOW_SPACING * 2;

        // Add door to left wall (alternating)
        if (i % 2 === 0) {
            const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
            leftDoor.position.set(-width / 2 - 0.05, height / 2 - 1, doorZ);
            leftDoor.rotation.y = Math.PI / 2;
            hallway.add(leftDoor);
        } else {
            // Add door to right wall
            const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
            rightDoor.position.set(width / 2 + 0.05, height / 2 - 1, doorZ);
            rightDoor.rotation.y = -Math.PI / 2;
            hallway.add(rightDoor);
        }
    }

    // Use instanced meshes for windows and frames
    const windowInstanceCount = Math.floor(HALLWAY_LENGTH / WINDOW_SPACING);

    // Left window instances
    const leftWindowGeometry = new THREE.PlaneGeometry(WINDOW_SIZE, WINDOW_SIZE);
    const leftWindowInstancedMesh = new THREE.InstancedMesh(
        leftWindowGeometry,
        windowMaterial,
        windowInstanceCount
    );
    hallway.add(leftWindowInstancedMesh);

    // Right window instances
    const rightWindowGeometry = new THREE.PlaneGeometry(WINDOW_SIZE, WINDOW_SIZE);
    const rightWindowInstancedMesh = new THREE.InstancedMesh(
        rightWindowGeometry,
        windowMaterial,
        windowInstanceCount
    );
    hallway.add(rightWindowInstancedMesh);

    // Window frame instances (simplified to just one box per window)
    const frameGeometry = new THREE.BoxGeometry(WINDOW_SIZE + 0.2, WINDOW_SIZE + 0.2, 0.1);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Dark metal frame

    const leftFrameInstancedMesh = new THREE.InstancedMesh(
        frameGeometry,
        frameMaterial,
        windowInstanceCount
    );
    hallway.add(leftFrameInstancedMesh);

    const rightFrameInstancedMesh = new THREE.InstancedMesh(
        frameGeometry,
        frameMaterial,
        windowInstanceCount
    );
    hallway.add(rightFrameInstancedMesh);

    // Place instances and add only a few key lights
    const dummy = new THREE.Object3D();
    const lightPositions = [];

    for (let i = 0; i < windowInstanceCount; i++) {
        const windowZ = -i * WINDOW_SPACING - WINDOW_SPACING;

        // Left window
        dummy.position.set(-width / 2 - 0.01, height / 2, windowZ);
        dummy.rotation.y = Math.PI / 2;
        dummy.updateMatrix();
        leftWindowInstancedMesh.setMatrixAt(i, dummy.matrix);

        // Right window
        dummy.position.set(width / 2 + 0.01, height / 2, windowZ);
        dummy.rotation.y = -Math.PI / 2;
        dummy.updateMatrix();
        rightWindowInstancedMesh.setMatrixAt(i, dummy.matrix);

        // Left frame - move frame slightly away from window to prevent z-fighting
        dummy.position.set(-width / 2 - 0.1, height / 2, windowZ - 0.05);
        dummy.rotation.y = Math.PI / 2;
        dummy.updateMatrix();
        leftFrameInstancedMesh.setMatrixAt(i, dummy.matrix);

        // Right frame - move frame slightly away from window to prevent z-fighting
        dummy.position.set(width / 2 + 0.1, height / 2, windowZ - 0.05);
        dummy.rotation.y = -Math.PI / 2;
        dummy.updateMatrix();
        rightFrameInstancedMesh.setMatrixAt(i, dummy.matrix);

        // Only add light for windows close to start
        if (i < 6) {
            lightPositions.push({
                left: new THREE.Vector3(-width / 2 + 0.5, height / 2, windowZ),
                right: new THREE.Vector3(width / 2 - 0.5, height / 2, windowZ)
            });
        }
    }

    // Add only a few lights - too many lights kills performance
    lightPositions.forEach(pos => {
        const leftWindowLight = new THREE.PointLight(0x74ccf4, 0.5, 15);
        leftWindowLight.position.copy(pos.left);
        hallway.add(leftWindowLight);

        const rightWindowLight = new THREE.PointLight(0x74ccf4, 0.5, 15);
        rightWindowLight.position.copy(pos.right);
        hallway.add(rightWindowLight);
    });

    // Add ambient light to better see the textures
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    hallway.add(ambientLight);

    leftWindowInstancedMesh.instanceMatrix.needsUpdate = true;
    rightWindowInstancedMesh.instanceMatrix.needsUpdate = true;
    leftFrameInstancedMesh.instanceMatrix.needsUpdate = true;
    rightFrameInstancedMesh.instanceMatrix.needsUpdate = true;

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