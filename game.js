let coins = 0;
function addCoins(amount) {
  coins += amount;
  document.getElementById('coins').textContent = coins;
  new Audio('assets/coin.wav').play();
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

function preload() {
  this.load.image('jungle-tiles', 'assets/jungle-tiles.png');
  this.load.image('soldier', 'assets/soldier-blue.png');
  this.load.image('coin', 'assets/coin.png');
  this.load.image('enemy', 'assets/enemy-red.png');
  this.load.image('bullet', 'assets/bullet.png');
  this.load.image('explosion', 'assets/explosion.png');
  this.load.tilemapTiledJSON('map', 'assets/island-map.json');
}

function create() {
  const map = this.make.tilemap({ key: 'map' });
  const tileset = map.addTilesetImage('jungle-tiles', 'jungle-tiles');
  const ground = map.createLayer('Ground', tileset, 0, 0);
  ground.setCollisionByProperty({ collides: true });

  this.player = this.physics.add.sprite(400, 300, 'soldier').setScale(1);
  this.player.setCollideWorldBounds(true);
  this.physics.add.collider(this.player, ground);

  this.coin = this.physics.add.sprite(500, 350, 'coin').setScale(1);
  this.enemy = this.physics.add.sprite(600, 400, 'enemy').setScale(1);
  this.physics.add.collider(this.coin, ground);
  this.physics.add.collider(this.enemy, ground);

  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.cameras.main.startFollow(this.player);

  this.physics.add.overlap(this.player, this.coin, () => {
    document.getElementById('collectCoin').disabled = false;
    document.getElementById('questStatus').textContent = 'Coin found! Click to collect!';
  });

  this.bullets = this.physics.add.group({ maxSize: 10 });
  this.physics.add.collider(this.bullets, ground, (bullet) => bullet.destroy());
  this.physics.add.collider(this.bullets, this.enemy, (bullet, enemy) => {
    bullet.destroy();
    enemy.setTexture('explosion');
    addCoins(5);
    document.getElementById('questStatus').textContent = 'Guard Defeated! +5 Coins! 💥';
    document.getElementById('claimWeapon').classList.remove('hidden');
    new Audio('assets/boom.wav').play();
    setTimeout(() => enemy.destroy(), 500);
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = this.input.keyboard.addKeys('W,A,S,D');
}

function update() {
  const speed = 160;
  this.player.setVelocity(0);
  if (this.keys.W.isDown) this.player.setVelocityY(-speed);
  if (this.keys.S.isDown) this.player.setVelocityY(speed);
  if (this.keys.A.isDown) this.player.setVelocityX(-speed);
  if (this.keys.D.isDown) this.player.setVelocityX(speed);

  if (this.input.activePointer.isDown) {
    const bullet = this.bullets.get(this.player.x + 20, this.player.y, 'bullet');
    if (bullet) {
      bullet.setActive(true).setVisible(true);
      bullet.setVelocityX(300);
      new Audio('assets/shoot.wav').play();
    }
  }
}

const game = new Phaser.Game(config);