import * as THREE from 'three';

// Game constants
const GAME_SPEED = 0.2;
const GRAVITY = 0.0075;
const INITIAL_JETPACK_FORCE = 0.02; // Starting force is very low
const MAX_JETPACK_FORCE = 0.25; // Maximum force after acceleration
const JETPACK_ACCELERATION_RATE = 0.0015; // How fast the jetpack accelerates (reduced from 0.003)
const HALLWAY_LENGTH = 500; // Reduced from 1000
const COIN_COUNT = 50; // Reduced from 100
const GAME_DURATION = 60; // seconds
const WINDOW_SPACING = 20; // Space between windows
const WINDOW_SIZE = 2; // Size of each window
const VISIBLE_DISTANCE = 150; // How far ahead player can see clearly
const HALLWAY_WIDTH = 6; // Define hallway width as a constant
const HALLWAY_HEIGHT = 10; // Define hallway height as a constant
const LASER_COUNT = 15; // Number of laser obstacles
const HORIZONTAL_SPEED = 0.1; // Speed for left/right movement

// Game state
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

// Scene setup
const scene = new THREE.Scene();
// Remove background color as we'll use a skybox instead
// scene.background = new THREE.Color(0x87CEEB);

// Add fog to improve performance (objects fade out in distance)
scene.fog = new THREE.Fog(0x87CEEB, 10, VISIBLE_DISTANCE);

// Camera setup (first-person view)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, VISIBLE_DISTANCE);
camera.position.set(0, 1.7, 0); // Adjusted to standing eye height
camera.lookAt(0, 1.7, -10);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased ambient light to compensate for fewer point lights
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Player setup (invisible in first-person view)
const player = {
    velocity: 0,
    position: new THREE.Vector3(0, 1.7, 0)
};

// Create skybox that exactly matches hallway dimensions
const createSkybox = () => {
    const skyboxGroup = new THREE.Group();

    // Skybox materials
    const skyBlue = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });

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

// Environment setup (hallway with windows)
const createHallway = () => {
    const hallway = new THREE.Group();

    // Hallway dimensions
    const width = HALLWAY_WIDTH;
    const height = HALLWAY_HEIGHT;

    // Materials
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc }); // Changed to Lambert for better performance
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    const windowMaterial = new THREE.MeshLambertMaterial({
        color: 0x74ccf4,
        transparent: true,
        opacity: 0.7,
        emissive: 0x74ccf4,
        emissiveIntensity: 0.2
    });
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Wood color

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

    // Left wall base (no windows)
    const leftWallGeometry = new THREE.PlaneGeometry(HALLWAY_LENGTH, height);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -width / 2;
    leftWall.position.y = height / 2;
    leftWall.position.z = -HALLWAY_LENGTH / 2;
    leftWall.rotation.y = Math.PI / 2;
    hallway.add(leftWall);

    // Right wall base (no windows)
    const rightWallGeometry = new THREE.PlaneGeometry(HALLWAY_LENGTH, height);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.x = width / 2;
    rightWall.position.y = height / 2;
    rightWall.position.z = -HALLWAY_LENGTH / 2;
    rightWall.rotation.y = -Math.PI / 2;
    hallway.add(rightWall);

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
        const leftWindowLight = new THREE.PointLight(0xffffff, 0.5, 15);
        leftWindowLight.position.copy(pos.left);
        hallway.add(leftWindowLight);

        const rightWindowLight = new THREE.PointLight(0xffffff, 0.5, 15);
        rightWindowLight.position.copy(pos.right);
        hallway.add(rightWindowLight);
    });

    leftWindowInstancedMesh.instanceMatrix.needsUpdate = true;
    rightWindowInstancedMesh.instanceMatrix.needsUpdate = true;
    leftFrameInstancedMesh.instanceMatrix.needsUpdate = true;
    rightFrameInstancedMesh.instanceMatrix.needsUpdate = true;

    scene.add(hallway);
    return hallway;
};

