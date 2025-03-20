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
export const createHallway = () => {
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