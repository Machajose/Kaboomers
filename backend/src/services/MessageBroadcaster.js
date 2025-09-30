class MessageBroadcaster {
  constructor() {}

  broadcastToAll(players, message) {
    const messageStr = JSON.stringify(message);
    
    players.forEach(player => {
      if (player.ws.readyState === 1) { // WebSocket.OPEN
        try {
          player.ws.send(messageStr);
        } catch (error) {
          console.error(`Failed to send message to player ${player.id}:`, error);
        }
      }
    });
  }

  broadcastToMatch(match, message) {
    this.broadcastToAll(Array.from(match.players.values()), message);
  }

  broadcastPlayerUpdate(players, updatedPlayer, updateType) {
    const message = {
      type: updateType,
      data: updatedPlayer.toJSON(),
      timestamp: Date.now()
    };

    this.broadcastToAll(players, message);
  }

  broadcastGameEvent(players, eventType, eventData) {
    const message = {
      type: eventType,
      data: eventData,
      timestamp: Date.now()
    };

    this.broadcastToAll(players, message);
  }
}

module.exports = MessageBroadcaster;

