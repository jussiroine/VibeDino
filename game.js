// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Game state
let gameRunning = true;
let score = 0;
let gameSpeed = 2;

// T-Rex character
const dino = {
    x: 50,
    y: 150,
    width: 40,
    height: 40,
    dy: 0,
    jumpPower: -12,
    gravity: 0.6,
    grounded: true,
    color: '#2E7D32'
};

// Obstacles array
let obstacles = [];
const obstacleWidth = 20;
const obstacleHeight = 40;

// Ground level
const groundY = 190;

// Initialize game
function init() {
    gameRunning = true;
    score = 0;
    gameSpeed = 2;
    obstacles = [];
    dino.y = 150;
    dino.dy = 0;
    dino.grounded = true;
    gameOverElement.classList.add('hidden');
    updateScore();
    gameLoop();
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Update dino physics
    if (!dino.grounded) {
        dino.dy += dino.gravity;
        dino.y += dino.dy;
        
        // Check if dino landed
        if (dino.y >= 150) {
            dino.y = 150;
            dino.dy = 0;
            dino.grounded = true;
        }
    }
    
    // Generate obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 200) {
        obstacles.push({
            x: canvas.width,
            y: groundY - obstacleHeight,
            width: obstacleWidth,
            height: obstacleHeight
        });
    }
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // Remove obstacles that are off screen
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score += 10;
            updateScore();
            
            // Increase game speed slightly as score increases
            if (score % 100 === 0) {
                gameSpeed += 0.2;
            }
        }
    }
    
    // Check collisions
    checkCollisions();
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#8BC34A';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    // Draw ground line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    
    // Draw dino
    ctx.fillStyle = dino.color;
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    
    // Draw dino eye
    ctx.fillStyle = 'white';
    ctx.fillRect(dino.x + 25, dino.y + 8, 8, 8);
    ctx.fillStyle = 'black';
    ctx.fillRect(dino.x + 27, dino.y + 10, 4, 4);
    
    // Draw dino legs
    ctx.fillStyle = dino.color;
    ctx.fillRect(dino.x + 5, dino.y + dino.height, 8, 10);
    ctx.fillRect(dino.x + 25, dino.y + dino.height, 8, 10);
    
    // Draw obstacles (rocks)
    ctx.fillStyle = '#795548';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add some rock texture
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width - 4, 8);
        ctx.fillRect(obstacle.x + 4, obstacle.y + 15, obstacle.width - 8, 6);
        ctx.fillStyle = '#795548';
    });
}

// Check collisions between dino and obstacles
function checkCollisions() {
    obstacles.forEach(obstacle => {
        if (dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y) {
            gameOver();
        }
    });
}

// Game over
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
}

// Restart game
function restartGame() {
    init();
}

// Update score display
function updateScore() {
    scoreElement.textContent = score;
}

// Jump function
function jump() {
    if (dino.grounded && gameRunning) {
        dino.dy = dino.jumpPower;
        dino.grounded = false;
    }
}

// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        jump();
    }
});

// Start the game
init();