// Coins setup
const createCoins = () => {
    const coins = [];
    const coinGeometry = new THREE.SphereGeometry(0.3, 16, 16); // Restored original geometry complexity
    const coinMaterial = new THREE.MeshStandardMaterial({ // Changed back to StandardMaterial
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5
    });

    for (let i = 0; i < COIN_COUNT; i++) {
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        // Position coins at various positions within the hallway
        const distance = -(i * (HALLWAY_LENGTH / COIN_COUNT)) - 10;
        const offsetX = (Math.random() - 0.5) * 4; // Keep coins within hallway width
        const offsetY = Math.random() * (HALLWAY_HEIGHT - 2) + 1; // Distribute coins throughout hallway height

        coin.position.x = offsetX;
        coin.position.y = offsetY;
        coin.position.z = distance;

        scene.add(coin);
        coins.push(coin);
    }

    return coins;
};

// Laser obstacles setup
const createLasers = () => {
    const lasers = [];

    // Create laser beam material with glow effect
    const laserMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdd22,
        emissive: 0xffdd22,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9
    });

    // Create glowing node material
    const nodeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffdd22,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.9
    });

    // Create a spike material for the node outer glow
    const spikeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffee55,
        transparent: true,
        opacity: 0.7
    });

    // Create additional outer glow material
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd22,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < LASER_COUNT; i++) {
        const laserGroup = new THREE.Group();

        // Random laser parameters
        const distance = -(i * (HALLWAY_LENGTH / LASER_COUNT)) - 50; // Start further back

        // Randomly decide if this is a full-width laser or a shorter one
        const isFullWidth = Math.random() < 0.3; // 30% chance of full-width laser
        const isDiagonal = !isFullWidth && Math.random() < 0.3; // 30% chance of diagonal laser (if not full-width)

        // Safe margins
        const safeMarginX = 0.5; // Safe margin from walls
        const safeMarginY = 0.5; // Safe margin from floor/ceiling
        const safeMarginZ = 5; // Safe margin for z depth of diagonal lasers

        let startX, startY, startZ, endX, endY, endZ, angle, length;

        if (isFullWidth) {
            // Create a laser that spans the full width of the hallway at a random height
            startY = safeMarginY + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY);
            endY = startY; // Same height (horizontal laser)

            // Left-to-right laser
            startX = -HALLWAY_WIDTH / 2 + safeMarginX;
            endX = HALLWAY_WIDTH / 2 - safeMarginX;

            // Same Z position (perpendicular to player direction)
            startZ = 0;
            endZ = 0;

            // Calculate angle and length
            angle = 0; // Horizontal laser
            length = HALLWAY_WIDTH - 2 * safeMarginX;
        } else if (isDiagonal) {
            // Create a diagonal laser that points at the player (angled in Z direction)
            // Start with bottom point further away, top point closer to player

            // Random X position within safe bounds
            const centerX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX);

            // Bottom point (further from player)
            startX = centerX;
            startY = safeMarginY + Math.random() * 2; // Lower position
            startZ = -safeMarginZ; // Further away from player

            // Top point (closer to player)
            endX = centerX;
            endY = HALLWAY_HEIGHT - safeMarginY - Math.random() * 2; // Higher position
            endZ = safeMarginZ; // Closer to player

            // Calculate the actual distance between points for proper beam length
            length = Math.sqrt(
                Math.pow(endX - startX, 2) +
                Math.pow(endY - startY, 2) +
                Math.pow(endZ - startZ, 2)
            );

            // This is a 3D angle - we'll handle the rotations differently
            angle = Math.atan2(endY - startY, endX - startX);
        } else {
            // Create a shorter laser with random angle and position (regular 2D laser)
            angle = Math.random() * Math.PI; // Random angle
            length = Math.random() * 3 + 2; // Random length

            // Constrain startX to ensure it's not too close to walls
            startX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX);
            startY = safeMarginY + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY);
            startZ = 0;

            // Calculate the endpoint with angle and length
            endX = startX + Math.cos(angle) * length;
            endY = startY + Math.sin(angle) * length;
            endZ = 0;

            // Check if endpoint is outside bounds and fix if needed
            if (endX < -HALLWAY_WIDTH / 2 + safeMarginX) {
                endX = -HALLWAY_WIDTH / 2 + safeMarginX;
            } else if (endX > HALLWAY_WIDTH / 2 - safeMarginX) {
                endX = HALLWAY_WIDTH / 2 - safeMarginX;
            }

            if (endY < safeMarginY) {
                endY = safeMarginY;
            } else if (endY > HALLWAY_HEIGHT - safeMarginY) {
                endY = HALLWAY_HEIGHT - safeMarginY;
            }
        }

        // Calculate the actual distance between points for proper beam length (for 2D lasers)
        if (!isDiagonal) {
            const beamLength = Math.sqrt(
                Math.pow(endX - startX, 2) +
                Math.pow(endY - startY, 2)
            );
            length = beamLength;
        }

        // Create laser beam using BoxGeometry instead of cylinder
        // This gives us more control over orientation
        const laserGeometry = new THREE.BoxGeometry(length, 0.1, 0.1);
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);

        // Create outer glow using BoxGeometry as well
        const outerGlowGeometry = new THREE.BoxGeometry(length, 0.3, 0.3);
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);

        if (!isDiagonal) {
            // Regular 2D lasers - position at midpoint
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            laser.position.set(midX, midY, 0);
            outerGlow.position.set(midX, midY, 0);

            // Rotate to match the angle
            laser.rotation.z = angle;
            outerGlow.rotation.z = angle;
        } else {
            // For diagonal lasers, we need to handle the 3D positioning differently
            // First place at origin
            laser.position.set(0, 0, 0);
            outerGlow.position.set(0, 0, 0);

            // We need a different approach for diagonal lasers to ensure nodes touch beam ends
            // Create the beam along the X axis with correct length
            laser.scale.x = length / laser.geometry.parameters.width;
            outerGlow.scale.x = length / outerGlow.geometry.parameters.width;

            // Calculate direction vector from start to end
            const dirVec = new THREE.Vector3(
                endX - startX,
                endY - startY,
                endZ - startZ
            ).normalize();

            // Create a temporary object to help with rotation
            const tempObj = new THREE.Object3D();
            tempObj.position.set(startX, startY, startZ);
            tempObj.lookAt(endX, endY, endZ);

            // Position the beam at the start point
            laser.position.copy(tempObj.position);
            outerGlow.position.copy(tempObj.position);

            // Apply rotation to align with direction vector
            laser.rotation.copy(tempObj.rotation);
            outerGlow.rotation.copy(tempObj.rotation);

            // Offset the position to center the beam between the two points
            // We need to move it half-length along the direction vector
            const halfLength = length / 2;
            laser.translateX(halfLength);
            outerGlow.translateX(halfLength);
        }

        // Create glowing nodes at each end
        const nodeGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const startNode = new THREE.Mesh(nodeGeometry, nodeMaterial);
        const endNode = new THREE.Mesh(nodeGeometry, nodeMaterial);

        startNode.position.set(startX, startY, startZ);
        endNode.position.set(endX, endY, endZ);

        // Add spiky glow effect to nodes
        const spikeGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const startSpike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        const endSpike = new THREE.Mesh(spikeGeometry, spikeMaterial);

        startSpike.position.set(startX, startY, startZ);
        endSpike.position.set(endX, endY, endZ);

        // Add outer glow for nodes
        const nodeGlowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const startNodeGlow = new THREE.Mesh(nodeGlowGeometry, outerGlowMaterial);
        const endNodeGlow = new THREE.Mesh(nodeGlowGeometry, outerGlowMaterial);

        startNodeGlow.position.set(startX, startY, startZ);
        endNodeGlow.position.set(endX, endY, endZ);

        // Add everything to the laser group
        laserGroup.add(laser);
        laserGroup.add(outerGlow);
        laserGroup.add(startNode);
        laserGroup.add(endNode);
        laserGroup.add(startSpike);
        laserGroup.add(endSpike);
        laserGroup.add(startNodeGlow);
        laserGroup.add(endNodeGlow);

        // Store collision data and points for later use
        laserGroup.userData = {
            startPoint: new THREE.Vector3(startX, startY, startZ),
            endPoint: new THREE.Vector3(endX, endY, endZ),
            length: length,
            angle: isDiagonal ? null : angle,
            isFullWidth: isFullWidth,
            isDiagonal: isDiagonal
        };

        laserGroup.position.z = distance;

        scene.add(laserGroup);
        lasers.push(laserGroup);
    }

    return lasers;
};

