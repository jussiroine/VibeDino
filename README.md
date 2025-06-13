# VibeDino - Multiplayer T-Rex Game

A multiplayer version of the classic T-Rex dino game, just like in Google Chrome offline mode. Players control a T-rex that can jump over rocks, and they can see all other players' games in real-time.

## Features

- **Instant Multiplayer**: No rooms, no waiting times - just open the game and start playing
- **Real-time Synchronization**: See all other players' games stacked vertically
- **Individual Game States**: Each player has their own independent game with their own obstacles and score
- **Visual Differentiation**: Each player's dino has a different color
- **Persistent View**: When your game ends, you can still see others playing
- **Simple Reset**: Refresh the page to start a new game

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open multiple browser windows/tabs to `http://localhost:3000`

4. Each window will show:
   - Your own game at the top (with blue background)
   - Other players' games stacked below (with gray backgrounds)
   - Different colored dinos for each player
   - Real-time updates of all game states

## How to Play

- Press **SPACEBAR** to jump over rocks
- Avoid obstacles to increase your score
- Your game runs independently - other players' games don't affect yours
- When you crash, your game stops but others continue
- Refresh the page to start a new game

## Technical Details

- **Frontend**: HTML5 Canvas with JavaScript
- **Backend**: Node.js with WebSocket (ws library)
- **Real-time Communication**: WebSocket for game state synchronization
- **Port**: Default port 3000 (configurable via PORT environment variable)

## Multiplayer Architecture

Each player maintains their own game state (dino position, obstacles, score) which is synchronized in real-time with other players. The server coordinates all game states and broadcasts updates to all connected clients. Games are rendered stacked vertically with each player's view scaled to fit. 
