function showSection(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(`nav button[onclick="showSection('${id}')"]`).classList.add("active");
}

// ===== GAME ENGINE =====
const canvas=document.getElementById("gameCanvas"), ctx=canvas.getContext("2d");

let gravity=0.4, ground=400;
let keys={}; // key states

let player={
  x:100,y:ground,w:40,h:40,
  vy:0, onGround:true, facing:1,
  right:new Image(), left:new Image()
};
player.right.src="soldier-right.png";
player.left.src="soldier-left.png";

let bullets=[], enemies=[
  {x:600,y:ground,w:40,h:40,hp:3,flash:0,speed:1}
];

// handle actions (keyboard & UI buttons)
function performAction(k,down=true){
  keys[k]=down;
  if(k===" " && down){ // shoot
    bullets.push({
      x:player.x+(player.facing===1?player.w:0),
      y:player.y+20, speed:8*player.facing
    });
  }
}

function update(){
  // movement
  if(keys["a"]){ player.x-=3; player.facing=-1; }
  if(keys["d"]){ player.x+=3; player.facing=1; }
  if(keys["w"] && player.onGround){ player.vy=-9; player.onGround=false; }

  // gravity
  player.y += player.vy;
  player.vy += gravity;
  if(player.y>=ground){ player.y=ground; player.vy=0; player.onGround=true; }

  // bullets
  bullets.forEach(b=> b.x+=b.speed);
  bullets=bullets.filter(b=> b.x>0 && b.x<canvas.width);

  // collisions
  bullets.forEach(b=>{
    enemies.forEach((e,ei)=>{
      if(b.x>e.x && b.x<e.x+e.w && b.y>e.y && b.y<e.y+e.h){
        e.hp--; e.flash=5;
        bullets.splice(bullets.indexOf(b),1);
        if(e.hp<=0) enemies.splice(ei,1);
      }
    });
  });

  // enemy AI
  enemies.forEach(e=>{
    if(e.flash>0) e.flash--;
    if(player.x<e.x) e.x-=e.speed;
    else if(player.x>e.x) e.x+=e.speed;
  });
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // ground
  ctx.fillStyle="#444";
  ctx.fillRect(0,ground+player.h,canvas.width,canvas.height-ground);

  // player
  let img=player.facing===1?player.right:player.left;
  if(img.complete && img.naturalWidth!==0){
    ctx.drawImage(img,player.x,player.y,player.w,player.h);
  } else {
    ctx.fillStyle="cyan";
    ctx.fillRect(player.x,player.y,player.w,player.h);
  }

  // bullets
  ctx.fillStyle="yellow";
  bullets.forEach(b=> ctx.fillRect(b.x,b.y,6,3));

  // enemies
  enemies.forEach(e=>{
    ctx.fillStyle=e.flash>0?"white":"red";
    ctx.fillRect(e.x,e.y,e.w,e.h);
  });
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();

// Keyboard events
document.addEventListener("keydown",e=>{
  if(["a","d","w"," "].includes(e.key)) performAction(e.key,true);
});
document.addEventListener("keyup",e=>{
  if(["a","d","w"," "].includes(e.key)) performAction(e.key,false);
});
