import * as THREE from 'three';
import { scene } from '../systems/sceneSetup.js';
import {
    LASER_COUNT,
    HALLWAY_LENGTH,
    HALLWAY_WIDTH,
    HALLWAY_HEIGHT
} from '../constants/gameConstants.js';

// Laser obstacles setup
export const createLasers = () => {
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