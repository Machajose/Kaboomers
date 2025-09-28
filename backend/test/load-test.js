const WebSocket = require('ws');

class LoadTester {
  constructor(serverUrl = 'ws://localhost:8080', numPlayers = 10) {
    this.serverUrl = serverUrl;
    this.numPlayers = numPlayers;
    this.players = [];
    this.stats = {
      connected: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0
    };
  }

  async runLoadTest(duration = 30000) {
    console.log(`🚀 Starting load test with ${this.numPlayers} concurrent players`);
    console.log(`⏱️  Test duration: ${duration / 1000}s\n`);

    // Create all players
    const connectionPromises = [];
    for (let i = 0; i < this.numPlayers; i++) {
      connectionPromises.push(this.createLoadTestPlayer(i));
    }

    await Promise.all(connectionPromises);
    console.log(`✅ ${this.stats.connected} players connected\n`);

    // Start player activity
    this.startPlayerActivity();

    // Run for specified duration
    await this.sleep(duration);

    // Stop and cleanup
    await this.cleanup();
    this.displayLoadTestResults();
  }

  async createLoadTestPlayer(index) {
    return new Promise((resolve, reject) => {
      const walletAddress = `0x${index.toString().padStart(40, '0')}`;
      const ws = new WebSocket(this.serverUrl);
      
      const player = {
        index,
        id: null,
        walletAddress,
        ws,
        activityInterval: null,
        messageCount: 0
      };

      ws.on('open', () => {
        this.stats.connected++;
        
        // Join game
        ws.send(JSON.stringify({
          type: 'player_join',
          payload: { walletAddress }
        }));
        this.stats.messagesSent++;
      });

      ws.on('message', (data) => {
        this.stats.messagesReceived++;
        player.messageCount++;
        
        const message = JSON.parse(data);
        if (message.type === 'player_joined') {
          player.id = message.data.playerId;
          this.players.push(player);
          resolve(player);
        }
      });

      ws.on('error', (error) => {
        this.stats.errors++;
        console.error(`Player ${index} error:`, error.message);
      });

      ws.on('close', () => {
        if (player.activityInterval) {
          clearInterval(player.activityInterval);
        }
      });
    });
  }

  startPlayerActivity() {
    console.log('🎮 Starting player activities...\n');
    
    this.players.forEach(player => {
      // Each player moves and shoots randomly
      player.activityInterval = setInterval(() => {
        if (player.ws.readyState === WebSocket.OPEN) {
          // Random movement
          if (Math.random() < 0.7) {
            player.ws.send(JSON.stringify({
              type: 'player_move',
              payload: {
                playerId: player.id,
                position: {
                  x: Math.random() * 800,
                  y: Math.random() * 600
                }
              }
            }));
            this.stats.messagesSent++;
          }

          // Random shooting
          if (Math.random() < 0.3 && this.players.length > 1) {
            const targetPlayer = this.players[Math.floor(Math.random() * this.players.length)];
            if (targetPlayer.id !== player.id) {
              player.ws.send(JSON.stringify({
                type: 'player_shoot',
                payload: {
                  shooterId: player.id,
                  targetId: targetPlayer.id,
                  position: {
                    x: Math.random() * 800,
                    y: Math.random() * 600
                  }
                }
              }));
              this.stats.messagesSent++;
            }
          }
        }
      }, 1000 + Math.random() * 2000); // Random interval 1-3 seconds
    });

    // Stats logging
    this.statsInterval = setInterval(() => {
      console.log(`📊 Messages sent: ${this.stats.messagesSent}, received: ${this.stats.messagesReceived}, errors: ${this.stats.errors}`);
    }, 5000);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up load test...');
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.players.forEach(player => {
      if (player.activityInterval) {
        clearInterval(player.activityInterval);
      }
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.close();
      }
    });

    await this.sleep(2000);
  }

  displayLoadTestResults() {
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('====================');
    console.log(`👥 Concurrent players: ${this.numPlayers}`);
    console.log(`🔗 Successfully connected: ${this.stats.connected}`);
    console.log(`📤 Total messages sent: ${this.stats.messagesSent}`);
    console.log(`📥 Total messages received: ${this.stats.messagesReceived}`);
    console.log(`❌ Total errors: ${this.stats.errors}`);
    
    const avgMessages = this.players.length > 0 
      ? Math.round(this.stats.messagesReceived / this.players.length) 
      : 0;
    console.log(`📊 Average messages per player: ${avgMessages}`);

    const successRate = this.stats.connected / this.numPlayers * 100;
    console.log(`✅ Connection success rate: ${successRate.toFixed(1)}%`);

    if (successRate >= 90 && this.stats.errors < this.numPlayers * 0.1) {
      console.log('\n🎉 Load test PASSED - Server handles concurrent connections well!');
    } else {
      console.log('\n⚠️  Load test CONCERNS - Server may have issues with high load');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run load test if this file is executed directly
if (require.main === module) {
  const numPlayers = process.argv[2] ? parseInt(process.argv[2]) : 10;
  const duration = process.argv[3] ? parseInt(process.argv[3]) * 1000 : 30000;
  
  const loadTester = new LoadTester('ws://localhost:8080', numPlayers);
  
  setTimeout(() => {
    loadTester.runLoadTest(duration).catch(console.error);
  }, 1000);
}

module.exports = LoadTester;

