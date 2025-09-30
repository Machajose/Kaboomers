class MessageHandler {
  constructor(playerManager, matchManager, broadcaster) {
    this.playerManager = playerManager;
    this.matchManager = matchManager;
    this.broadcaster = broadcaster;
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        case 'player_join':
          this.handlePlayerJoin(ws, payload);
          break;
          
        case 'player_move':
          this.handlePlayerMove(payload);
          break;
          
        case 'player_shoot':
          this.handlePlayerShoot(payload);
          break;
          
        case 'player_respawn':
          this.handlePlayerRespawn(payload);
          break;

        default:
          console.log('Unknown message type:', type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  }

  handlePlayerJoin(ws, payload) {
    const { walletAddress } = payload;
    
    // Check if player already exists
    let player = this.playerManager.getPlayerByWallet(walletAddress);
    
    if (!player) {
      player = this.playerManager.createPlayer(walletAddress, ws);
      console.log(`New player joined: ${player.id} (${walletAddress})`);
    } else {
      // Update WebSocket connection for returning player
      player.ws = ws;
      console.log(`Returning player: ${player.id} (${walletAddress})`);
    }

    // Add player to current match
    const match = this.matchManager.addPlayerToCurrentMatch(player);

    // Send confirmation to player
    ws.send(JSON.stringify({
      type: 'player_joined',
      data: {
        playerId: player.id,
        matchId: match.id,
        matchStatus: match.status
      }
    }));

    // Broadcast player list update
    this.broadcaster.broadcastToMatch(match, {
      type: 'players_update',
      data: {
        players: Array.from(match.players.values()).map(p => p.toJSON())
      }
    });
  }

  handlePlayerMove(payload) {
    const { playerId, position } = payload;
    
    if (this.playerManager.updatePlayerPosition(playerId, position)) {
      const player = this.playerManager.getPlayer(playerId);
      const match = this.matchManager.getCurrentMatch();
      
      if (match) {
        this.broadcaster.broadcastToMatch(match, {
          type: 'player_moved',
          data: {
            playerId,
            position
          }
        });
      }
    }
  }

  handlePlayerShoot(payload) {
    const { shooterId, targetId, position } = payload;
    
    const result = this.playerManager.handlePlayerShot(shooterId, targetId);
    const match = this.matchManager.getCurrentMatch();
    
    if (result && match) {
      this.broadcaster.broadcastToMatch(match, {
        type: 'shot_fired',
        data: {
          result,
          position,
          timestamp: Date.now()
        }
      });

      // Handle kill
      if (result.type === 'kill') {
        setTimeout(() => {
          const respawnedPlayer = this.playerManager.respawnPlayer(targetId);
          if (respawnedPlayer) {
            this.broadcaster.broadcastToMatch(match, {
              type: 'player_respawned',
              data: respawnedPlayer.toJSON()
            });
          }
        }, 3000); // 3 second respawn delay
      }
    }
  }

  handlePlayerRespawn(payload) {
    const { playerId } = payload;
    const player = this.playerManager.respawnPlayer(playerId);
    const match = this.matchManager.getCurrentMatch();
    
    if (player && match) {
      this.broadcaster.broadcastToMatch(match, {
        type: 'player_respawned',
        data: player.toJSON()
      });
    }
  }
}

module.exports = MessageHandler;
