const { v4: uuidv4 } = require('uuid');
const { Player } = require('../types/GameTypes');

class PlayerManager {
  constructor() {
    this.players = new Map();
    this.walletToPlayer = new Map();
  }

  createPlayer(walletAddress, ws) {
    const playerId = uuidv4();
    const player = new Player(playerId, walletAddress, ws);
    
    this.players.set(playerId, player);
    this.walletToPlayer.set(walletAddress, player);
    
    return player;
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getPlayerByWallet(walletAddress) {
    return this.walletToPlayer.get(walletAddress);
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.walletToPlayer.delete(player.walletAddress);
      this.players.delete(playerId);
    }
    return player;
  }

  updatePlayerPosition(playerId, position) {
    const player = this.players.get(playerId);
    if (player) {
      player.position = position;
      return true;
    }
    return false;
  }

  handlePlayerShot(shooterId, targetId) {
    const shooter = this.players.get(shooterId);
    const target = this.players.get(targetId);

    if (!shooter || !target || !target.isAlive) {
      return null;
    }

    // Simple hit logic - in real game, you'd check distance, accuracy, etc.
    target.health -= 25;
    
    if (target.health <= 0) {
      target.isAlive = false;
      target.deaths += 1;
      shooter.kills += 1;
      
      return {
        type: 'kill',
        shooter: shooter.toJSON(),
        target: target.toJSON()
      };
    }

    return {
      type: 'hit',
      shooter: shooter.toJSON(),
      target: target.toJSON()
    };
  }

  respawnPlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.health = 100;
      player.isAlive = true;
      player.position = { x: Math.random() * 800, y: Math.random() * 600 };
      return player;
    }
    return null;
  }

  getAllPlayers() {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  getConnectedPlayers() {
    return Array.from(this.players.values())
      .filter(p => p.ws.readyState === 1) // WebSocket.OPEN
      .map(p => p.toJSON());
  }
}

module.exports = PlayerManager;