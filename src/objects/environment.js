import * as THREE from 'three';
import { scene, camera } from '../systems/sceneSetup.js';
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

    // Outside box slightly larger than hallway - make it even larger to prevent gaps
    const skyboxGeometry = new THREE.BoxGeometry(
        HALLWAY_WIDTH + 2, // Increased from 0.2 to 2 for better coverage
        HALLWAY_HEIGHT + 2, // Increased from 0.2 to 2 for better coverage
        HALLWAY_LENGTH + 10 // Add extra length to ensure complete coverage
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

    // Draw character inspired by Jetpack Joyride
    // Helper function for shading
    const drawWithShading = (x, y, width, height, baseColor, shadeColor, lightX = 0) => {
        // Base color
        context.fillStyle = baseColor;
        context.fillRect(x, y, width, height);

        // Add shading for 3D effect
        const gradient = context.createLinearGradient(x + lightX, y, x + width, y);
        gradient.addColorStop(0, 'rgba(255,255,255,0.2)'); // Highlight
        gradient.addColorStop(0.5, 'rgba(0,0,0,0)');       // Mid tone
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');       // Shadow

        context.fillStyle = gradient;
        context.fillRect(x, y, width, height);

        // Add outline
        context.strokeStyle = shadeColor;
        context.lineWidth = 1;
        context.strokeRect(x, y, width, height);
    };

    // Head - white/light gray helmet with dark visor
    context.fillStyle = '#e8e8e0'; // Light gray for helmet
    context.beginPath();
    context.arc(32, 20, 9, 0, Math.PI * 2);
    context.fill();

    // Add shading to helmet
    const helmetGradient = context.createRadialGradient(30, 18, 1, 32, 20, 9);
    helmetGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
    helmetGradient.addColorStop(1, 'rgba(0,0,0,0.2)');
    context.fillStyle = helmetGradient;
    context.beginPath();
    context.arc(32, 20, 9, 0, Math.PI * 2);
    context.fill();

    // Helmet outline
    context.strokeStyle = '#aaaaaa';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(32, 20, 9, 0, Math.PI * 2);
    context.stroke();

    // Visor (dark blue)
    context.fillStyle = '#6a89cc';
    context.fillRect(28, 18, 8, 4);

    // Visor shine
    const visorGradient = context.createLinearGradient(28, 18, 36, 22);
    visorGradient.addColorStop(0, 'rgba(255,255,255,0.7)');
    visorGradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = visorGradient;
    context.fillRect(28, 18, 8, 4);

    // Body (yellowish) with 3D shading
    drawWithShading(26, 28, 12, 20, '#f0e68c', '#daa520', 3);

    // Jetpack (golden yellow) with 3D shading
    drawWithShading(24, 30, 6, 16, '#ffd700', '#b8860b', 1);

    // Legs with 3D shading
    drawWithShading(26, 48, 4, 14, '#f0e68c', '#daa520', 1); // Left leg
    drawWithShading(34, 48, 4, 14, '#f0e68c', '#daa520', 1); // Right leg

    // Arms with 3D shading
    drawWithShading(38, 30, 4, 16, '#f0e68c', '#daa520', 1); // Right arm

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
    panelTexture.repeat.set(20, 1); // Increase repeat to create more panels, enhancing the infinite effect

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

    // Add end wall at far end of hallway to prevent seeing outside the map
    const endWallGeometry = new THREE.PlaneGeometry(width, height);
    const endWall = new THREE.Mesh(endWallGeometry, wallMaterial);
    endWall.position.x = 0;
    endWall.position.y = height / 2;
    endWall.position.z = -HALLWAY_LENGTH; // Position at the far end of the hallway
    endWall.rotation.y = Math.PI; // Face toward the player
    hallway.add(endWall);

    // Add an additional wall at the beginning of the hallway (player's starting point)
    const startWallGeometry = new THREE.PlaneGeometry(width, height);
    const startWall = new THREE.Mesh(startWallGeometry, wallMaterial);
    startWall.position.x = 0;
    startWall.position.y = height / 2;
    startWall.position.z = 0;
    hallway.add(startWall);

    // Add ambient light to see the environment
    const ambientLight = new THREE.AmbientLight(0x606060, 0.7);
    hallway.add(ambientLight);

    // Add some directional lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 5);
    hallway.add(directionalLight);

    // Add receding lights to create depth illusion
    const lightCount = 20; // Number of lights down the hallway
    const lightSpacing = HALLWAY_LENGTH / lightCount;

    for (let i = 0; i < lightCount; i++) {
        // Position lights along the hallway at regular intervals
        const lightZ = -i * lightSpacing - lightSpacing / 2;
        const lightIntensity = Math.max(0.1, 1 - (i / lightCount) * 0.8); // Lights get dimmer with distance

        // Ceiling lights
        const ceilingLight = new THREE.PointLight(0xffffff, lightIntensity, lightSpacing * 2);
        ceilingLight.position.set(0, height - 0.5, lightZ);
        hallway.add(ceilingLight);

        // Add light fixtures to ceiling (small cylinders)
        if (i < lightCount * 0.6) { // Only add fixtures for closer lights to improve performance
            const fixtureGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
            const fixtureMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: lightIntensity
            });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set(0, height - 0.05, lightZ);
            fixture.rotation.x = Math.PI / 2;
            hallway.add(fixture);
        }
    }

    // Create workers texture
    const workerTexture = createWorkerTexture();
    const workerMaterial = new THREE.MeshBasicMaterial({
        map: workerTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    // Add workers along the floor
    const workerCount = 20; // Number of workers to add

    // Create actual 3D models instead of sprites
    // Clear previous workers array
    workers = [];

    for (let i = 0; i < workerCount; i++) {
        const workerZ = -i * WINDOW_SPACING * 1.5 - WINDOW_SPACING; // Space them out
        const workerX = (Math.random() - 0.5) * (width - 1.5); // Random position across width

        // Create a group for the worker
        const workerGroup = new THREE.Group();
        workerGroup.position.set(workerX, 0, workerZ); // Set y=0 to place on floor

        // Create a 3D model for the worker
        // Body - main box
        const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xf0e68c,
            specular: 0x111111,
            shininess: 30
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6; // Center of the box is at half its height
        workerGroup.add(body);

        // Head - sphere
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0xe8e8e0,
            specular: 0x333333,
            shininess: 50
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.35; // Above the body
        workerGroup.add(head);

        // Visor
        const visorGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.2);
        const visorMaterial = new THREE.MeshPhongMaterial({
            color: 0x6a89cc,
            transparent: true,
            opacity: 0.8,
            specular: 0xffffff,
            shininess: 100,
            emissive: 0x3a59ac,
            emissiveIntensity: 0.3
        });
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.y = 1.35;
        visor.position.z = 0.15;
        workerGroup.add(visor);

        // Jetpack
        const jetpackGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.2);
        const jetpackMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            specular: 0xffaa00,
            shininess: 80
        });
        const jetpack = new THREE.Mesh(jetpackGeometry, jetpackMaterial);
        jetpack.position.y = 0.7;
        jetpack.position.z = -0.25;
        workerGroup.add(jetpack);

        // Jetpack flame
        const flameGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7,
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 0.3;
        flame.position.z = -0.25;
        flame.rotation.x = Math.PI; // Point downward
        // Store reference to animate flame
        workerGroup.userData.flame = flame;
        workerGroup.add(flame);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const armMaterial = new THREE.MeshPhongMaterial({
            color: 0xf0e68c,
            specular: 0x111111,
            shininess: 30
        });

        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 0.8, 0);
        workerGroup.add(leftArm);

        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 0.8, 0);
        workerGroup.add(rightArm);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const legMaterial = new THREE.MeshPhongMaterial({
            color: 0xf0e68c,
            specular: 0x111111,
            shininess: 30
        });

        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, 0.3, 0);
        workerGroup.userData.leftLeg = leftLeg;
        workerGroup.add(leftLeg);

        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, 0.3, 0);
        workerGroup.userData.rightLeg = rightLeg;
        workerGroup.add(rightLeg);

        // Create shadow
        const shadowGeometry = new THREE.CircleGeometry(0.4, 16);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2; // Flat on the ground
        shadow.position.y = 0.01; // Just above the floor
        workerGroup.add(shadow);

        // Set initial rotation
        const initialDirection = Math.random() > 0.5 ? 1 : -1;
        workerGroup.rotation.y = initialDirection > 0 ? 0 : Math.PI;

        // Store original position for animation
        workerGroup.userData = {
            originalX: workerX,
            originalZ: workerZ,
            direction: initialDirection,
            speed: 0.004 + Math.random() * 0.003, // Slightly faster speed for better visibility
        };

        workers.push(workerGroup);
        hallway.add(workerGroup);
    }

    // No need to start animation here - will be handled in the game loop

    scene.add(hallway);
    return hallway;
};