// UI elements
const distanceElement = document.getElementById('distance');
const coinsElement = document.getElementById('coins');
const finalDistanceElement = document.getElementById('final-distance');
const finalCoinsElement = document.getElementById('final-coins');
const gameOverScreen = document.querySelector('.game-over');
const retryButton = document.querySelector('.retry');

// Game initialization
const skybox = createSkybox();
const hallway = createHallway();
const coins = createCoins();
const lasers = createLasers();

// Input handling
document.addEventListener('mousedown', () => {
    state.isAscending = true;
});

document.addEventListener('mouseup', () => {
    state.isAscending = false;
});

document.addEventListener('touchstart', () => {
    state.isAscending = true;
});

document.addEventListener('touchend', () => {
    state.isAscending = false;
});

// Keyboard controls
document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
        case ' ':  // Space bar
            state.isAscending = true;
            break;
        case 'a':
            state.moveLeft = true;
            break;
        case 'd':
            state.moveRight = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
        case ' ':  // Space bar
            state.isAscending = false;
            break;
        case 'a':
            state.moveLeft = false;
            break;
        case 'd':
            state.moveRight = false;
            break;
    }
});

// Game control functions
const startGame = () => {
    state.distance = 0;
    state.coins = 0;
    state.timeRemaining = GAME_DURATION;
    state.isGameActive = true;
    state.jetpackActiveTime = 0; // Reset jetpack active time
    state.moveLeft = false; // Reset horizontal movement state
    state.moveRight = false; // Reset horizontal movement state
    gameOverScreen.style.display = 'none';

    // Reset player position
    player.position.set(0, 1.7, 0);
    player.velocity = 0;

    // Reset camera position
    camera.position.set(0, 1.7, 0);

    // Reset coins
    coins.forEach((coin, i) => {
        const distance = -(i * (HALLWAY_LENGTH / COIN_COUNT)) - 10;
        const offsetX = (Math.random() - 0.5) * 4;
        const offsetY = Math.random() * (HALLWAY_HEIGHT - 2) + 1;

        coin.position.x = offsetX;
        coin.position.y = offsetY;
        coin.position.z = distance;
        coin.visible = true;
    });

    // Reset lasers
    lasers.forEach((laser, i) => {
        const distance = -(i * (HALLWAY_LENGTH / LASER_COUNT)) - 50;

        // Decide if this is a full-width laser or a diagonal or a shorter one
        const isFullWidth = Math.random() < 0.3; // 30% chance of full-width laser
        const isDiagonal = !isFullWidth && Math.random() < 0.3; // 30% chance of diagonal laser (if not full-width)

        // Safe margins
        const safeMarginX = 0.5; // Safe margin from walls
        const safeMarginY = 0.5; // Safe margin from floor/ceiling
        const safeMarginZ = 5; // Safe margin for z depth of diagonal lasers

        let startX, startY, startZ, endX, endY, endZ, angle, length;

        if (isFullWidth) {
            // Create a laser that spans the full width of the hallway at a random height
            startY = safeMarginY + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY);
            endY = startY; // Same height (horizontal laser)

            // Left-to-right laser
            startX = -HALLWAY_WIDTH / 2 + safeMarginX;
            endX = HALLWAY_WIDTH / 2 - safeMarginX;

            // Same Z position (perpendicular to player direction)
            startZ = 0;
            endZ = 0;

            // Calculate angle and length
            angle = 0; // Horizontal laser
            length = HALLWAY_WIDTH - 2 * safeMarginX;
        } else if (isDiagonal) {
            // Create a diagonal laser that points at the player (angled in Z direction)
            // Start with bottom point further away, top point closer to player

            // Random X position within safe bounds
            const centerX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX);

            // Bottom point (further from player)
            startX = centerX;
            startY = safeMarginY + Math.random() * 2; // Lower position
            startZ = -safeMarginZ; // Further away from player

            // Top point (closer to player)
            endX = centerX;
            endY = HALLWAY_HEIGHT - safeMarginY - Math.random() * 2; // Higher position
            endZ = safeMarginZ; // Closer to player

            // Calculate the actual distance between points for proper beam length
            length = Math.sqrt(
                Math.pow(endX - startX, 2) +
                Math.pow(endY - startY, 2) +
                Math.pow(endZ - startZ, 2)
            );

            // This is a 3D angle - we'll handle the rotations differently
            angle = Math.atan2(endY - startY, endX - startX);
        } else {
            // Create a shorter laser with random angle and position
            angle = Math.random() * Math.PI;
            length = Math.random() * 3 + 2;
            startX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX);
            startY = safeMarginY + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY);
            startZ = 0;

            // Calculate the endpoint with angle and length
            endX = startX + Math.cos(angle) * length;
            endY = startY + Math.sin(angle) * length;
            endZ = 0;

            // Check if endpoint is outside bounds and fix if needed
            if (endX < -HALLWAY_WIDTH / 2 + safeMarginX) {
                endX = -HALLWAY_WIDTH / 2 + safeMarginX;
            } else if (endX > HALLWAY_WIDTH / 2 - safeMarginX) {
                endX = HALLWAY_WIDTH / 2 - safeMarginX;
            }

            if (endY < safeMarginY) {
                endY = safeMarginY;
            } else if (endY > HALLWAY_HEIGHT - safeMarginY) {
                endY = HALLWAY_HEIGHT - safeMarginY;
            }
        }

        // Calculate the actual distance between points for proper beam length (for 2D lasers)
        if (!isDiagonal) {
            const beamLength = Math.sqrt(
                Math.pow(endX - startX, 2) +
                Math.pow(endY - startY, 2)
            );
            length = beamLength;
        }

        // Update the laser beam and glow
        const laserBeam = laser.children[0];
        const outerGlow = laser.children[1];

        if (!isDiagonal) {
            // Regular 2D lasers - position at midpoint
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            laserBeam.position.set(midX, midY, 0);
            laserBeam.rotation.z = angle;

            outerGlow.position.set(midX, midY, 0);
            outerGlow.rotation.z = angle;
        } else {
            // For diagonal lasers, we need to handle the 3D positioning differently
            // First reset position to origin
            laserBeam.position.set(0, 0, 0);
            outerGlow.position.set(0, 0, 0);

            // We need a different approach for diagonal lasers to ensure nodes touch beam ends
            // Create the beam along the X axis with correct length
            laserBeam.scale.x = length / laserBeam.geometry.parameters.width;
            outerGlow.scale.x = length / outerGlow.geometry.parameters.width;

            // Calculate direction vector from start to end
            const dirVec = new THREE.Vector3(
                endX - startX,
                endY - startY,
                endZ - startZ
            ).normalize();

            // Create a temporary object to help with rotation
            const tempObj = new THREE.Object3D();
            tempObj.position.set(startX, startY, startZ);
            tempObj.lookAt(endX, endY, endZ);

            // Position the beam at the start point
            laserBeam.position.copy(tempObj.position);
            outerGlow.position.copy(tempObj.position);

            // Apply rotation to align with direction vector
            laserBeam.rotation.copy(tempObj.rotation);
            outerGlow.rotation.copy(tempObj.rotation);

            // Offset the position to center the beam between the two points
            // We need to move it half-length along the direction vector
            const halfLength = length / 2;
            laserBeam.translateX(halfLength);
            outerGlow.translateX(halfLength);
        }

        // Update beam length - scale the x dimension to match the new length
        laserBeam.scale.x = length / laserBeam.geometry.parameters.width;
        outerGlow.scale.x = length / outerGlow.geometry.parameters.width;

        // Update the nodes positions
        const startNode = laser.children[2];
        const endNode = laser.children[3];
        const startSpike = laser.children[4];
        const endSpike = laser.children[5];
        const startNodeGlow = laser.children[6];
        const endNodeGlow = laser.children[7];

        startNode.position.set(startX, startY, startZ);
        endNode.position.set(endX, endY, endZ);
        startSpike.position.set(startX, startY, startZ);
        endSpike.position.set(endX, endY, endZ);
        startNodeGlow.position.set(startX, startY, startZ);
        endNodeGlow.position.set(endX, endY, endZ);

        // Update collision data
        laser.userData = {
            startPoint: new THREE.Vector3(startX, startY, startZ),
            endPoint: new THREE.Vector3(endX, endY, endZ),
            length: length,
            angle: isDiagonal ? null : angle,
            isFullWidth: isFullWidth,
            isDiagonal: isDiagonal
        };

        laser.position.z = distance;
    });

    // Start the animation
    animate();
};

