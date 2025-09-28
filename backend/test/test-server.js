const WebSocket = require('ws');

class GameServerTester {
  constructor(serverUrl = 'ws://localhost:8080') {
    this.serverUrl = serverUrl;
    this.testPlayers = [];
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting WebSocket Server Tests');
    console.log('=====================================\n');

    try {
      await this.testConnection();
      await this.testMultiplePlayerConnections();
      await this.testPlayerMovement();
      await this.testCombatMechanics();
      await this.testMatchFlow();
      await this.cleanup();

      this.displayResults();
    } catch (error) {
      console.error('Test suite failed:', error);
    }
  }

  async testConnection() {
    console.log('1️⃣ Testing basic connection...');
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.serverUrl);
      let testPassed = false;

      const timeout = setTimeout(() => {
        if (!testPassed) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);

      ws.on('open', () => {
        console.log('   ✅ WebSocket connection established');
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'connection_established') {
          console.log('   ✅ Welcome message received');
          testPassed = true;
          clearTimeout(timeout);
          ws.close();
          this.testResults.push({ test: 'Basic Connection', passed: true });
          resolve();
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      ws.on('close', () => {
        if (testPassed) {
          console.log('   ✅ Connection closed cleanly\n');
        }
      });
    });
  }

  async testMultiplePlayerConnections() {
    console.log('2️⃣ Testing multiple player connections...');

    const numPlayers = 3;
    const connections = [];

    for (let i = 0; i < numPlayers; i++) {
      const walletAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      connections.push(this.createTestPlayer(walletAddress, i + 1));
    }

    const results = await Promise.all(connections);
    this.testPlayers = results;

    console.log(`   ✅ ${numPlayers} players connected successfully`);
    console.log('   ✅ All players received join confirmations\n');

    this.testResults.push({ 
      test: 'Multiple Connections', 
      passed: true, 
      details: `${numPlayers} players connected` 
    });
  }

  async createTestPlayer(walletAddress, playerNumber) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.serverUrl);
      const player = {
        id: null,
        walletAddress,
        ws,
        playerNumber,
        messages: []
      };

      const timeout = setTimeout(() => {
        reject(new Error(`Player ${playerNumber} connection timeout`));
      }, 10000);

      ws.on('open', () => {
        // Join the game
        ws.send(JSON.stringify({
          type: 'player_join',
          payload: { walletAddress }
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        player.messages.push(message);

        if (message.type === 'player_joined') {
          player.id = message.data.playerId;
          player.matchId = message.data.matchId;
          console.log(`   ✅ Player ${playerNumber} (${player.id}) joined match ${player.matchId}`);
          clearTimeout(timeout);
          resolve(player);
        }

        // Log important events
        if (message.type === 'match_started') {
          console.log(`   🚀 Match started for player ${playerNumber}`);
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async testPlayerMovement() {
    console.log('3️⃣ Testing player movement synchronization...');

    const player1 = this.testPlayers[0];
    const player2 = this.testPlayers[1];

    // Player 1 moves
    const newPosition = { x: 150, y: 200 };
    player1.ws.send(JSON.stringify({
      type: 'player_move',
      payload: {
        playerId: player1.id,
        position: newPosition
      }
    }));

    // Wait for movement broadcast
    await this.waitForMessage(player2, 'player_moved', 2000);

    const moveMessage = player2.messages.find(m => 
      m.type === 'player_moved' && 
      m.data.playerId === player1.id
    );

    if (moveMessage && 
        moveMessage.data.position.x === newPosition.x && 
        moveMessage.data.position.y === newPosition.y) {
      console.log('   ✅ Player movement synchronized across clients');
      this.testResults.push({ test: 'Player Movement', passed: true });
    } else {
      console.log('   ❌ Player movement sync failed');
      this.testResults.push({ test: 'Player Movement', passed: false });
    }

    console.log('');
  }

  async testCombatMechanics() {
    console.log('4️⃣ Testing combat mechanics...');

    const shooter = this.testPlayers[0];
    const target = this.testPlayers[1];

    // Simulate shooting
    shooter.ws.send(JSON.stringify({
      type: 'player_shoot',
      payload: {
        shooterId: shooter.id,
        targetId: target.id,
        position: { x: 100, y: 100 }
      }
    }));

    // Wait for shot result
    await this.waitForMessage(target, 'shot_fired', 3000);

    const shotMessage = target.messages.find(m => m.type === 'shot_fired');
    
    if (shotMessage) {
      console.log('   ✅ Shooting mechanics working');
      console.log(`   📊 Shot result: ${shotMessage.data.result.type}`);
      
      // Test multiple shots to trigger kill
      for (let i = 0; i < 4; i++) {
        shooter.ws.send(JSON.stringify({
          type: 'player_shoot',
          payload: {
            shooterId: shooter.id,
            targetId: target.id,
            position: { x: 100 + i, y: 100 + i }
          }
        }));
        await this.sleep(500); // Small delay between shots
      }

      // Wait for respawn
      await this.waitForMessage(target, 'player_respawned', 5000);
      
      const respawnMessage = target.messages.find(m => m.type === 'player_respawned');
      if (respawnMessage) {
        console.log('   ✅ Player respawn system working');
      }

      this.testResults.push({ test: 'Combat Mechanics', passed: true });
    } else {
      console.log('   ❌ Combat mechanics failed');
      this.testResults.push({ test: 'Combat Mechanics', passed: false });
    }

    console.log('');
  }

  async testMatchFlow() {
    console.log('5️⃣ Testing match flow and timing...');

    // Check if match started message was received
    const player = this.testPlayers[0];
    const matchStartMessage = player.messages.find(m => m.type === 'match_started');
    
    if (matchStartMessage) {
      console.log('   ✅ Match started successfully');
      console.log(`   ⏱️  Match duration: ${matchStartMessage.data.duration / 1000}s`);
      
      // Wait for time updates
      console.log('   ⏳ Waiting for time updates...');
      await this.waitForMessage(player, 'time_update', 5000);
      
      const timeUpdate = player.messages.find(m => m.type === 'time_update');
      if (timeUpdate) {
        console.log('   ✅ Match timer working');
        console.log(`   ⏱️  Time remaining: ${Math.round(timeUpdate.data.timeRemaining / 1000)}s`);
      }

      this.testResults.push({ test: 'Match Flow', passed: true });
    } else {
      console.log('   ❌ Match flow test failed');
      this.testResults.push({ test: 'Match Flow', passed: false });
    }

    console.log('');
  }

  async waitForMessage(player, messageType, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const message = player.messages.find(m => m.type === messageType);
        if (message) {
          clearInterval(checkInterval);
          resolve(message);
        }

        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Timeout waiting for ${messageType}`));
        }
      }, 100);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('6️⃣ Cleaning up test connections...');
    
    for (const player of this.testPlayers) {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.close();
      }
    }
    
    await this.sleep(1000);
    console.log('   ✅ All test connections closed\n');
  }

  displayResults() {
    console.log('📊 TEST RESULTS');
    console.log('================');
    
    let passed = 0;
    let total = this.testResults.length;

    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.test}`);
      if (result.details) {
        console.log(`    ${result.details}`);
      }
      if (result.passed) passed++;
    });

    console.log(`\n🎯 Score: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! WebSocket server is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the implementation.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new GameServerTester();
  
  // Give server time to start if needed
  setTimeout(() => {
    tester.runAllTests().catch(console.error);
  }, 1000);
}

module.exports = GameServerTester;