// Update workers animation - will be called from game loop
export const updateWorkers = (delta) => {
    workers.forEach(workerGroup => {
        // Move worker back and forth
        workerGroup.position.x += workerGroup.userData.direction * workerGroup.userData.speed * delta;

        // Change direction if too far from original position
        if (Math.abs(workerGroup.position.x - workerGroup.userData.originalX) > 1.5) {
            workerGroup.userData.direction *= -1;
            // Rotate the entire group to face the new direction
            workerGroup.rotation.y = (workerGroup.userData.direction > 0) ? 0 : Math.PI;
        }

        // Animate legs for walking motion
        if (workerGroup.userData.leftLeg && workerGroup.userData.rightLeg) {
            const walkSpeed = workerGroup.userData.speed * 15;
            const walkTime = performance.now() * 0.005;

            // Swing legs back and forth
            workerGroup.userData.leftLeg.rotation.x = Math.sin(walkTime * walkSpeed) * 0.5;
            workerGroup.userData.rightLeg.rotation.x = Math.sin(walkTime * walkSpeed + Math.PI) * 0.5;
        }

        // Animate jetpack flame
        if (workerGroup.userData.flame) {
            // Pulsate the flame size
            const flameTime = performance.now() * 0.01;
            const pulseScale = 0.8 + Math.sin(flameTime) * 0.2;
            workerGroup.userData.flame.scale.set(pulseScale, pulseScale, pulseScale);

            // Randomly adjust flame opacity for flicker effect
            workerGroup.userData.flame.material.opacity = 0.5 + Math.random() * 0.3;
        }
    });
}; 