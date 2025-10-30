// Get elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const nicknameModal = document.getElementById('nicknameModal');
const nicknameInput = document.getElementById('nicknameInput');
const nicknameBtn = document.getElementById('nicknameBtn');
const playerNameElement = document.getElementById('playerName');
const soundToggleBtn = document.getElementById('soundToggle');
const musicToggleBtn = document.getElementById('musicToggle');

// Game variables
let gameRunning = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 3;
let gravity = 0.4;
let playerName = localStorage.getItem('playerName') || '';
let lastSpeedIncrease = 0;

// Load player image
const playerImg = new Image();
playerImg.src = 'person.png';

// Player
const player = {
    x: 50,
    y: 0,
    width: 80,
    height: 80,
    velocityY: 0,
    jumping: false,
    grounded: false
};

// Obstacles
let obstacles = [];
let obstacleTimer = 0;
const obstacleInterval = 100; // Obstacle spawn frequency

// Ground
const ground = canvas.height - 50;

// Initialization
highScoreElement.textContent = highScore;

// Check if player has a nickname
if (playerName) {
    playerNameElement.textContent = playerName;
    nicknameModal.classList.add('hidden');
} else {
    // Show nickname modal on first visit
    nicknameModal.classList.remove('hidden');
    nicknameInput.focus();
}

// Update sound button states
function updateSoundButtons() {
    if (soundSystem.isSoundEnabled()) {
        soundToggleBtn.textContent = '🔊';
        soundToggleBtn.classList.remove('muted');
    } else {
        soundToggleBtn.textContent = '🔇';
        soundToggleBtn.classList.add('muted');
    }
    
    if (soundSystem.isMusicEnabled()) {
        musicToggleBtn.textContent = '🎵';
        musicToggleBtn.classList.remove('muted');
    } else {
        musicToggleBtn.textContent = '🎶';
        musicToggleBtn.classList.add('muted');
    }
}

updateSoundButtons();

// Load image
let imageLoaded = false;
playerImg.onload = function() {
    imageLoaded = true;
    // Set player size based on image
    const scale = 80 / playerImg.height;
    player.width = playerImg.width * scale;
    player.height = 80;
    player.y = ground - player.height;
};

// Handle image loading error
playerImg.onerror = function() {
    console.log('Image not loaded, using rectangle');
    imageLoaded = false;
};

// Initialize player position
player.y = ground - player.height;

// Nickname modal controls
nicknameBtn.addEventListener('click', function() {
    setNickname();
});

nicknameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        setNickname();
    }
});

function setNickname() {
    const nickname = nicknameInput.value.trim();
    if (nickname) {
        playerName = nickname;
        localStorage.setItem('playerName', playerName);
        playerNameElement.textContent = playerName;
        nicknameModal.classList.add('hidden');
    } else {
        nicknameInput.placeholder = 'Please enter a nickname!';
        nicknameInput.classList.add('shake');
        setTimeout(() => nicknameInput.classList.remove('shake'), 500);
    }
}

// Keyboard controls
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!nicknameModal.classList.contains('hidden')) return; // Don't start if modal is open
        if (!gameRunning && !gameOver) {
            startGame();
        } else if (gameRunning && player.grounded) {
            jump();
        }
    }
});

// Touch controls for mobile
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!nicknameModal.classList.contains('hidden')) return;
    if (!gameRunning && !gameOver) {
        startGame();
    } else if (gameRunning && player.grounded) {
        jump();
    }
});

// Click controls
canvas.addEventListener('click', function(e) {
    if (!nicknameModal.classList.contains('hidden')) return;
    if (!gameRunning && !gameOver) {
        startGame();
    } else if (gameRunning && player.grounded) {
        jump();
    }
});

// Restart button
restartBtn.addEventListener('click', function() {
    restartGame();
});

// Sound toggle button
soundToggleBtn.addEventListener('click', function() {
    soundSystem.init();
    soundSystem.toggleSound();
    updateSoundButtons();
});

// Music toggle button
musicToggleBtn.addEventListener('click', function() {
    soundSystem.init();
    soundSystem.toggleMusic();
    updateSoundButtons();
});

// Jump function
function jump() {
    if (player.grounded) {
        player.velocityY = -11;
        player.jumping = true;
        player.grounded = false;
        soundSystem.playJump();
    }
}

// Create obstacle (tree stump)
function createObstacle() {
    const minHeight = 35;
    const maxHeight = 55;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    const width = 30 + Math.random() * 10;
    
    obstacles.push({
        x: canvas.width,
        y: ground - height,
        width: width,
        height: height
    });
}

