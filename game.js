// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Multiplayer variables
let ws = null;
let playerId = null;
let allGameStates = [];
let connectionStatus = 'connecting';

// Game state
let gameRunning = true;
let score = 0;
let gameSpeed = 2;
let animationFrameId = null;

// T-Rex character
const dino = {
    x: 50,
    y: 150,
    width: 40,
    height: 40,
    dy: 0,
    dx: 0,
    jumpPower: -12,
    jumpForward: 1.5,
    gravity: 0.5,
    grounded: true,
    color: '#2E7D32'
};

// Obstacles array
let obstacles = [];
const obstacleWidth = 15;
const obstacleHeight = 20;
let nextObstacleDistance = 0;

// Ground level
const groundY = 190;

// Multiplayer WebSocket connection
function connectToServer() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    const wsUrl = `${protocol}//${host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to multiplayer server');
        connectionStatus = 'connected';
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
        } catch (error) {
            console.error('Error parsing server message:', error);
        }
    };
    
    ws.onclose = () => {
        console.log('Disconnected from server');
        connectionStatus = 'disconnected';
        // Try to reconnect after 3 seconds
        setTimeout(connectToServer, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        connectionStatus = 'error';
    };
}

function handleServerMessage(data) {
    switch (data.type) {
        case 'init':
            playerId = data.playerId;
            allGameStates = data.gameStates;
            break;
        case 'gameStateUpdate':
        case 'playerJoined':
        case 'playerLeft':
            allGameStates = data.gameStates;
            break;
    }
}

function sendGameState() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const gameState = {
            dino: { ...dino },
            obstacles: [...obstacles],
            score,
            gameRunning,
            gameSpeed
        };
        
        ws.send(JSON.stringify({
            type: 'gameState',
            gameState
        }));
    }
}

// Generate random obstacle distance
function getRandomObstacleDistance() {
    // Return random distance between 150 and 350 pixels
    return Math.random() * 200 + 150;
}

// Initialize game
function init() {
    // Cancel any existing game loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    gameRunning = true;
    score = 0;
    gameSpeed = 2;
    obstacles = [];
    nextObstacleDistance = getRandomObstacleDistance();
    dino.x = 50;
    dino.y = 150;
    dino.dy = 0;
    dino.dx = 0;
    dino.grounded = true;
    gameOverElement.classList.add('hidden');
    updateScore();
    gameLoop();
}

// Game loop
function gameLoop() {
    update();
    draw();
    
    // Send game state every few frames
    if (Date.now() % 100 < 16) { // Roughly every 6 frames at 60fps
        sendGameState();
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Only update if local game is running
    if (!gameRunning) return;
    
    // Update dino physics
    if (!dino.grounded) {
        dino.dy += dino.gravity;
        dino.y += dino.dy;
        dino.x += dino.dx;
        
        // Keep dino within canvas bounds
        if (dino.x < 0) dino.x = 0;
        if (dino.x > canvas.width - dino.width) dino.x = canvas.width - dino.width;
        
        // Check if dino landed
        if (dino.y >= 150) {
            dino.y = 150;
            dino.dy = 0;
            dino.dx = 0;
            dino.grounded = true;
        }
    }
    
    // Generate obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - nextObstacleDistance) {
        obstacles.push({
            x: canvas.width,
            y: groundY - obstacleHeight,
            width: obstacleWidth,
            height: obstacleHeight
        });
        // Set next random distance
        nextObstacleDistance = getRandomObstacleDistance();
    }
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // Remove obstacles that are off screen
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score += 10;
            updateScore();
            
            // Increase game speed gradually as score increases
            if (score % 50 === 0) {
                gameSpeed += 0.1;
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
    
    // Calculate game height for each player
    const totalPlayers = Math.max(1, allGameStates.length);
    const gameHeight = canvas.height / totalPlayers;
    
    // Draw each player's game
    allGameStates.forEach((gameState, index) => {
        const offsetY = index * gameHeight;
        const isOwnGame = gameState.playerId === playerId;
        
        drawSingleGame(gameState, offsetY, gameHeight, isOwnGame);
    });
    
    // If not connected, draw local game only
    if (allGameStates.length === 0) {
        const localGameState = {
            dino: { ...dino },
            obstacles: [...obstacles],
            score,
            gameRunning,
            gameSpeed
        };
        drawSingleGame(localGameState, 0, canvas.height, true);
    }
    
    // Draw connection status
    drawConnectionStatus();
}

function drawSingleGame(gameState, offsetY, gameHeight, isOwnGame) {
    const scaledGroundY = offsetY + gameHeight - 10;
    
    // Draw background for this game
    ctx.fillStyle = isOwnGame ? '#f0f8ff' : '#f5f5f5';
    ctx.fillRect(0, offsetY, canvas.width, gameHeight);
    
    // Draw ground
    ctx.fillStyle = '#8BC34A';
    ctx.fillRect(0, scaledGroundY, canvas.width, 10);
    
    // Draw ground line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, scaledGroundY);
    ctx.lineTo(canvas.width, scaledGroundY);
    ctx.stroke();
    
    // Scale positions to fit in the allocated space
    const gameScale = gameHeight / 200; // Original canvas height was 200
    const dinoY = offsetY + gameHeight - ((200 - gameState.dino.y) * gameScale) - 10;
    
    // Draw dino with different colors for different players
    const dinoColor = isOwnGame ? '#2E7D32' : getPlayerColor(gameState.playerId);
    ctx.fillStyle = dinoColor;
    ctx.fillRect(gameState.dino.x, dinoY, dino.width * gameScale, dino.height * gameScale);
    
    // Draw dino eye
    ctx.fillStyle = 'white';
    ctx.fillRect(gameState.dino.x + 25 * gameScale, dinoY + 8 * gameScale, 6 * gameScale, 6 * gameScale);
    ctx.fillStyle = 'black';
    ctx.fillRect(gameState.dino.x + 26 * gameScale, dinoY + 9 * gameScale, 4 * gameScale, 4 * gameScale);
    
    // Draw dino legs
    ctx.fillStyle = dinoColor;
    ctx.fillRect(gameState.dino.x + 5 * gameScale, dinoY + dino.height * gameScale, 6 * gameScale, 8 * gameScale);
    ctx.fillRect(gameState.dino.x + 25 * gameScale, dinoY + dino.height * gameScale, 6 * gameScale, 8 * gameScale);
    
    // Draw obstacles
    ctx.fillStyle = '#795548';
    gameState.obstacles.forEach(obstacle => {
        const scaledHeight = obstacleHeight * gameScale;
        const obstacleY = scaledGroundY - scaledHeight;
        ctx.fillRect(obstacle.x, obstacleY, obstacle.width, scaledHeight);
        
        // Add some rock texture if obstacle is large enough
        if (scaledHeight > 15) {
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(obstacle.x + 2, obstacleY + 2, obstacle.width - 4, Math.min(6, scaledHeight - 4));
            ctx.fillStyle = '#795548';
        }
    });
    
    // Draw score and player info
    ctx.fillStyle = isOwnGame ? '#2E7D32' : '#666';
    ctx.font = '12px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, offsetY + 15);
    if (!isOwnGame && gameState.playerId) {
        ctx.fillText(`Player: ${gameState.playerId.substr(0, 6)}`, 10, offsetY + 30);
    }
    
    // Draw game over indicator
    if (!gameState.gameRunning) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, offsetY, canvas.width, gameHeight);
        ctx.fillStyle = '#ff4444';
        ctx.font = '16px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2 - 40, offsetY + gameHeight / 2);
    }
}

function getPlayerColor(playerId) {
    const colors = ['#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#00BCD4', '#4CAF50', '#FF9800', '#FF5722'];
    const hash = playerId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
}

function drawConnectionStatus() {
    ctx.fillStyle = connectionStatus === 'connected' ? '#4CAF50' : '#ff4444';
    ctx.font = '10px Arial';
    ctx.fillText(connectionStatus === 'connected' ? '● Online' : '● Offline', canvas.width - 60, 15);
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

// Touch event listeners for mobile devices
canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    jump();
});

// Also add click event as fallback for non-touch devices that use mouse
canvas.addEventListener('click', (event) => {
    event.preventDefault();
    jump();
});

// Start the game
connectToServer();
init();
