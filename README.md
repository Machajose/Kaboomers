
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mini Sui Militia Online – Contract Arena</title>
  <style>
    body {
      font-family: "Arial", "Helvetica", sans-serif;
      background-color: #f0e0d6; /* classic 4chan beige */
      color: #000;
      margin: 0;
      padding: 0;
    }

    nav {
      background: #d6daf0;
      padding: 8px;
      border-bottom: 1px solid #aaa;
      text-align: center;
    }

    nav button {
      background: none;
      border: none;
      color: #0000ee;
      font-weight: bold;
      margin: 0 6px;
      cursor: pointer;
      text-decoration: underline;
    }
    nav button.active {
      color: #dd0000;
    }

    section {
      display: none;
      padding: 12px;
      border-bottom: 1px solid #aaa;
    }
    section.active {
      display: block;
    }

    h2 {
      margin-top: 0;
      background: #d6daf0;
      padding: 5px;
      border: 1px solid #aaa;
      font-size: 16px;
    }

    form {
      margin-bottom: 10px;
      padding: 8px;
      border: 1px solid #aaa;
      background: #fff;
    }
    input, select, button {
      margin: 4px 0;
      padding: 5px;
      border: 1px solid #aaa;
      background: #fff;
      font-size: 14px;
    }
    button {
      background: #d6daf0;
      font-weight: bold;
      cursor: pointer;
    }
    button:hover {
      background: #bfc3e6;
    }

    p {
      font-size: 13px;
      margin: 5px 0;
    }
    a {
      color: #0000ee;
    }
    a:visited {
      color: #551a8b;
    }

    iframe {
      width: 100%;
      height: 400px;
      border: 1px solid #aaa;
      margin-top: 5px;
      background: #fff;
    }

    canvas {
      border: 1px solid #aaa;
      background: #fff;
      display: block;
      margin: 10px auto;
    }

    /* greentext style */
    .greentext {
      color: #789922;
    }
  </style>
