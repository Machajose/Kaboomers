const { Match } = require('../types/GameTypes');
const { v4: uuidv4 } = require('uuid');

class MatchManager {
  constructor(suiIntegration, broadcaster) {
    this.matches = new Map();
    this.currentMatch = null;
    this.suiIntegration = suiIntegration;
    this.broadcaster = broadcaster;
    this.matchCheckInterval = null;
  }

  createMatch() {
    const matchId = uuidv4();
    const match = new Match(matchId);
    
    this.matches.set(matchId, match);
    this.currentMatch = match;
    
    console.log(`Created new match: ${matchId}`);
    return match;
  }

  addPlayerToCurrentMatch(player) {
    if (!this.currentMatch || this.currentMatch.status !== 'waiting') {
      this.currentMatch = this.createMatch();
    }

    this.currentMatch.addPlayer(player);
    
    // Start match if we have enough players (minimum 2)
    if (this.currentMatch.getPlayerCount() >= 2 && this.currentMatch.status === 'waiting') {
      this.startMatch(this.currentMatch);
    }

    return this.currentMatch;
  }

  startMatch(match) {
    match.start();
    console.log(`Match ${match.id} started with ${match.getPlayerCount()} players`);
    
    // Broadcast match start
    this.broadcaster.broadcastToMatch(match, {
      type: 'match_started',
      data: {
        matchId: match.id,
        duration: match.duration,
        players: Array.from(match.players.values()).map(p => p.toJSON())
      }
    });

    // Start monitoring match time
    this.startMatchTimer(match);
  }

  startMatchTimer(match) {
    if (this.matchCheckInterval) {
      clearInterval(this.matchCheckInterval);
    }

    this.matchCheckInterval = setInterval(() => {
      if (match.isExpired()) {
        this.endMatch(match);
      } else {
        // Broadcast time remaining
        this.broadcaster.broadcastToMatch(match, {
          type: 'time_update',
          data: {
            timeRemaining: match.getTimeRemaining()
          }
        });
      }
    }, 1000);
  }

  async endMatch(match) {
    if (match.status === 'finished') return;

    match.finish();
    console.log(`Match ${match.id} ended`);

    if (this.matchCheckInterval) {
      clearInterval(this.matchCheckInterval);
      this.matchCheckInterval = null;
    }

    const winner = match.winner;
    
    // Broadcast match results
    this.broadcaster.broadcastToMatch(match, {
      type: 'match_ended',
      data: {
        matchId: match.id,
        winner: winner ? winner.toJSON() : null,
        finalScores: Array.from(match.players.values()).map(p => ({
          id: p.id,
          walletAddress: p.walletAddress,
          kills: p.kills,
          deaths: p.deaths
        }))
      }
    });

    // Submit match result to Sui blockchain
    if (winner) {
      try {
        await this.suiIntegration.submitMatchResult(match.id, winner.walletAddress, winner.kills);
        console.log(`Match result submitted for winner: ${winner.walletAddress}`);
        
        // Notify winner about blockchain submission
        if (winner.ws.readyState === 1) {
          winner.ws.send(JSON.stringify({
            type: 'reward_ready',
            data: {
              message: '🏆 You won! Claim your reward token!',
              matchId: match.id,
              kills: winner.kills
            }
          }));
        }
      } catch (error) {
        console.error('Failed to submit match result:', error);
      }
    }

    // Clean up - prepare for next match
    this.currentMatch = null;
  }

  removePlayerFromMatch(playerId) {
    if (this.currentMatch) {
      this.currentMatch.removePlayer(playerId);
      
      // End match if no players left
      if (this.currentMatch.getPlayerCount() === 0) {
        this.endMatch(this.currentMatch);
      }
    }
  }

  getCurrentMatch() {
    return this.currentMatch;
  }
}

module.exports = MatchManager;
