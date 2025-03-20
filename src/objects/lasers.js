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

        // Increase safe margins to ensure all parts of the laser stay within bounds
        // This accounts for the increased beam and node sizes
        const safeMarginX = 1.0; // Increased from 0.5 to account for beam thickness and node radius
        const safeMarginY = 1.0; // Increased from 0.5 to account for beam thickness and node radius
        const safeMarginZ = 3.0; // Reduced from 5 to keep diagonal beams more within playable space

        let startX, startY, startZ, endX, endY, endZ, angle, length;

        if (isFullWidth) {
            // Create a laser that spans the full width of the hallway at a random height
            // Ensure height is well within bounds to account for beam thickness
            startY = safeMarginY + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY);
            endY = startY; // Same height (horizontal laser)

            // Left-to-right laser with safe margins
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

            // Keep X position more centered to avoid extending outside bounds
            const centerX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX * 1.5);

            // Bottom point (further from player)
            startX = centerX;
            startY = safeMarginY + Math.random() * 2; // Lower position
            startZ = -safeMarginZ; // Further away from player but reduced

            // Top point (closer to player)
            endX = centerX; // Same X to keep beam vertical in XY plane
            endY = HALLWAY_HEIGHT - safeMarginY - Math.random() * 2; // Higher position
            endZ = safeMarginZ; // Closer to player but reduced

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

            // Create a shorter laser to ensure it stays within bounds
            length = Math.random() * 3 + 3; // Increased length for better visibility

            // Constrain startX to ensure it's not too close to walls - more conservative
            startX = (Math.random() - 0.5) * (HALLWAY_WIDTH - 2 * safeMarginX * 1.5);
            startY = safeMarginY * 1.2 + Math.random() * (HALLWAY_HEIGHT - 2 * safeMarginY * 1.5);
            startZ = 0;

            // Calculate the endpoint with angle and length
            endX = startX + Math.cos(angle) * length;
            endY = startY + Math.sin(angle) * length;
            endZ = 0;

            // Check and fix if endpoint is outside bounds - more aggressive clamping
            if (endX < -HALLWAY_WIDTH / 2 + safeMarginX) {
                // Recalculate angle and length to fit within bounds
                endX = -HALLWAY_WIDTH / 2 + safeMarginX;
                const dy = endY - startY;
                const dx = endX - startX;
                angle = Math.atan2(dy, dx);
                length = Math.sqrt(dx * dx + dy * dy);
            } else if (endX > HALLWAY_WIDTH / 2 - safeMarginX) {
                endX = HALLWAY_WIDTH / 2 - safeMarginX;
                const dy = endY - startY;
                const dx = endX - startX;
                angle = Math.atan2(dy, dx);
                length = Math.sqrt(dx * dx + dy * dy);
            }

            if (endY < safeMarginY) {
                endY = safeMarginY;
                const dy = endY - startY;
                const dx = endX - startX;
                angle = Math.atan2(dy, dx);
                length = Math.sqrt(dx * dx + dy * dy);
            } else if (endY > HALLWAY_HEIGHT - safeMarginY) {
                endY = HALLWAY_HEIGHT - safeMarginY;
                const dy = endY - startY;
                const dx = endX - startX;
                angle = Math.atan2(dy, dx);
                length = Math.sqrt(dx * dx + dy * dy);
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
        const laserGeometry = new THREE.BoxGeometry(length, 0.3, 0.3);
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);

        // Create outer glow using BoxGeometry as well
        const outerGlowGeometry = new THREE.BoxGeometry(length, 0.6, 0.6);
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
        const nodeGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const startNode = new THREE.Mesh(nodeGeometry, nodeMaterial);
        const endNode = new THREE.Mesh(nodeGeometry, nodeMaterial);

        startNode.position.set(startX, startY, startZ);
        endNode.position.set(endX, endY, endZ);

        // Add spiky glow effect to nodes
        const spikeGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const startSpike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        const endSpike = new THREE.Mesh(spikeGeometry, spikeMaterial);

        startSpike.position.set(startX, startY, startZ);
        endSpike.position.set(endX, endY, endZ);

        // Add outer glow for nodes
        const nodeGlowGeometry = new THREE.SphereGeometry(0.9, 16, 16);
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