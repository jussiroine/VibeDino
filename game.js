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

// T-Rex character - Heineken themed!
const dino = {
    x: 50,
    y: 150,
    width: 40,
    height: 40,
    dy: 0,
    dx: 0,
    jumpPower: -11,
    jumpForward: 4.0,
    gravity: 0.38,
    grounded: true,
    color: '#008200', // Heineken green!
    speechBubble: {
        message: '',
        visible: false,
        timer: 0,
        duration: 2000 // 2 seconds
    }
};

// Obstacles array
let obstacles = [];
const obstacleWidth = 15;
const obstacleHeight = 12;
let nextObstacleDistance = 0;

// Speech bubble messages - Dutch/Heineken themed!
const encouragingMessages = [
    'lekker!', 'gezellig!', 'proost!', 'schitterend!', 'geweldig!', 
    'fantastisch!', 'prachtig!', 'heel goed!', 'ja hoor!', 'schreineningen!',
    'Heineken!', 'oranje!', 'goed bezig!', 'top!', 'mooi zo!'
];
let lastSpeechBubbleTime = 0;

// Environmental effects
let environmentState = {
    mode: 'normal', // 'normal', 'night', 'rain', 'sandstorm'
    timer: 0,
    nightModeTimer: 0,
    weatherTimer: 0,
    particles: []
};

// Environmental timing constants
const NIGHT_MODE_INTERVAL = 30000; // 30 seconds
const NIGHT_MODE_DURATION = 10000; // 10 seconds
const WEATHER_EFFECT_DURATION = 10000; // 10 seconds
const WEATHER_EFFECT_CHANCE = 0.001; // 0.1% chance per frame check for occasional effects

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
    // Return random distance between 200 and 400 pixels
    return Math.random() * 200 + 200;
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
    dino.speechBubble.visible = false;
    dino.speechBubble.message = '';
    dino.speechBubble.timer = 0;
    lastSpeechBubbleTime = 0;
    
    // Reset environmental state
    environmentState = {
        mode: 'normal',
        timer: 0,
        nightModeTimer: 0,
        weatherTimer: 0,
        particles: []
    };
    
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
    
    // Update speech bubble timer
    if (dino.speechBubble.visible) {
        dino.speechBubble.timer -= 16; // Approximate frame time
        if (dino.speechBubble.timer <= 0) {
            dino.speechBubble.visible = false;
            dino.speechBubble.message = '';
        }
    }
    
    // Generate random speech bubbles
    const currentTime = Date.now();
    if (!dino.speechBubble.visible && currentTime - lastSpeechBubbleTime > 3000) { // At least 3 seconds between bubbles
        // Random chance for speech bubble (about 2% chance per frame at 60fps for better visibility)
        if (Math.random() < 0.02) {
            const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
            dino.speechBubble.message = randomMessage;
            dino.speechBubble.visible = true;
            dino.speechBubble.timer = dino.speechBubble.duration;
            lastSpeechBubbleTime = currentTime;
        }
    }
    
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
            if (score % 100 === 0) {
                gameSpeed += 0.1;
            }
        }
    }
    
    // Check collisions
    checkCollisions();
    
    // Update environmental effects
    updateEnvironmentalEffects();
}

// Update environmental effects (night mode, weather)
function updateEnvironmentalEffects() {
    const currentTime = Date.now();
    
    // Update night mode timer (independent of weather)
    environmentState.nightModeTimer += 16; // Approximate frame time
    
    // Check if we should start night mode (every 30 seconds)
    if (environmentState.nightModeTimer >= NIGHT_MODE_INTERVAL) {
        // Toggle night mode
        if (environmentState.mode === 'normal') {
            environmentState.mode = 'night';
            environmentState.timer = NIGHT_MODE_DURATION;
        } else if (environmentState.mode === 'night') {
            environmentState.mode = 'normal';
        } else if (environmentState.mode === 'rain') {
            environmentState.mode = 'night-rain';
            environmentState.timer = Math.max(environmentState.timer, NIGHT_MODE_DURATION);
        } else if (environmentState.mode === 'sandstorm') {
            environmentState.mode = 'night-sandstorm';
            environmentState.timer = Math.max(environmentState.timer, NIGHT_MODE_DURATION);
        }
        environmentState.nightModeTimer = 0;
    }
    
    // Handle night mode timer
    if (environmentState.mode === 'night' || environmentState.mode === 'night-rain' || environmentState.mode === 'night-sandstorm') {
        environmentState.timer -= 16;
        if (environmentState.timer <= 0) {
            if (environmentState.mode === 'night') {
                environmentState.mode = 'normal';
            } else if (environmentState.mode === 'night-rain') {
                environmentState.mode = 'rain';
                environmentState.timer = WEATHER_EFFECT_DURATION / 2; // Continue rain for a bit
            } else if (environmentState.mode === 'night-sandstorm') {
                environmentState.mode = 'sandstorm';
                environmentState.timer = WEATHER_EFFECT_DURATION / 2; // Continue sandstorm for a bit
            }
        }
    }
    
    // Update weather effects
    if (environmentState.mode === 'normal' || environmentState.mode === 'night') {
        // Random chance to start weather effect
        if (Math.random() < WEATHER_EFFECT_CHANCE) {
            const weatherTypes = ['rain', 'sandstorm'];
            const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
            environmentState.mode = environmentState.mode === 'night' ? `night-${weather}` : weather;
            environmentState.timer = Math.max(environmentState.timer, WEATHER_EFFECT_DURATION);
            environmentState.particles = [];
            initializeWeatherParticles();
        }
    } else if (environmentState.mode === 'rain' || environmentState.mode === 'sandstorm' || 
               environmentState.mode === 'night-rain' || environmentState.mode === 'night-sandstorm') {
        // Update weather timer
        environmentState.timer -= 16;
        if (environmentState.timer <= 0) {
            if (environmentState.mode === 'rain' || environmentState.mode === 'sandstorm') {
                environmentState.mode = 'normal';
            } else {
                environmentState.mode = 'night';
                environmentState.timer = NIGHT_MODE_DURATION / 2; // Continue night mode for a bit
            }
            environmentState.particles = [];
        } else {
            updateWeatherParticles();
        }
    }
}