</head>
<body>
  <nav>
    <button onclick="showSection('profile')">Profile</button>
    <button onclick="showSection('avatar')">Avatar</button>
    <button onclick="showSection('battle')">Battle</button>
    <button onclick="showSection('reward')">Rewards</button>
    <button onclick="showSection('gameplay')">Gameplay</button>
  </nav>

  <!-- Profile -->
  <section id="profile" class="active">
    <h2>Profile Register</h2>
    <form id="loginForm">
      <input type="email" id="loginEmail" placeholder="Email" required><br>
      <input type="text" id="loginName" placeholder="Name" required><br>
      <input type="tel" id="loginPhone" placeholder="Phone" required><br>
      <button type="submit">Save Profile</button>
    </form>
    <p>Form URL: <a id="profileLink" href="#" target="_blank"></a></p>
    <iframe id="loginSheetIframe"></iframe>
  </section>

  <!-- Avatar -->
  <section id="avatar">
    <h2>Choose Avatar</h2>
    <form id="avatarForm">
      <select id="skin">
        <option>Default</option><option>Camouflage</option><option>Stealth</option>
      </select><br>
      <select id="weapon">
        <option>Pistol</option><option>Rifle</option><option>Sniper</option>
      </select><br>
      <button type="submit">Save Avatar</button>
    </form>
    <p>Form URL: <a id="avatarLink" href="#" target="_blank"></a></p>
    <iframe id="avatarSheetIframe"></iframe>
  </section>

  <!-- Battle -->
  <section id="battle">
    <h2>Battle Arena</h2>
    <form id="battleForm">
      <select id="map"><option>Forest</option><option>Desert</option><option>City</option></select><br>
      <select id="mode"><option>Solo</option><option>Team</option></select><br>
      <button type="submit">Start Battle</button>
    </form>
    <p>Form URL: <a id="battleLink" href="#" target="_blank"></a></p>
    <iframe id="battleSheetIframe"></iframe>
  </section>

  <!-- Rewards -->
  <section id="reward">
    <h2>Rewards</h2>
    <form id="rewardForm">
      <input type="text" id="rewardCode" placeholder="Reward Code" required><br>
      <input type="text" id="rewardPlayer" placeholder="Player Name" required><br>
      <button type="submit">Claim Reward</button>
    </form>
    <p>Form URL: <a id="rewardLink" href="#" target="_blank"></a></p>
    <iframe id="rewardSheetIframe"></iframe>
  </section>

  <!-- Gameplay -->
  <section id="gameplay">
    <h2>Gameplay</h2>
    <canvas id="gameCanvas" width="800" height="500"></canvas>
    <div style="text-align:center;">
      <button onclick="triggerAction('ArrowUp')">Up</button>
      <button onclick="triggerAction('ArrowLeft')">Left</button>
      <button onclick="triggerAction('ArrowDown')">Down</button>
      <button onclick="triggerAction('ArrowRight')">Right</button>
      <button onclick="triggerAction(' ')">Shoot</button>
    </div>
    <p class="greentext">&gt; Controls also get logged to Google Forms</p>
    <p>Form URL: <a id="gameLink" href="#" target="_blank"></a></p>
    <iframe id="gameSheetIframe"></iframe>
  </section>

  <script>
    const FORM_BASE = "https://docs.google.com/forms/d/e/1FAIpQLSfppBZ3lJWFzmrz0RyodL8x19UZ30Nuz9UpmtGTKW4uVvxOxA/viewform?usp=pp_url";
    const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0TvhIjgGMjhNJthEISLAlOpGPwBIbEHp41uQ97vL2fUkhW8HA92Ik2n1WNtpno7pwIyHVuUUnB-sF/pubhtml";

    const ENTRY_NAME="entry.2005620554", ENTRY_EMAIL="entry.1045781291", ENTRY_PHONE="entry.1065046570",
          ENTRY_SKIN="entry.508762782", ENTRY_WEAPON="entry.527282890",
          ENTRY_MAP="entry.376144578", ENTRY_MODE="entry.1752564466",
          ENTRY_REWARD_CODE="entry.155323058", ENTRY_REWARD_PLAYER="entry.1746779090",
          ENTRY_ACTION="entry.1746779090";

    function buildFormURL(data){
      return FORM_BASE + "&" + Object.entries(data)
        .map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    }

    function showSection(id){
      document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
      document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
      document.getElementById(id).classList.add("active");
      document.querySelector(`nav button[onclick="showSection('${id}')"]`).classList.add("active");
    }

    function showFormThenSheet(url, linkEl, iframe){
      linkEl.textContent = url;
      linkEl.href = url;
      iframe.src = url;
      iframe.onload = () => {
        try {
          if (iframe.contentWindow.location.href.includes("formResponse")) {
            iframe.src = SHEET_URL;
          }
        } catch(e) {
          // Cross-origin block; Google will still redirect
        }
      };
    }

    loginForm.addEventListener("submit", e=>{
      e.preventDefault();
      const name=loginName.value, email=loginEmail.value, phone=loginPhone.value;
      localStorage.setItem("profile", JSON.stringify({name,email,phone}));
      const url=buildFormURL({[ENTRY_NAME]:name,[ENTRY_EMAIL]:email,[ENTRY_PHONE]:phone});
      showFormThenSheet(url, profileLink, loginSheetIframe);
    });

    avatarForm.addEventListener("submit", e=>{
      e.preventDefault();
      const profile=JSON.parse(localStorage.getItem("profile")||"{}");
      const url=buildFormURL({
        [ENTRY_NAME]:profile.name,[ENTRY_EMAIL]:profile.email,[ENTRY_PHONE]:profile.phone,
        [ENTRY_SKIN]:skin.value,[ENTRY_WEAPON]:weapon.value
      });
      showFormThenSheet(url, avatarLink, avatarSheetIframe);
    });

    battleForm.addEventListener("submit", e=>{
      e.preventDefault();
      const profile=JSON.parse(localStorage.getItem("profile")||"{}");
      const url=buildFormURL({
        [ENTRY_NAME]:profile.name,[ENTRY_EMAIL]:profile.email,[ENTRY_PHONE]:profile.phone,
        [ENTRY_MAP]:map.value,[ENTRY_MODE]:mode.value
      });
      showFormThenSheet(url, battleLink, battleSheetIframe);
    });

    rewardForm.addEventListener("submit", e=>{
      e.preventDefault();
      const profile=JSON.parse(localStorage.getItem("profile")||"{}");
      const url=buildFormURL({
        [ENTRY_NAME]:profile.name,[ENTRY_EMAIL]:profile.email,[ENTRY_PHONE]:profile.phone,
        [ENTRY_REWARD_CODE]:rewardCode.value,[ENTRY_REWARD_PLAYER]:rewardPlayer.value
      });
      showFormThenSheet(url, rewardLink, rewardSheetIframe);
    });

    function logControl(action){
      const profile=JSON.parse(localStorage.getItem("profile")||"{}");
      const url=buildFormURL({
        [ENTRY_NAME]:profile.name,[ENTRY_EMAIL]:profile.email,[ENTRY_PHONE]:profile.phone,
        [ENTRY_ACTION]:action
      });
      showFormThenSheet(url, gameLink, gameSheetIframe);
    }

    function triggerAction(key){
      const map={ArrowUp:"Move Up",ArrowDown:"Move Down",ArrowLeft:"Move Left",ArrowRight:"Move Right"," ":"Shoot"};
      if(map[key]) logControl(map[key]);
      performAction(key);
    }

    const canvas=document.getElementById("gameCanvas"), ctx=canvas.getContext("2d");
    let player={x:400,y:250,w:40,h:40}, bullets=[];
    function performAction(k){
      if(k==="ArrowUp") player.y-=5;
      if(k==="ArrowDown") player.y+=5;
      if(k==="ArrowLeft") player.x-=5;
      if(k==="ArrowRight") player.x+=5;
      if(k===" ") bullets.push({x:player.x+20,y:player.y,speed:7});
    }
    function update(){ bullets.forEach(b=>b.y-=b.speed); bullets=bullets.filter(b=>b.y>0); }
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle="cyan"; ctx.fillRect(player.x,player.y,player.w,player.h);
      ctx.fillStyle="red"; bullets.forEach(b=>ctx.fillRect(b.x,b.y,5,10));
    }
    function loop(){ update(); draw(); requestAnimationFrame(loop); }
    loop();

    document.addEventListener("keydown", e=>{
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) triggerAction(e.key);
    });
  </script>
</body>
</html>