// Update game state
function update() {
    if (!gameRunning || gameOver) return;

    // Update player
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Check landing
    if (player.y >= ground - player.height) {
        player.y = ground - player.height;
        player.velocityY = 0;
        player.jumping = false;
        player.grounded = true;
    } else {
        player.grounded = false;
    }

    // Update obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
        createObstacle();
        obstacleTimer = 0;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;

        // Check collision
        if (checkCollision(player, obstacles[i])) {
            endGame();
            return;
        }

        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;
            scoreElement.textContent = score;
            soundSystem.playScore();
        }
    }

    // Increase speed every 10 points (but only once per milestone)
    if (score > 0 && score % 10 === 0 && score !== lastSpeedIncrease) {
        gameSpeed += 0.5;
        lastSpeedIncrease = score;
    }
}

// Check collision with hitbox adjustment
function checkCollision(rect1, rect2) {
    // Add padding to make collision more forgiving
    const playerPadding = 10; // Player hitbox is smaller
    const obstaclePadding = 8; // Obstacle hitbox is smaller
    
    return rect1.x + playerPadding < rect2.x + rect2.width - obstaclePadding &&
           rect1.x + rect1.width - playerPadding > rect2.x + obstaclePadding &&
           rect1.y + playerPadding < rect2.y + rect2.height - obstaclePadding &&
           rect1.y + rect1.height - playerPadding > rect2.y + obstaclePadding;
}

// Draw function
function draw() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.7, '#B0E0E6');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun glow
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80, 60, 0, Math.PI * 2);
    ctx.fill();

    // Distant hills
    drawHills();

    // Ground gradient
    const groundGradient = ctx.createLinearGradient(0, ground, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B6914');
    groundGradient.addColorStop(1, '#654321');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, ground, canvas.width, canvas.height - ground);

    // Grass layer
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, ground - 8, canvas.width, 8);
    
    // Grass blades
    drawGrass();
    
    // Flowers (on background)
    drawFlowers();
    
    // Mushrooms (on background)
    drawMushrooms();

    // Obstacles (tree stumps) - in front
    for (let obstacle of obstacles) {
        drawStump(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    // Player (in front)
    if (imageLoaded) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        // Fallback - rectangle
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(player.x, player.y, player.width, player.height);
    }

    // Clouds (for movement effect)
    if (gameRunning) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const cloudSpeed = gameSpeed * 0.5;
        const cloudOffset1 = (Date.now() * cloudSpeed / 25) % (canvas.width + 200);
        const cloudOffset2 = (Date.now() * cloudSpeed / 30) % (canvas.width + 200);
        const cloudOffset3 = (Date.now() * cloudSpeed / 35) % (canvas.width + 200);
        const cloudOffset4 = (Date.now() * cloudSpeed / 28) % (canvas.width + 200);
        
        // Clouds move right to left (towards the player)
        drawCloud(canvas.width - cloudOffset1, 60, 1);
        drawCloud(canvas.width - cloudOffset2 + 300, 100, 0.8);
        drawCloud(canvas.width - cloudOffset3 + 600, 80, 1.2);
        drawCloud(canvas.width - cloudOffset4 + 900, 120, 0.9);
    }
    
    // Birds
    if (gameRunning) {
        drawBirds();
    }
    
    // "Created by Dastent" text at bottom right
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Created by Dastent', canvas.width - 10, canvas.height - 10);
}

// Draw hills
function drawHills() {
    ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, ground - 50);
    ctx.quadraticCurveTo(200, ground - 120, 400, ground - 50);
    ctx.quadraticCurveTo(600, ground - 20, 800, ground - 80);
    ctx.quadraticCurveTo(900, ground - 100, 1000, ground - 60);
    ctx.lineTo(canvas.width, ground);
    ctx.lineTo(0, ground);
    ctx.closePath();
    ctx.fill();
}

// Draw grass blades
function drawGrass() {
    ctx.strokeStyle = '#2F8B22';
    ctx.lineWidth = 2;
    
    const grassOffset = gameRunning ? (Date.now() * gameSpeed / 50) % 30 : 0;
    
    for (let x = -30; x < canvas.width + 30; x += 15) {
        const actualX = x - grassOffset;
        const grassHeight = 8 + Math.sin(x / 30) * 3;
        
        ctx.beginPath();
        ctx.moveTo(actualX, ground);
        ctx.quadraticCurveTo(
            actualX + 2, 
            ground - grassHeight / 2, 
            actualX + Math.sin(Date.now() / 200 + x) * 2, 
            ground - grassHeight
        );
        ctx.stroke();
    }
}