// Initialize weather particles
function initializeWeatherParticles() {
    environmentState.particles = [];
    const hasRain = environmentState.mode.includes('rain');
    const hasSandstorm = environmentState.mode.includes('sandstorm');
    const particleCount = hasRain ? 100 : hasSandstorm ? 50 : 0;
    
    for (let i = 0; i < particleCount; i++) {
        environmentState.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: hasRain ? 3 + Math.random() * 2 : 1 + Math.random(),
            opacity: Math.random() * 0.7 + 0.3,
            size: hasRain ? 1 : 2 + Math.random() * 2
        });
    }
}

// Update weather particles
function updateWeatherParticles() {
    const hasRain = environmentState.mode.includes('rain');
    const hasSandstorm = environmentState.mode.includes('sandstorm');
    
    environmentState.particles.forEach(particle => {
        if (hasRain) {
            particle.y += particle.speed;
            particle.x += particle.speed * 0.1; // Slight diagonal movement
            
            // Reset particle when it goes off screen
            if (particle.y > canvas.height) {
                particle.y = -10;
                particle.x = Math.random() * canvas.width;
            }
        } else if (hasSandstorm) {
            particle.x += particle.speed;
            particle.y += Math.sin(Date.now() * 0.01 + particle.x * 0.01) * 0.5; // Wavy movement
            
            // Reset particle when it goes off screen
            if (particle.x > canvas.width) {
                particle.x = -10;
                particle.y = Math.random() * canvas.height;
            }
        }
    });
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
    
    // Draw background for this game (with environmental effects)
    let backgroundColor = isOwnGame ? '#f0f8ff' : '#f5f5f5';
    const isNightMode = environmentState.mode.includes('night');
    const isSandstorm = environmentState.mode.includes('sandstorm');
    
    if (isNightMode) {
        backgroundColor = isOwnGame ? '#1a1a2e' : '#16213e';
    } else if (isSandstorm) {
        backgroundColor = isOwnGame ? '#d4a574' : '#c49660';
    }
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, offsetY, canvas.width, gameHeight);
    
    // Draw ground - Heineken green!
    ctx.fillStyle = '#00A86B';
    ctx.fillRect(0, scaledGroundY, canvas.width, 10);
    
    // Draw ground line
    ctx.strokeStyle = '#008200';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, scaledGroundY);
    ctx.lineTo(canvas.width, scaledGroundY);
    ctx.stroke();
    
    // Scale positions to fit in the allocated space
    const gameScale = gameHeight / 200; // Original canvas height was 200
    const dinoY = offsetY + gameHeight - ((200 - gameState.dino.y) * gameScale) - 10;
    
    // Draw dino with different colors for different players - Heineken green for own game!
    const dinoColor = isOwnGame ? '#008200' : getPlayerColor(gameState.playerId);
    
    // Add glow effect during night mode to make dino more visible
    if (isNightMode) {
        ctx.shadowColor = dinoColor;
        ctx.shadowBlur = 8;
    }
    
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
    
    // Draw Heineken star next to dino if it's our game!
    if (isOwnGame && gameState.gameRunning) {
        drawHeinekenStar(gameState.dino.x - 15 * gameScale, dinoY + 10 * gameScale, 8 * gameScale);
    }
    
    // Reset shadow
    if (isNightMode) {
        ctx.shadowBlur = 0;
    }
    
    // Draw speech bubble if visible
    if (gameState.dino.speechBubble && gameState.dino.speechBubble.visible && gameState.dino.speechBubble.message) {
        drawSpeechBubble(gameState.dino.x, dinoY, gameState.dino.speechBubble.message, gameScale);
    }
    
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
    
    // Draw score and player info - Dutch style!
    ctx.fillStyle = isOwnGame ? '#008200' : '#666';
    ctx.font = '12px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, offsetY + 15);
    if (!isOwnGame && gameState.playerId) {
        ctx.fillText(`Speler: ${gameState.playerId.substr(0, 6)}`, 10, offsetY + 30);
    }
    
    // Draw weather effects
    drawWeatherEffects(offsetY, gameHeight);
    
    // Draw game over indicator - Dutch style!
    if (!gameState.gameRunning) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, offsetY, canvas.width, gameHeight);
        ctx.fillStyle = '#ff4444';
        ctx.font = '16px Arial';
        const gameOverText = 'SPEL AFGELOPEN 🍺';
        const textWidth = ctx.measureText(gameOverText).width;
        ctx.fillText(gameOverText, canvas.width / 2 - textWidth / 2, offsetY + gameHeight / 2);
    }
}

