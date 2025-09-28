const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player setup
let player = {
  x: 100,
  y: 400,
  width: 40,
  height: 40,
  color: "green",
  dx: 0,
  dy: 0,
  speed: 4,
  gravity: 0.4,
  jumpPower: -8, // jetpack lift
  onGround: false,
  bullets: [],
  facing: "right",
  shooting: false,
  health: 100
};

// Score
let score = 0;

// Enemies
let enemies = [];
function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 40),
    y: 400,
    width: 40,
    height: 40,
    color: "red",
    dx: (Math.random() < 0.5 ? -1 : 1) * 2 // simple patrol
  });
}

// Spawn initial enemies
for (let i = 0; i < 3; i++) spawnEnemy();

// Keyboard state
let keys = {};

// Event listeners
document.addEventListener("keydown", e => {
  keys[e.key] = true;
});
document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

// Shooting
function shoot() {
  player.bullets.push({
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
    dx: player.facing === "right" ? 8 : -8,
    width: 8,
    height: 4,
    color: "yellow"
  });
}

// Update
function update() {
  // Horizontal movement
  if (keys["ArrowLeft"]) {
    player.dx = -player.speed;
    player.facing = "left";
  } else if (keys["ArrowRight"]) {
    player.dx = player.speed;
    player.facing = "right";
  } else {
    player.dx = 0;
  }

  // Jetpack lift
  if (keys["ArrowUp"]) {
    player.dy = player.jumpPower;
  }

  // Shoot
  if (keys[" "]) {
    if (!player.shooting) {
      shoot();
      player.shooting = true;
    }
  } else {
    player.shooting = false;
  }

  // Apply physics
  player.dy += player.gravity;
  player.x += player.dx;
  player.y += player.dy;

  // Floor collision
  if (player.y + player.height >= canvas.height) {
    player.y = canvas.height - player.height;
    player.dy = 0;
    player.onGround = true;
  }

  // Boundaries
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;

  // Update bullets
  player.bullets.forEach((bullet, i) => {
    bullet.x += bullet.dx;

    // Remove offscreen bullets
    if (bullet.x < 0 || bullet.x > canvas.width) {
      player.bullets.splice(i, 1);
    }

    // Collision with enemies
    enemies.forEach((enemy, j) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemies.splice(j, 1);
        player.bullets.splice(i, 1);
        score += 10;
        setTimeout(spawnEnemy, 2000); // respawn enemy after 2s
      }
    });
  });

  // Enemy movement & collision with player
  enemies.forEach(enemy => {
    enemy.x += enemy.dx;

    // Bounce enemies at edges
    if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
      enemy.dx *= -1;
    }

    // Check collision with player
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      player.health -= 1; // lose health if touched
      if (player.health <= 0) {
        alert("Game Over! Final Score: " + score);
        document.location.reload();
      }
    }
  });
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Bullets
  player.bullets.forEach(bullet => {
    ctx.fillStyle = bullet.color;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Enemies
  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Health: " + player.health, 20, 55);
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
