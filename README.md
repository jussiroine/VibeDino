# 🦖 VibeDino - Multiplayer T-Rex Game

A feature-rich multiplayer version of the classic T-Rex dino game with **dynamic weather effects**, **night mode**, and **real-time statistics**! Players control a T-rex that jumps over obstacles while experiencing immersive environmental changes, all synchronized across multiple players in real-time.

## ✨ Features

### 🎮 Core Multiplayer
- **🚀 Instant Multiplayer**: No rooms, no waiting times - just open the game and start playing
- **⚡ Real-time Synchronization**: See all other players' games stacked vertically
- **🎯 Individual Game States**: Each player has their own independent game with unique obstacles and score
- **🌈 Visual Differentiation**: Each player's dino has a different color
- **👀 Persistent View**: When your game ends, you can still watch others playing
- **🔄 Simple Reset**: Refresh the page to start a new game

### 🌦️ Environmental Effects
- **🌙 Night Mode**: Automatic night mode that cycles every 30 seconds for atmospheric gameplay
- **🌧️ Dynamic Weather System**: 
  - **Rain Effects**: Beautiful animated raindrops with realistic physics
  - **🌪️ Sandstorm Effects**: Swirling sand particles that create challenging visibility
  - **🌙+🌦️ Combined Modes**: Night-rain and night-sandstorm for ultimate challenge
- **🎨 Visual Particle System**: Smooth animated particles for all weather effects

### 📊 Statistics & Leaderboard
- **🏆 Global Leaderboard**: Top 10 high scores with player tracking
- **📈 Real-time Stats**: Live player count and session statistics
- **💾 Persistent Scores**: High scores are saved and tracked across sessions
- **📱 Admin Dashboard**: Dedicated stats page at `/stats.html`

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Play the game:**
   - Open `http://localhost:3000` in your browser
   - Open multiple browser windows/tabs to test multiplayer
   - Visit `http://localhost:3000/stats.html` for live statistics

4. **What you'll see:**
   - 🎮 Your own game at the top (with blue background)
   - 👥 Other players' games stacked below (with gray backgrounds)  
   - 🦖 Different colored dinos for each player
   - ⚡ Real-time updates of all game states
   - 🌦️ Dynamic weather and night mode effects

## 🎯 How to Play

- **🦘 Jump**: Press **SPACEBAR** to make your dino jump over obstacles
- **🎯 Survive**: Avoid rocks and other obstacles to increase your score
- **🌦️ Adapt**: Weather effects and night mode will test your skills
- **🏆 Compete**: Try to get on the global leaderboard
- **👥 Independent**: Your game runs separately - other players don't affect yours
- **⚰️ Game Over**: When you crash, your game stops but others continue
- **🔄 Restart**: Refresh the page to start a new game

## 🛠️ Technical Details

### Backend Architecture
- **🚀 Runtime**: Node.js (v14.0.0+)
- **🔌 WebSocket**: Real-time communication using `ws` library
- **📊 Data Storage**: In-memory game state and statistics
- **🌐 Port**: Default port 3000 (configurable via `PORT` environment variable)

### Frontend Technology
- **🎨 Graphics**: HTML5 Canvas with JavaScript
- **⚡ Animation**: 60fps game loop with `requestAnimationFrame`
- **🌦️ Effects**: Advanced particle system for weather effects
- **📱 Responsive**: Adaptive canvas sizing for different screen sizes

### Environmental System
- **🌙 Night Mode**: Automatic cycling every 30 seconds (10-second duration)
- **🌧️ Rain System**: 100 animated particles with realistic physics
- **🌪️ Sandstorm**: 50 particles with wave-based movement patterns
- **🔄 Dynamic Transitions**: Seamless switching between environmental states

### Multiplayer Architecture
- **🌐 Real-time Sync**: WebSocket-based state synchronization
- **👥 Scalable Rendering**: Vertical stacking with automatic scaling
- **🎯 Independent Logic**: Each player maintains separate game physics
- **📊 Statistics Tracking**: Live player count and score management

## 🏗️ Multiplayer Architecture

Each player maintains their own independent game state including:
- **🦖 Dino Physics**: Position, velocity, jumping mechanics, and collision detection
- **🚧 Obstacle Generation**: Randomized obstacle placement and timing
- **📊 Score Tracking**: Individual scoring with global leaderboard integration
- **🌦️ Environmental State**: Synchronized weather and night mode effects

The server coordinates all game states and broadcasts updates to connected clients. Games are rendered in a vertically stacked layout with automatic scaling to accommodate multiple players simultaneously.

## 📈 Statistics Dashboard

Access the admin statistics dashboard at `/stats.html` to view:
- **👥 Current Players**: Live count of active players
- **🏆 Leaderboard**: Top 10 high scores with timestamps
- **📊 Session Stats**: Total sessions and peak concurrent users
- **⏱️ Server Uptime**: Real-time server statistics

## 🎮 Game Features Deep Dive

### Weather Effects
- **🌧️ Rain Mode**: Creates atmospheric rainfall with realistic droplet animation
- **🌪️ Sandstorm Mode**: Challenging visibility with swirling sand particles
- **🌙 Night Mode**: Darker theme that cycles automatically for variety
- **🌀 Combined Effects**: Night-rain and night-sandstorm for ultimate challenge

### Interactive Elements  
- **💬 Speech Bubbles**: Dinos display encouraging messages during gameplay
- **🎨 Color Coding**: Each player gets a unique dino color for easy identification
- **📱 Responsive Design**: Optimized for desktop and mobile devices 
