const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Sui Arena WebSocket Server in Development Mode');
console.log('==========================================================\n');

// Start the server with nodemon for auto-restart
const serverProcess = spawn('npx', ['nodemon', 'server.js'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});