// Draw weather effects
function drawWeatherEffects(offsetY, gameHeight) {
    const hasRain = environmentState.mode.includes('rain');
    const hasSandstorm = environmentState.mode.includes('sandstorm');
    
    if (hasRain) {
        ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)';
        ctx.lineWidth = 2;
        environmentState.particles.forEach(particle => {
            if (particle.y >= offsetY && particle.y <= offsetY + gameHeight) {
                ctx.globalAlpha = particle.opacity;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particle.x + 3, particle.y + 10);
                ctx.stroke();
            }
        });
        ctx.globalAlpha = 1;
    } else if (hasSandstorm) {
        ctx.fillStyle = 'rgba(212, 165, 116, 0.6)';
        environmentState.particles.forEach(particle => {
            if (particle.y >= offsetY && particle.y <= offsetY + gameHeight) {
                ctx.globalAlpha = particle.opacity;
                ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            }
        });
        ctx.globalAlpha = 1;
    }
}

function drawHeinekenStar(x, y, size) {
    // Draw a simple 5-point star in Heineken colors
    ctx.fillStyle = '#ff0000'; // Red Heineken star
    ctx.strokeStyle = '#008200'; // Green border
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? size : size / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawSpeechBubble(dinoX, dinoY, message, gameScale) {
    const bubbleWidth = Math.max(60, message.length * 8) * gameScale;
    const bubbleHeight = 20 * gameScale;
    const bubbleX = dinoX + (dino.width * gameScale / 2) - (bubbleWidth / 2);
    const bubbleY = dinoY - bubbleHeight - 10 * gameScale;
    
    // Draw speech bubble background
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Draw rounded rectangle for bubble (with fallback for older browsers)
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 5 * gameScale);
    } else {
        // Fallback to regular rectangle
        ctx.rect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
    }
    ctx.fill();
    ctx.stroke();
    
    // Draw speech bubble tail
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    const tailX = dinoX + (dino.width * gameScale / 2);
    const tailY = bubbleY + bubbleHeight;
    ctx.moveTo(tailX - 5 * gameScale, tailY);
    ctx.lineTo(tailX + 5 * gameScale, tailY);
    ctx.lineTo(tailX, tailY + 8 * gameScale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = '#333';
    ctx.font = `${Math.max(10, 12 * gameScale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2);
    
    // Reset text alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
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
    ctx.fillStyle = connectionStatus === 'connected' ? '#008200' : '#ff4444';
    ctx.font = '10px Arial';
    const statusText = connectionStatus === 'connected' ? '🍺 Online - Proost!' : '● Offline';
    const statusWidth = ctx.measureText(statusText).width;
    ctx.fillText(statusText, canvas.width - statusWidth - 10, 15);
    
    // Show current environmental mode for testing - in Dutch!
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.fillText(`Modus: ${environmentState.mode}`, 10, canvas.height - 10);
}

// Check collisions between dino and obstacles
function checkCollisions() {
    const collisionBuffer = 2; // Make collision slightly more forgiving
    obstacles.forEach(obstacle => {
        if (dino.x + collisionBuffer < obstacle.x + obstacle.width &&
            dino.x + dino.width - collisionBuffer > obstacle.x &&
            dino.y + collisionBuffer < obstacle.y + obstacle.height &&
            dino.y + dino.height - collisionBuffer > obstacle.y) {
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

// Donald's secret bonus function
function addBonusPoints() {
    if (gameRunning) {
        score += 100;
        updateScore();
    }
}

// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        jump();
    } else if (event.code === 'KeyD') {
        event.preventDefault();
        addBonusPoints();
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
