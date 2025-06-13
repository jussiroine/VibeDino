const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server to serve static files
const server = http.createServer((req, res) => {
    // Handle API endpoint for stats
    if (req.url === '/api/stats') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(getStats()));
        return;
    }
    
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active game states
const gameStates = new Map();

// Statistics tracking
const stats = {
    totalSessions: 0,
    peakConcurrentUsers: 0,
    topScores: [], // Array of {playerId, score, timestamp}
    startTime: Date.now()
};

wss.on('connection', (ws) => {
    const playerId = generatePlayerId();
    console.log(`Player ${playerId} connected`);
    
    // Update statistics
    stats.totalSessions++;
    const currentUsers = gameStates.size + 1; // +1 for the new user
    if (currentUsers > stats.peakConcurrentUsers) {
        stats.peakConcurrentUsers = currentUsers;
    }
    
    // Initialize player's game state
    gameStates.set(playerId, {
        playerId,
        dino: { x: 50, y: 150, grounded: true },
        obstacles: [],
        score: 0,
        gameRunning: true,
        gameSpeed: 2,
        joinTime: Date.now()
    });
    
    // Send initial state to new player
    ws.send(JSON.stringify({
        type: 'init',
        playerId,
        gameStates: Array.from(gameStates.values())
    }));
    
    // Broadcast new player to all other players
    broadcast({
        type: 'playerJoined',
        gameStates: Array.from(gameStates.values())
    }, ws);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'gameState') {
                // Update player's game state
                const updatedState = { ...data.gameState, playerId };
                gameStates.set(playerId, updatedState);
                
                // Track high scores
                const currentScore = updatedState.score;
                if (currentScore > 0) {
                    updateTopScores(playerId, currentScore);
                }
                
                // Broadcast updated state to all players
                broadcast({
                    type: 'gameStateUpdate',
                    gameStates: Array.from(gameStates.values())
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        gameStates.delete(playerId);
        
        // Broadcast player left to remaining players
        broadcast({
            type: 'playerLeft',
            gameStates: Array.from(gameStates.values())
        });
    });
});

function updateTopScores(playerId, score) {
    // Check if this player already has a score recorded
    const existingIndex = stats.topScores.findIndex(entry => entry.playerId === playerId);
    
    if (existingIndex !== -1) {
        // Update existing score if it's higher
        if (score > stats.topScores[existingIndex].score) {
            stats.topScores[existingIndex] = { playerId, score, timestamp: Date.now() };
        }
    } else {
        // Add new score entry
        stats.topScores.push({ playerId, score, timestamp: Date.now() });
    }
    
    // Keep only top 10 scores
    stats.topScores.sort((a, b) => b.score - a.score);
    stats.topScores = stats.topScores.slice(0, 10);
}

function getStats() {
    return {
        currentConcurrentUsers: gameStates.size,
        totalSessions: stats.totalSessions,
        peakConcurrentUsers: stats.peakConcurrentUsers,
        topScores: stats.topScores,
        topScore: stats.topScores.length > 0 ? stats.topScores[0].score : 0,
        serverUptime: Date.now() - stats.startTime,
        timestamp: Date.now()
    };
}

function broadcast(message, exclude = null) {
    wss.clients.forEach((client) => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

function generatePlayerId() {
    return Math.random().toString(36).substr(2, 9);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});