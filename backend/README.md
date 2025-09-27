# Sui Arena WebSocket Server

A modular WebSocket server for the Sui Arena multiplayer game, handling real-time player interactions, match management, and blockchain integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Access to Sui testnet

### Installation

```bash
# Clone and install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev

# Or start production server
npm start
```

### Environment Variables

```env
PORT=8080
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
CHARACTER_NFT_CONTRACT=<contract_address_from_team_member_3>
REWARD_TOKEN_CONTRACT=<contract_address_from_team_member_3>  
ARENA_REGISTRY_CONTRACT=<contract_address_from_team_member_3>
```

## 🏗️ Architecture

### Core Components

- **PlayerManager**: Handles player lifecycle, positions, and stats
- **MatchManager**: Manages match creation, timing, and results  
- **MessageBroadcaster**: Handles WebSocket message distribution
- **SuiIntegration**: Blockchain interaction service
- **MessageHandler**: Routes and processes client messages

### Message Types

#### Client → Server
```javascript
// Player joins game
{
  type: 'player_join',
  payload: { walletAddress: '0x...' }
}

// Player movement
{
  type: 'player_move', 
  payload: { playerId: '...', position: { x: 100, y: 200 } }
}

// Player shoots
{
  type: 'player_shoot',
  payload: { shooterId: '...', targetId: '...', position: { x: 150, y: 250 } }
}
```

#### Server → Client
```javascript
// Match started
{
  type: 'match_started',
  data: { matchId: '...', duration: 120000, players: [...] }
}

// Player movement broadcast
{
  type: 'player_moved',
  data: { playerId: '...', position: { x: 100, y: 200 } }
}

// Match ended
{
  type: 'match_ended', 
  data: { matchId: '...', winner: {...}, finalScores: [...] }
}
```

## 🧪 Testing

### Run Basic Tests
```bash
npm test
```

### Run Load Tests
```bash
# Test with 10 concurrent players for 30 seconds
node test/load-test.js 10 30

# Test with 50 players for 60 seconds
node test/load-test.js 50 60
```

### Manual Testing
1. Start server: `npm run dev`
2. Open WebSocket client (browser console, Postman, etc.)
3. Connect to `ws://localhost:8080`
4. Send test messages following the message format

## 🔗 Integration Points

### Frontend Integration (Team Member 2)
The WebSocket server expects connections and provides:
- Real-time player position updates
- Match state synchronization  
- Combat result broadcasting
- Winner notification for reward claiming

### Smart Contract Integration (Team Member 3)
The server will call deployed contracts:
- `CharacterNFT.move` - Player character management
- `RewardToken.move` - Winner reward distribution
- `ArenaRegistry.move` - Match result recording

## 🎮 Game Flow

1. **Connection**: Player connects with wallet address
2. **Joining**: Server creates/assigns player to match
3. **Gameplay**: Real-time position and combat sync
4. **Match End**: Server determines winner after 2 minutes
5. **Rewards**: Winner gets blockchain transaction to claim reward

## 📊 Monitoring

The server logs important events and provides stats:
- Connected player count
- Active match status  
- Message throughput
- Error rates

## 🚀 Deployment

### Production Setup
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start server.js --name "sui-arena-server"

# Monitor
pm2 monit
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

## 🤝 Team Integration

### For Team Member 2 (Frontend):
- Connect to `ws://localhost:8080` 
- Send `player_join` with wallet address
- Listen for `match_started`, `player_moved`, `shot_fired` events
- Handle `reward_ready` to trigger wallet transaction

### For Team Member 3 (Smart Contracts):
- Provide deployed contract addresses via environment variables
- Implement `ArenaRegistry.record_match_result(matchId, winner, kills)`
- Server will call this function when matches end

## 🔧 Configuration

### Match Settings
- Duration: 2 minutes (configurable in `Match` class)
- Min players to start: 2 (configurable in `MatchManager`)
- Respawn delay: 3 seconds
- Health: 100 HP, 25 damage per hit

### Performance Tuning
- Message broadcast batching
- Connection pooling
- Rate limiting (can be added)
- Horizontal scaling support

---

Built with ❤️ for Sui Arena - Web3 Gaming Experience 