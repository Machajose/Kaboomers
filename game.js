let coins = 0;
let hasFireGun = false;
let lastFired = 0; // cooldown tracker

function addCoins(amount, scene, x = null, y = null) {
  coins += amount;
  document.getElementById('coins').textContent = coins;
  new Audio('assets/coin.wav').play();

  // Floating text popup
  if (scene && x !== null && y !== null) {
    const popup = scene.add.text(x, y - 20, `+${amount} 💰`, {
      fontFamily: 'Press Start 2P',
      fontSize: '14px',
      fill: '#FFD700'
    }).setOrigin(0.5);
    scene.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'power1',
      onComplete: () => popup.destroy()
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: {
    preload,
    create,
    update
  }
};

function preload() {
  this.load.image('jungle-tiles', 'assets/background.png');
  this.load.image('soldier', 'assets/soldier.png');
  this.load.image('coin', 'assets/coin.png');
  this.load.image('enemy', 'assets/enemy.png');
  this.load.image('bullet', 'assets/bullet.png');
  this.load.image('fireBullet', 'assets/fire-bullet.png'); // 🔥 upgrade
  this.load.image('explosion', 'assets/explosion.png');
  this.load.tilemapTiledJSON('map', 'assets/island-map.json');
  this.load.atlas('particles', 'assets/particles.png', 'assets/particles.json'); // optional particles
}

function create() {
  // Map
  const map = this.make.tilemap({ key: 'map' });
  const tileset = map.addTilesetImage('jungle-tiles', 'jungle-tiles');
  const ground = map.createLayer('Ground', tileset, 0, 0);
  ground.setCollisionByProperty({ collides: true });

  // Player
  this.player = this.physics.add.sprite(400, 300, 'soldier').setScale(1);
  this.player.setCollideWorldBounds(true);
  this.physics.add.collider(this.player, ground);

  // Coin + Enemy
  this.coin = this.physics.add.sprite(500, 350, 'coin').setScale(1).setBounce(0.5);
  this.enemy = this.physics.add.sprite(600, 400, 'enemy').setScale(1).setBounce(0.3);
  this.physics.add.collider(this.coin, ground);
  this.physics.add.collider(this.enemy, ground);

  // Camera
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.cameras.main.startFollow(this.player);
  this.cameras.main.fadeIn(1000, 0, 0, 0);
  this.cameras.main.setZoom(1.1);

  // Overlap with coin
  this.physics.add.overlap(this.player, this.coin, () => {
    document.getElementById('collectCoin').disabled = false;
    document.getElementById('questStatus').textContent = 'Coin found! Click to collect!';
  });

  // Bullets
  this.bullets = this.physics.add.group({ maxSize: 15 });
  this.physics.add.collider(this.bullets, ground, (bullet) => bullet.destroy());
  this.physics.add.collider(this.bullets, this.enemy, (bullet, enemy) => {
    bullet.destroy();
    enemy.setTexture('explosion');
    addCoins(5, this, enemy.x, enemy.y);
    document.getElementById('questStatus').textContent = 'Guard Defeated! +5 Coins! 💥';
    document.getElementById('claimWeapon').classList.remove('hidden');
    new Audio('assets/boom.wav').play();

    // Particle effect on explosion
    const particles = this.add.particles('coin');
    const emitter = particles.createEmitter({
      x: enemy.x,
      y: enemy.y,
      speed: { min: -100, max: 100 },
      lifespan: 500,
      quantity: 15,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 }
    });
    setTimeout(() => {
      enemy.destroy();
      particles.destroy();
    }, 600);
  });

  // Controls
  this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = this.input.keyboard.addKeys('W,A,S,D');

  // UI Button logic
  document.getElementById('collectCoin').addEventListener('click', () => {
    if (!this.coin.active) return;
    this.coin.destroy();
    addCoins(10, this, this.player.x, this.player.y);
    document.getElementById('questStatus').textContent = 'Coin Collected! +10 Coins!';
    document.getElementById('collectCoin').classList.add('hidden');
  });

  document.getElementById('claimWeapon').addEventListener('click', () => {
    hasFireGun = true;
    document.getElementById('weapon').textContent = '🔥 Fire Gun';
    document.getElementById('questStatus').textContent = 'Weapon Upgraded!';
    document.getElementById('claimWeapon').classList.add('hidden');
  });
}

function update(time) {
  const speed = 180;
  this.player.setVelocity(0);

  if (this.keys.W.isDown) this.player.setVelocityY(-speed);
  if (this.keys.S.isDown) this.player.setVelocityY(speed);
  if (this.keys.A.isDown) this.player.setVelocityX(-speed);
  if (this.keys.D.isDown) this.player.setVelocityX(speed);

  // Shooting with cooldown
  if (this.input.activePointer.isDown && time > lastFired) {
    lastFired = time + (hasFireGun ? 150 : 400); // faster fire with upgrade
    const bullet = this.bullets.get(this.player.x + 20, this.player.y, hasFireGun ? 'fireBullet' : 'bullet');
    if (bullet) {
      bullet.setActive(true).setVisible(true);
      bullet.setVelocityX( hasFireGun ? 500 : 300 );
      new Audio(hasFireGun ? 'assets/fire.wav' : 'assets/shoot.wav').play();
    }
  }
}

const game = new Phaser.Game(config);
