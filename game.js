let players = {};
let bullets, enemies, coins;
let gameOver = false;
let timer = 60; // 1-minute match

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: { preload, create, update }
};

function preload() {
  this.load.image('bg', 'assets/background.png');
  this.load.image('soldier', 'assets/soldier.png');
  this.load.image('enemy', 'assets/enemy.png');
  this.load.image('coin', 'assets/coin.png');
  this.load.image('bullet', 'assets/bullet.png');
}

function create() {
  // Background
  this.add.image(400, 300, 'bg');

  // Groups
  bullets = this.physics.add.group({ maxSize: 20 });
  enemies = this.physics.add.group();
  coins = this.physics.add.group();

  // Player setup
  const player = this.physics.add.sprite(100, 300, 'soldier');
  player.health = 100;
  player.score = 0;
  player.setCollideWorldBounds(true);
  players["local"] = player;

  // Spawn enemies
  for (let i = 0; i < 3; i++) {
    let enemy = enemies.create(300 + i * 150, 400, 'enemy');
    enemy.health = 30;
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(1).setVelocity(Phaser.Math.Between(-100, 100), 20);
  }

  // Collisions
  this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
  this.physics.add.overlap(player, coins, collectCoin, null, this);

  // Controls
  this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');

  // Timer
  this.time.addEvent({
    delay: 1000,
    callback: () => {
      if (!gameOver) timer--;
      if (timer <= 0) endGame(this);
    },
    loop: true
  });

  // Fire game start event (for Web3 hooks later)
  document.dispatchEvent(new CustomEvent("game:playerJoin", { detail: { playerId: "local" }}));
}

function update() {
  if (gameOver) return;

  const player = players["local"];
  if (!player) return;

  player.setVelocity(0);

  // Movement (WASD / Arrows)
  if (this.keys.W.isDown || this.cursors.up.isDown) player.setVelocityY(-200);
  if (this.keys.S.isDown || this.cursors.down.isDown) player.setVelocityY(200);
  if (this.keys.A.isDown || this.cursors.left.isDown) player.setVelocityX(-200);
  if (this.keys.D.isDown || this.cursors.right.isDown) player.setVelocityX(200);

  // Rotate player to face mouse pointer
  const pointer = this.input.activePointer;
  const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
  player.setRotation(angle);

  // Shooting towards pointer
  if (pointer.isDown) {
    shootBullet(this, player, pointer.worldX, pointer.worldY);
  }

  // Enemy AI - chase player
  enemies.children.iterate(enemy => {
    if (enemy && enemy.active) {
      this.physics.moveToObject(enemy, player, 80);
    }
  });
}

function shootBullet(scene, player, targetX, targetY) {
  const bullet = bullets.get(player.x, player.y, 'bullet');
  if (bullet) {
    bullet.setActive(true).setVisible(true);
    scene.physics.world.enable(bullet);
    bullet.body.allowGravity = false;

    // Calculate velocity towards pointer
    const angle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
    const speed = 500;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Rotate bullet
    bullet.setRotation(angle);

    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;

    bullet.body.world.on('worldbounds', function (body) {
      if (body.gameObject === bullet) {
        bullet.destroy();
      }
    });

    new Audio('assets/shoot.wav').play();
  }
}

function bulletHitEnemy(bullet, enemy) {
  bullet.destroy();
  enemy.health -= 10;

  if (enemy.health <= 0) {
    enemy.destroy();
    spawnCoin(enemy.x, enemy.y);
    players["local"].score += 5;

    document.dispatchEvent(new CustomEvent("game:enemyDefeated", { detail: { reward: 5 }}));
  }
}

function spawnCoin(x, y) {
  let coin = coins.create(x, y, 'coin');
  coin.setBounce(0.5).setCollideWorldBounds(true);
}

function collectCoin(player, coin) {
  coin.destroy();
  player.score += 1;
  document.dispatchEvent(new CustomEvent("game:coinCollect", { detail: { amount: 1 }}));
}

function endGame(scene) {
  gameOver = true;
  const winner = "local"; // placeholder until multiplayer
  document.dispatchEvent(new CustomEvent("game:matchEnd", { detail: { winner, score: players[winner].score }}));

  scene.add.text(400, 300, `Winner! Score: ${players[winner].score}`, {
    fontSize: '24px',
    fontFamily: 'Press Start 2P',
    fill: '#FFD700'
  }).setOrigin(0.5);
}

new Phaser.Game(config);
