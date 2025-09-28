class Player {
  constructor(id, walletAddress, ws) {
    this.id = id;
    this.walletAddress = walletAddress;
    this.ws = ws;
    this.position = { x: 0, y: 0 };
    this.health = 100;
    this.kills = 0;
    this.deaths = 0;
    this.isAlive = true;
    this.joinedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      walletAddress: this.walletAddress,
      position: this.position,
      health: this.health,
      kills: this.kills,
      deaths: this.deaths,
      isAlive: this.isAlive
    };
  }
}

class Match {
  constructor(id) {
    this.id = id;
    this.players = new Map();
    this.startTime = null;
    this.endTime = null;
    this.duration = 2 * 60 * 1000; // 2 minutes in milliseconds
    this.status = 'waiting'; // waiting, active, finished
    this.winner = null;
  }

  addPlayer(player) {
    this.players.set(player.id, player);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayerCount() {
    return this.players.size;
  }

  start() {
    this.status = 'active';
    this.startTime = Date.now();
    this.endTime = this.startTime + this.duration;
  }

  finish() {
    this.status = 'finished';
    this.endTime = Date.now();
    this.determineWinner();
  }

  determineWinner() {
    let winner = null;
    let highestScore = -1;

    for (const player of this.players.values()) {
      if (player.kills > highestScore) {
        highestScore = player.kills;
        winner = player;
      }
    }

    this.winner = winner;
    return winner;
  }

  isExpired() {
    return this.status === 'active' && Date.now() >= this.endTime;
  }

  getTimeRemaining() {
    if (this.status !== 'active') return 0;
    return Math.max(0, this.endTime - Date.now());
  }
}

module.exports = { Player, Match };
