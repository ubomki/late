const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreSpan = document.getElementById('final-score');

// Game State
let isPlaying = false;
let score = 0;
let lastTime = 0;
let spawnTimer = 0;
let difficultyMultiplier = 1;
let speedMultiplier = 1; // Generic speed multiplier (powerups)

// Responsive Canvas
let canvasWidth, canvasHeight;

function resizeCanvas() {
    const container = document.getElementById('game-container');
    // Maintain a playable aspect ratio or fill available space securely
    // We want it to be tall on mobile, maybe wider on desktop but contained
    let availableWidth = container.clientWidth;
    let availableHeight = container.clientHeight;

    // Limit max width for desktop playability
    if (availableWidth > 600) availableWidth = 600;

    canvas.width = availableWidth;
    canvas.height = availableHeight;
    canvasWidth = availableWidth;
    canvasHeight = availableHeight;

    // Update player pos if needed
    if (player) {
        player.y = canvasHeight - 100;
        player.x = Math.min(player.x, canvasWidth - player.width);
    }
}
window.addEventListener('resize', resizeCanvas);
// resizeCanvas(); // Moved to after player definition

// Game Entities
const player = {
    x: canvasWidth / 2 - 20,
    y: canvasHeight - 100,
    width: 40,
    height: 40,
    color: '#8b5cf6', // brand default
    speed: 300, // pixels per second
    velX: 0
};

// Initial Resize
resizeCanvas(); // Call this AFTER player is defined

let obstacles = []; // {x, y, width, height, speed, type}
let particles = []; // {x, y, vx, vy, life, color}

// Input Handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// Touch Handling
let touchX = null;

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
});

// Mobile Touch Areas
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;

    if (x < canvasWidth / 2) {
        keys.ArrowLeft = true;
        keys.ArrowRight = false;
    } else {
        keys.ArrowRight = true;
        keys.ArrowLeft = false;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
});

// Game Loop
function startGame() {
    isPlaying = true;
    score = 0;
    difficultyMultiplier = 1;
    speedMultiplier = 1;
    obstacles = [];
    particles = [];
    player.x = canvasWidth / 2 - player.width / 2;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    lastTime = performance.now();
    requestAnimationFrame(update);
}

function gameOver() {
    isPlaying = false;
    finalScoreSpan.textContent = Math.floor(score).toString();
    gameOverScreen.classList.remove('hidden');
}

function spawnObstacle() {
    const size = 40 + Math.random() * 20;
    const type = Math.random() > 0.9 ? 'powerup' : 'enemy'; // 10% chance for powerup

    obstacles.push({
        x: Math.random() * (canvasWidth - size),
        y: -size,
        width: size,
        height: size,
        speed: (200 + Math.random() * 100) * difficultyMultiplier,
        type: type,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 5
    });
}

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color || '#fff'
        });
    }
}

function update(time) {
    if (!isPlaying) return;

    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // Update Player
    if (keys.ArrowLeft) player.x -= player.speed * dt;
    if (keys.ArrowRight) player.x += player.speed * dt;

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvasWidth) player.x = canvasWidth - player.width;

    // Score Tracking (Time survived)
    score += dt;
    scoreDisplay.textContent = score.toFixed(2);

    // Difficulty Scaling
    difficultyMultiplier = 1 + (score / 30); // Get harder every 30s

    // Spawning
    spawnTimer += dt;
    if (spawnTimer > 1.0 / difficultyMultiplier) { // Spawn faster over time
        spawnObstacle();
        spawnTimer = 0;
    }

    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += obs.speed * speedMultiplier * dt;
        obs.rotation += obs.rotSpeed * dt;

        // Collision Detection
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.height + player.y > obs.y
        ) {
            if (obs.type === 'enemy') {
                createParticles(player.x + player.width / 2, player.y + player.height / 2, '#f472b6', 50);
                gameOver();
                return; // Stop updating
            } else if (obs.type === 'powerup') {
                // Powerup effect: Slow down time briefly
                speedMultiplier = 0.5;
                setTimeout(() => { speedMultiplier = 1; }, 3000); // Lasts 3 seconds
                createParticles(obs.x, obs.y, '#a78bfa', 20);
                obstacles.splice(i, 1);
                continue;
            }
        }

        // Cleanup
        if (obs.y > canvasHeight) {
            obstacles.splice(i, 1);
        }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt * 2;
        if (p.life <= 0) particles.splice(i, 1);
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    // Clear Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Grid lines for "Retro" feel
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const offset = (Date.now() / 10) % gridSize;

    for (let y = offset; y < canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }

    // Draw Player (#LATE Coin)
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    // ctx.rotate(Date.now() / 200); // Spin loop

    // Coin Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Coin Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('#LATE', 0, 0);

    ctx.restore();

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
        ctx.rotate(obs.rotation);

        if (obs.type === 'enemy') {
            // Alarm Clock Appearance
            ctx.fillStyle = '#fe1010'; // Red
            // Main body
            ctx.beginPath();
            ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
            ctx.fill();
            // Bells
            ctx.fillStyle = '#999';
            ctx.beginPath();
            ctx.arc(-obs.width / 3, -obs.width / 3, obs.width / 4, 0, Math.PI * 2);
            ctx.arc(obs.width / 3, -obs.width / 3, obs.width / 4, 0, Math.PI * 2);
            ctx.fill();
            // Face
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, obs.width / 2 - 4, 0, Math.PI * 2);
            ctx.fill();
            // Hands
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -obs.width / 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(obs.width / 4, 0);
            ctx.stroke();

        } else {
            // Powerup Appearance (Blue Pill / Chill pill)
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.roundRect(-obs.width / 2, -obs.height / 4, obs.width, obs.height / 2, 10);
            ctx.fill();
            // Reflection
            ctx.fillStyle = '#93c5fd';
            ctx.beginPath();
            ctx.roundRect(-obs.width / 2 + 5, -obs.height / 4 + 5, obs.width / 2, 5, 2);
            ctx.fill();
        }

        ctx.restore();
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
}

// Button Events
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
