import * as THREE from 'three';

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;
camera.position.y = 2;

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg-canvas'),
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x8b5cf6, 100, 50, 2); // Brand color purple
pointLight.position.set(5, 5, 5);
pointLight.castShadow = true;
scene.add(pointLight);

const pinkLight = new THREE.PointLight(0xf472b6, 50, 50, 2); // Neon pink
pinkLight.position.set(-5, -5, 5);
scene.add(pinkLight);

// Group to hold our main object
const heroGroup = new THREE.Group();
scene.add(heroGroup);

// --- The "Late" Coin Concept ---
// 1. The Coin Body
const coinGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 64);
const coinMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0x2e1065,
    emissiveIntensity: 0.2
});
const coin = new THREE.Mesh(coinGeometry, coinMaterial);
coin.rotation.x = Math.PI / 2;
coin.castShadow = true;
coin.receiveShadow = true;
heroGroup.add(coin);

// 2. The Rim (Torus)
const rimGeometry = new THREE.TorusGeometry(4, 0.3, 16, 100);
const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xf472b6,
    emissiveIntensity: 2,
    metalness: 1,
    roughness: 0
});
const rim = new THREE.Mesh(rimGeometry, rimMaterial);
heroGroup.add(rim);

// 3. Floating Particles (The "Dust" of time)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 700;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 40; // Spread out
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// 4. Text "LATE"
const fontLoader = new FontLoader();
fontLoader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
    const textGeometry = new TextGeometry('#LATE', {
        font: font,
        size: 1.5,
        depth: 0.4, // Changed from height to depth
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    });

    // Center the text
    textGeometry.computeBoundingBox();
    const centerOffset = - 0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
    const verticalOffset = - 0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
    textGeometry.translate(centerOffset, verticalOffset, 0);

    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.8,
        roughness: 0.2
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position text on the face of the coin
    textMesh.position.z = 0.3; // Just popping out of the coin
    heroGroup.add(textMesh);
},
    // onProgress
    undefined,
    // onError
    (err) => {
        console.error('Font loading failed. You might need to run this on a local server (CORS).', err);
        // Fallback: Add a simple box or sphere if font fails
        const fallbackGeo = new THREE.BoxGeometry(3, 1, 1);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        heroGroup.add(fallbackMesh);
    });

// Animation Variables
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

// Event Listeners
document.addEventListener('mousemove', onDocumentMouseMove);
window.addEventListener('resize', onWindowResize);

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// Loading Simulation
const loaderElement = document.getElementById('loader');
const progressBar = document.getElementById('progress-bar');

// Simulate loading being "late"
setTimeout(() => {
    progressBar.style.width = '70%';
}, 500);

setTimeout(() => {
    progressBar.style.width = '90%';
}, 1500);

setTimeout(() => {
    progressBar.style.width = '99%';
    // Pause at 99% because we are late
}, 2500);

setTimeout(() => {
    progressBar.style.width = '100%';
    loaderElement.style.opacity = '0';
    setTimeout(() => {
        loaderElement.style.display = 'none';
    }, 1000);
}, 3500); // 3.5 seconds loading

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Rotate the hero object
    heroGroup.rotation.y += 0.005;
    heroGroup.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2; // Gentle wobble

    // Mouse Parallax easing
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    heroGroup.rotation.y += 0.05 * (targetX - heroGroup.rotation.y);
    heroGroup.rotation.x += 0.05 * (targetY - heroGroup.rotation.x);

    // Animate Particles
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = elapsedTime * 0.02;

    // Pulse effects (Scaling)
    const scale = 1 + Math.sin(elapsedTime * 2) * 0.02;
    heroGroup.scale.set(scale, scale, scale);

    renderer.render(scene, camera);
}

animate();