// Draw flowers
function drawFlowers() {
    const flowerPositions = [120, 280, 450, 620, 780, 920];
    const flowerOffset = gameRunning ? (Date.now() * gameSpeed / 50) % canvas.width : 0;
    
    flowerPositions.forEach((pos, index) => {
        const x = (pos - flowerOffset + canvas.width * 2) % (canvas.width + 200);
        if (x > -50 && x < canvas.width + 50) {
            const color = index % 3 === 0 ? '#FF69B4' : (index % 3 === 1 ? '#FFD700' : '#FF6347');
            drawFlower(x, ground - 5, color);
        }
    });
}

// Draw mushrooms
function drawMushrooms() {
    const mushroomPositions = [200, 380, 560, 720, 880];
    const mushroomOffset = gameRunning ? (Date.now() * gameSpeed / 50) % canvas.width : 0;
    
    mushroomPositions.forEach((pos, index) => {
        const x = (pos - mushroomOffset + canvas.width * 2) % (canvas.width + 200);
        if (x > -50 && x < canvas.width + 50) {
            const color = index % 2 === 0 ? '#FF4444' : '#8B4513';
            drawMushroom(x, ground - 5, color);
        }
    });
}

// Draw single flower
function drawFlower(x, y, color) {
    // Stem
    ctx.strokeStyle = '#2F8B22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 15);
    ctx.stroke();
    
    // Petals
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const petalX = x + Math.cos(angle) * 5;
        const petalY = y - 15 + Math.sin(angle) * 5;
        
        ctx.beginPath();
        ctx.arc(petalX, petalY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Center
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y - 15, 3, 0, Math.PI * 2);
    ctx.fill();
}

// Draw single mushroom
function drawMushroom(x, y, color) {
    // Stem
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.roundRect(x - 3, y - 12, 6, 12, 2);
    ctx.fill();
    
    // Stem outline
    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Cap
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y - 12, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Cap outline
    ctx.strokeStyle = color === '#FF4444' ? '#CC0000' : '#654321';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // White spots on red mushrooms
    if (color === '#FF4444') {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x - 3, y - 13, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 3, y - 12, 1.5, 0, Math.PI * 2);
        ctx.arc(x, y - 15, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw birds
function drawBirds() {
    const birdSpeed = gameSpeed * 0.4;
    const time = Date.now();
    
    const birdOffset1 = (time * birdSpeed / 40) % (canvas.width + 300);
    const birdOffset2 = (time * birdSpeed / 35) % (canvas.width + 300);
    const birdOffset3 = (time * birdSpeed / 45) % (canvas.width + 300);
    
    drawBird(canvas.width - birdOffset1, 100, time);
    drawBird(canvas.width - birdOffset2 + 200, 140, time + 1000);
    drawBird(canvas.width - birdOffset3 + 500, 120, time + 2000);
}

// Draw single bird
function drawBird(x, y, time) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    const wingFlap = Math.sin(time / 100) * 5;
    
    // Left wing
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 8, y - 8 + wingFlap, x - 15, y - 5 + wingFlap);
    ctx.stroke();
    
    // Right wing
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 8, y - 8 + wingFlap, x + 15, y - 5 + wingFlap);
    ctx.stroke();
}

// Draw cloud
function drawCloud(x, y, scale = 1) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, 15 * scale, 0, Math.PI * 2);
    ctx.arc(x + 20 * scale, y, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 40 * scale, y, 15 * scale, 0, Math.PI * 2);
    ctx.arc(x + 25 * scale, y - 10 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Draw tree stump
function drawStump(x, y, width, height) {
    // Main stump body
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, width, height);
    
    // Dark outline
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Stump top (tree cut surface)
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y, width / 2, width / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.stroke();
    
    // Rings on the cut (tree rings)
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y, width / 3, width / 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y, width / 5, width / 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Bark texture (vertical lines)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const lineX = x + (width / 4) * (i + 0.5);
        ctx.beginPath();
        ctx.moveTo(lineX, y + 5);
        ctx.lineTo(lineX, y + height);
        ctx.stroke();
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameRunning = true;
    gameOver = false;
    score = 0;
    gameSpeed = 3;
    lastSpeedIncrease = 0;
    obstacles = [];
    obstacleTimer = 0;
    scoreElement.textContent = score;
    gameOverDiv.classList.add('hidden');
    
    // Initialize and start music
    soundSystem.init();
    soundSystem.startMusic();
}

// End game
function endGame() {
    gameOver = true;
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    finalScoreElement.textContent = score;
    gameOverDiv.classList.remove('hidden');
    
    // Play game over sound and stop music
    soundSystem.playGameOver();
    soundSystem.stopMusic();
}

// Restart game
function restartGame() {
    startGame();
}

// Start game loop
gameLoop();