const endGame = () => {
    state.isGameActive = false;
    finalDistanceElement.textContent = Math.floor(state.distance);
    finalCoinsElement.textContent = state.coins;
    gameOverScreen.style.display = 'block';
};

// Update UI
const updateUI = () => {
    distanceElement.textContent = Math.floor(state.distance);
    coinsElement.textContent = state.coins;
};

// Use a clock to ensure consistent timing regardless of framerate
const clock = new THREE.Clock();
let lastTime = 0;

// Game logic
const updateGame = (time) => {
    if (!state.isGameActive) return;

    // Calculate delta time for smooth motion regardless of framerate
    const delta = time - lastTime;
    lastTime = time;

    // Ensure reasonable delta (in case of very low fps or tab switch)
    const clampedDelta = Math.min(delta, 33) / 16.67; // 60fps = 16.67ms per frame

    // Update distance with time delta for consistent speed
    state.distance += GAME_SPEED * clampedDelta;

    // Time remaining
    state.timeRemaining -= clampedDelta / 60; // Assuming 60 FPS
    if (state.timeRemaining <= 0) {
        endGame();
        return;
    }

    // Player physics (vertical movement with gradual jetpack acceleration)
    if (state.isAscending) {
        // Increase jetpack active time
        state.jetpackActiveTime += clampedDelta;

        // Calculate current force based on how long jetpack has been active
        const currentForce = Math.min(
            INITIAL_JETPACK_FORCE + (state.jetpackActiveTime * JETPACK_ACCELERATION_RATE),
            MAX_JETPACK_FORCE
        );

        player.velocity += currentForce * clampedDelta;
    } else {
        // Reset jetpack active time when not ascending
        state.jetpackActiveTime = 0;
    }

    player.velocity -= GRAVITY * clampedDelta;
    player.position.y += player.velocity;

    // Horizontal movement (left/right)
    if (state.moveLeft) {
        player.position.x -= HORIZONTAL_SPEED * clampedDelta;
    }
    if (state.moveRight) {
        player.position.x += HORIZONTAL_SPEED * clampedDelta;
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
    } else if (player.position.y > HALLWAY_HEIGHT - 0.5) { // Adjusted to match new ceiling height
        player.position.y = HALLWAY_HEIGHT - 0.5;
        player.velocity = 0;
    }

    // Update camera position (follows player height and horizontal position)
    camera.position.y = player.position.y;
    camera.position.x = player.position.x;

    // Move hallway and check for reset
    hallway.position.z += GAME_SPEED * clampedDelta;
    if (hallway.position.z > HALLWAY_LENGTH / 2) {
        hallway.position.z = -HALLWAY_LENGTH / 2;
    }

    // Move skybox with hallway
    skybox.position.z = hallway.position.z;

    // Coin collection and movement
    coins.forEach(coin => {
        // Move coin with game speed
        coin.position.z += GAME_SPEED * clampedDelta;

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
                state.coins++;
            }
        }
    });

    // Laser obstacle movement and collision detection
    lasers.forEach(laser => {
        // Move laser with game speed
        laser.position.z += GAME_SPEED * clampedDelta;

        // Check if laser passed the end of hallway
        if (laser.position.z > 10) {
            // Reset laser to beginning of hallway
            laser.position.z -= HALLWAY_LENGTH;

            // Calculate the safe area margins to ensure obstacles stay within bounds
            const safeMarginX = 0.5; // Safe margin from walls
            const safeMarginY = 0.5; // Safe margin from floor/ceiling
            const safeMarginZ = 5; // Safe margin for z depth of diagonal lasers

            // Randomly decide if this is a full-width laser or a shorter one (or maintain the same type)
            // We'll use the stored value for consistency, with a small chance of changing
            const changeType = Math.random() < 0.1; // 10% chance to change type
            const isFullWidth = changeType ? Math.random() < 0.3 : laser.userData.isFullWidth;
            const isDiagonal = changeType ? (!isFullWidth && Math.random() < 0.3) : laser.userData.isDiagonal;

            let startX, startY, startZ, endX, endY, endZ, angle, length;

            if (isFullWidth) {
                // Create a laser that spans the full width of the hallway at a random height
                startY = safeMarginY + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY);
                endY = startY; // Same height (horizontal laser)

                // Left-to-right laser
                startX = -HALLWAY_WIDTH / 2 + safeMarginX;
                endX = HALLWAY_WIDTH / 2 - safeMarginX;

                // Same Z position (perpendicular to player direction)
                startZ = 0;
                endZ = 0;

                // Calculate angle and length
                angle = 0; // Horizontal laser
                length = HALLWAY_WIDTH - 2 * safeMarginX;
            } else if (isDiagonal) {
                // Create a diagonal laser that points at the player (angled in Z direction)
                // Start with bottom point further away, top point closer to player

                // Random X position within safe bounds
                const centerX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX);

                // Bottom point (further from player)
                startX = centerX;
                startY = safeMarginY + Math.random() * 2; // Lower position
                startZ = -safeMarginZ; // Further away from player

                // Top point (closer to player)
                endX = centerX;
                endY = HALLWAY_HEIGHT - safeMarginY - Math.random() * 2; // Higher position
                endZ = safeMarginZ; // Closer to player

                // Calculate the actual distance between points for proper beam length
                length = Math.sqrt(
                    Math.pow(endX - startX, 2) +
                    Math.pow(endY - startY, 2) +
                    Math.pow(endZ - startZ, 2)
                );

                // This is a 3D angle - we'll handle the rotations differently
                angle = Math.atan2(endY - startY, endX - startX);
            } else {
                // Create a shorter laser with random angle and position (regular 2D laser)
                angle = Math.random() * Math.PI; // Random angle
                length = Math.random() * 3 + 2; // Random length

                // Constrain startX to ensure it's not too close to walls
                startX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX);
                startY = safeMarginY + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY);
                startZ = 0;

                // Calculate the endpoint with angle and length
                endX = startX + Math.cos(angle) * length;
                endY = startY + Math.sin(angle) * length;
                endZ = 0;

                // Check if endpoint is outside bounds and fix if needed
                if (endX < -HALLWAY_WIDTH / 2 + safeMarginX) {
                    endX = -HALLWAY_WIDTH / 2 + safeMarginX;
                } else if (endX > HALLWAY_WIDTH / 2 - safeMarginX) {
                    endX = HALLWAY_WIDTH / 2 - safeMarginX;
                }

                if (endY < safeMarginY) {
                    endY = safeMarginY;
                } else if (endY > HALLWAY_HEIGHT - safeMarginY) {
                    endY = HALLWAY_HEIGHT - safeMarginY;
                }
            }

            // Calculate the actual distance between points for proper beam length (for 2D lasers)
            if (!isDiagonal) {
                const beamLength = Math.sqrt(
                    Math.pow(endX - startX, 2) +
                    Math.pow(endY - startY, 2)
                );
                length = beamLength;
            }

            // Update the laser beam and glow
            const laserBeam = laser.children[0];
            const outerGlow = laser.children[1];

            if (!isDiagonal) {
                // Regular 2D lasers - position at midpoint
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;

                // Update beam position and rotation
                laserBeam.position.set(midX, midY, 0);
                laserBeam.rotation.z = angle;

                // Update outer glow position and rotation
                outerGlow.position.set(midX, midY, 0);
                outerGlow.rotation.z = angle;
            } else {
                // For diagonal lasers, we need to handle the 3D positioning differently
                // First reset position to origin
                laserBeam.position.set(0, 0, 0);
                outerGlow.position.set(0, 0, 0);

                // We need a different approach for diagonal lasers to ensure nodes touch beam ends
                // Create the beam along the X axis with correct length
                laserBeam.scale.x = length / laserBeam.geometry.parameters.width;
                outerGlow.scale.x = length / outerGlow.geometry.parameters.width;

                // Calculate direction vector from start to end
                const dirVec = new THREE.Vector3(
                    endX - startX,
                    endY - startY,
                    endZ - startZ
                ).normalize();

                // Create a temporary object to help with rotation
                const tempObj = new THREE.Object3D();
                tempObj.position.set(startX, startY, startZ);
                tempObj.lookAt(endX, endY, endZ);

                // Position the beam at the start point
                laserBeam.position.copy(tempObj.position);
                outerGlow.position.copy(tempObj.position);

                // Apply rotation to align with direction vector
                laserBeam.rotation.copy(tempObj.rotation);
                outerGlow.rotation.copy(tempObj.rotation);

                // Offset the position to center the beam between the two points
                // We need to move it half-length along the direction vector
                const halfLength = length / 2;
                laserBeam.translateX(halfLength);
                outerGlow.translateX(halfLength);
            }

            // Update beam length - scale the x dimension to match the new length
            laserBeam.scale.x = length / laserBeam.geometry.parameters.width;
            outerGlow.scale.x = length / outerGlow.geometry.parameters.width;

            // Update the nodes positions
            const startNode = laser.children[2];
            const endNode = laser.children[3];
            const startSpike = laser.children[4];
            const endSpike = laser.children[5];
            const startNodeGlow = laser.children[6];
            const endNodeGlow = laser.children[7];

            startNode.position.set(startX, startY, startZ);
            endNode.position.set(endX, endY, endZ);
            startSpike.position.set(startX, startY, startZ);
            endSpike.position.set(endX, endY, endZ);
            startNodeGlow.position.set(startX, startY, startZ);
            endNodeGlow.position.set(endX, endY, endZ);

            // Update collision data
            laser.userData = {
                startPoint: new THREE.Vector3(startX, startY, startZ),
                endPoint: new THREE.Vector3(endX, endY, endZ),
                length: length,
                angle: isDiagonal ? null : angle,
                isFullWidth: isFullWidth,
                isDiagonal: isDiagonal
            };
        }

        // Check for collision with player
        if (laser.position.z > -5 && laser.position.z < 5) {
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
            if (distance < 0.5) {
                // Player touched laser - end game
                endGame();
            }
        }
    });

    // Update UI
    updateUI();
};

// Animation loop with timestamp
const animate = (timestamp = 0) => {
    if (!state.isGameActive) return;

    requestAnimationFrame(animate);
    updateGame(timestamp);
    renderer.render(scene, camera);
};

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Start game when retry button is clicked
retryButton.addEventListener('click', startGame);

// Start game initially
startGame(); 