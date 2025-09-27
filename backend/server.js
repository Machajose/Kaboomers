require('dotenv').config();
const WebSocket = require('ws');
const PlayerManager = require('./src/managers/PlayerManager');
const MatchManager = require('./src/managers/MatchManager');
const MessageBroadcaster = require('./src/services/MessageBroadcaster');
const SuiIntegration = require('./src/services/SuiIntegration');
const MessageHandler = require('./src/handlers/MessageHandler');

class GameServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    
    // Initialize services
    this.suiIntegration = new SuiIntegration();
    this.broadcaster = new MessageBroadcaster();
    this.playerManager = new PlayerManager();
    this.matchManager = new MatchManager(this.suiIntegration, this.broadcaster);
    this.messageHandler = new MessageHandler(
      this.playerManager, 
      this.matchManager, 
      this.broadcaster
    );
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    console.log(`🎮 Game WebSocket server started on port ${this.port}`);
    console.log(`🌐 WebSocket endpoint: ws://localhost:${this.port}`);

    this.wss.on('connection', (ws, request) => {
      console.log('New WebSocket connection established');
      
      ws.on('message', (message) => {
        this.messageHandler.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        data: {
          message: 'Connected to Sui Arena server',
          timestamp: Date.now()
        }
      }));
    });

    // Health check endpoint (if needed)
    this.startHealthCheck();
  }

  handleDisconnection(ws) {
    // Find and remove disconnected player
    let disconnectedPlayer = null;
    
    for (const player of this.playerManager.players.values()) {
      if (player.ws === ws) {
        disconnectedPlayer = player;
        break;
      }
    }

    if (disconnectedPlayer) {
      console.log(`Player disconnected: ${disconnectedPlayer.id}`);
      this.matchManager.removePlayerFromMatch(disconnectedPlayer.id);
      this.playerManager.removePlayer(disconnectedPlayer.id);
    }
  }

  startHealthCheck() {
    setInterval(() => {
      const stats = {
        connectedPlayers: this.playerManager.players.size,
        activeMatches: this.matchManager.matches.size,
        currentMatch: this.matchManager.currentMatch ? {
          id: this.matchManager.currentMatch.id,
          status: this.matchManager.currentMatch.status,
          players: this.matchManager.currentMatch.getPlayerCount()
        } : null
      };
      
      console.log('📊 Server Stats:', stats);
    }, 30000); // Every 30 seconds
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('Game server stopped');
    }
  }
}

// Start the server
if (require.main === module) {
  const server = new GameServer(process.env.PORT || 8080);
  server.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    server.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    server.stop();
    process.exit(0);
  });
}

module.exports = GameServer;
