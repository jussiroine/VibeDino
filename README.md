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

## Deploy to Azure Web App

VibeDino can be easily deployed to Azure Web App with WebSocket support. Follow these steps:

### Prerequisites
- Azure subscription
- Azure CLI installed (optional, for command-line deployment)

### Method 1: Deploy via Azure Portal

1. **Create an Azure Web App:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create a new Web App resource
   - Choose **Node.js** as the runtime stack
   - Select **Node.js LTS** version
   - Enable **WebSocket** support in Configuration → General settings

2. **Deploy the code:**
   - Use Git deployment, GitHub Actions, or ZIP deployment
   - Ensure all files including `web.config` are deployed
   - The app will automatically use the assigned port via `process.env.PORT`

3. **Configure WebSocket support:**
   - In Azure Portal, go to your Web App
   - Navigate to **Configuration** → **General settings**
   - Set **Web sockets** to **On**
   - Click **Save**

### Method 2: Deploy via Azure CLI

```bash
# Login to Azure
az login

# Create a resource group (if you don't have one)
az group create --name myResourceGroup --location "East US"

# Create an App Service plan
az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --sku B1 --is-linux

# Create the web app
az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name your-vibedino-app --runtime "NODE|18-lts"

# Enable WebSocket support
az webapp config set --resource-group myResourceGroup --name your-vibedino-app --web-sockets-enabled true

# Deploy from local Git repository
az webapp deployment source config-local-git --name your-vibedino-app --resource-group myResourceGroup

# Add Azure as a Git remote and push
git remote add azure <deployment-url-from-previous-command>
git push azure main
```

### Method 3: Deploy via GitHub Actions

Create `.github/workflows/azure-webapps-node.yml`:

```yaml
name: Deploy to Azure Web App

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'your-vibedino-app'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
```

### Important Notes for Azure Deployment

- **WebSocket Support**: Ensure WebSocket is enabled in Azure Web App configuration
- **Port Configuration**: The app automatically uses `process.env.PORT` provided by Azure
- **HTTPS/WSS**: Azure Web Apps provide HTTPS by default; the game automatically switches to WSS protocol
- **File Serving**: The included `web.config` ensures proper static file serving and Node.js routing
- **Scaling**: For production use, consider enabling Application Insights and auto-scaling

### Troubleshooting

- **WebSocket Connection Issues**: Verify WebSocket is enabled in Azure Portal
- **Static Files Not Loading**: Ensure `web.config` is deployed and properly configured
- **Connection Timeouts**: Azure Web Apps have connection timeouts; consider implementing heartbeat for long-lived connections 
