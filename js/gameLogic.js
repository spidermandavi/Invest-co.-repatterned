// ===== GAME STATE =====
let players = [];
let currentPlayer = 0;
let turn = 1;
let actionTracker = {};

let gameMode = "turns";
let modeValue = 20;

let stocks = [
  { name: "KEPL3", price: 8.21, volatility: 0.20, owned: {}, totalSpent: {}, desc: "Machinery, medium risk.", history: [] },
  { name: "KLBN4", price: 3.94, volatility: 0.15, owned: {}, totalSpent: {}, desc: "Paper, low risk.", history: [] },
  { name: "ALUP4", price: 10.99, volatility: 0.12, owned: {}, totalSpent: {}, desc: "Energy, low risk.", history: [] },
  { name: "SAPR4", price: 8.51, volatility: 0.15, owned: {}, totalSpent: {}, desc: "Water, low medium risk", history: [] },
  { name: "TASA4", price: 4.88, volatility: 0.35, owned: {}, totalSpent: {}, desc: "Guns, high volatility", history: [] },
  { name: "POMO4", price: 6.20, volatility: 0.15, owned: {}, totalSpent: {}, desc: "Buses, low medium risk.", history: [] },
  { name: "GRND3", price: 4.74, volatility: 0.10, owned: {}, totalSpent: {}, desc: "Shoes, low risk.", history: [] },
  { name: "ROMI3", price: 7.15, volatility: 0.08, owned: {}, totalSpent: {}, desc: "Machinery, low risk", history: [] },
  { name: "SOJA3", price: 7.13, volatility: 0.40, owned: {}, totalSpent: {}, desc: "Seeds, high volatility.", history: [] },
  { name: "FIQE3", price: 7.01, volatility: 0.25, owned: {}, totalSpent: {}, desc: "Internet, medium risk.", history: [] },
  { name: "BBSE3", price: 34.81, volatility: 0.10, owned: {}, totalSpent: {}, desc: "Insurance, low medium risk.", history: [] },
  { name: "CXSE3", price: 18.35, volatility: 0.10, owned: {}, totalSpent: {}, desc: "Insurance, low medium risk.", history: [] },
  { name: "BRBI11", price: 19.50, volatility: 0.28, owned: {}, totalSpent: {}, desc: "Investment Bank, medium risk.", history: [] },
  { name: "BMGB4", price: 5, volatility: 0.17, owned: {}, totalSpent: {}, desc: "Bank, low medium risk.", history: [] },
  { name: "CMIN3", price: 4.95, volatility: 0.30, owned: {}, totalSpent: {}, desc: "Mining, high medium risk.", history: [] },
  { name: "IFCM3", price: 1, volatility: 0.35, owned: {}, totalSpent: {}, desc: "E-Commerce, low high risk.", history: [] },
  { name: "PETR3", price: 53.91, volatility: 0.50, owned: {}, totalSpent: {}, desc: "Petrolium, ultra high risk.", history: [] },
  { name: "PRIO3", price: 66.21, volatility: 0.50, owned: {}, totalSpent: {}, desc: "Petrolium, ultra high risk.", history: [] }
];

let playerColors = ["#ff4c4c","#4caf50","#2196f3","#ff9800"];

// ===== START GAME =====
function startGame() {
  let count = Number(document.getElementById("playerCount").value);
  gameMode = document.getElementById("gameMode").value;
  modeValue = Number(document.getElementById("modeValue").value);

  players = [];

  for (let i = 0; i < count; i++) {
    let nameInput = document.getElementById(`playerName${i}`);
    let name = nameInput && nameInput.value ? nameInput.value : `Player ${i+1}`;

    players.push({ 
      money: 1000, 
      name: name, 
      color: playerColors[i] || "#fff",
      history: [1000]
    });
  }

  stocks.forEach(s => {
    s.history = [s.price]; // FIXED: correct initial history
    players.forEach((_, i) => {
      s.owned[i] = 0;
      s.totalSpent[i] = 0;
    });
  });

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  currentPlayer = 0;
  turn = 1;
  resetTurn();

  setTradeMode("buy"); // 🔥 IMPORTANT FIX

  render();
}

function resetTurn() { 
  actionTracker = {}; 
}

// ===== BUY / SELL =====
function buy(i, amount) {
  if (actionTracker[i] === "sell") return popup("You cannot buy and sell the same stock in one turn!");

  let s = stocks[i];
  let cost = s.price * amount;

  if (players[currentPlayer].money < cost) return popup("Not enough money");

  players[currentPlayer].money -= cost;
  s.owned[currentPlayer] += amount;
  s.totalSpent[currentPlayer] += cost;

  actionTracker[i] = "buy";

  updatePlayerHistory(currentPlayer);
  render();
}

function sell(i, amount = 1) {
  if (actionTracker[i] === "buy") return popup("You cannot buy and sell the same stock in one turn!");

  let s = stocks[i];
  let ownedAmount = Math.min(amount, s.owned[currentPlayer]);

  if (ownedAmount <= 0) return popup("No stocks to sell");

  s.owned[currentPlayer] -= ownedAmount;
  players[currentPlayer].money += s.price * ownedAmount;

  let avg = s.totalSpent[currentPlayer] / (s.owned[currentPlayer] + ownedAmount || 1);
  s.totalSpent[currentPlayer] -= avg * ownedAmount;

  actionTracker[i] = "sell";

  updatePlayerHistory(currentPlayer);
  render();
}

// ===== PLAYER HISTORY =====
function updatePlayerHistory(playerIndex) {
  let total = players[playerIndex].money;
  stocks.forEach(s => total += s.owned[playerIndex] * s.price);
  players[playerIndex].history.push(total);
}

// ===== TURN SYSTEM =====
function endTurn() {
  currentPlayer++;

  if (currentPlayer >= players.length) {
    currentPlayer = 0;
    turn++;

    updateMarket();
    applyDividends();
    randomEvent();

    players.forEach((p, i) => updatePlayerHistory(i));
  }

  resetTurn();

  if (players[currentPlayer].money < 0) forceSell();

  checkWin();
  render();
}

// ===== MARKET =====
function updateMarket() {
  stocks.forEach(s => {
    let change = (Math.random()*2-1)*s.volatility*s.price;
    s.price += change;
    s.price = Math.max(1, Math.min(500, s.price));
    s.change = change;
    s.history.push(s.price);
  });
}

// ===== DIVIDENDS =====
function applyDividends() {
  players.forEach((p, pi)=>{
    stocks.forEach(s=>{
      let owned = s.owned[pi];
      let value = owned*s.price;

      let rate=0;
      if(owned>=2000) rate=0.2;
      else if(owned>=1000) rate=0.1;
      else if(owned>=500) rate=0.075;
      else if(owned>=100) rate=0.05;
      else if(owned>=50) rate=0.025;
      else if(owned>10) rate=0.005;

      p.money += value*rate;
    });
  });
}

// ===== RANDOM EVENTS =====
function flashPlayer(index, color = "#ffff00", duration = 800){
  const playerEl = document.getElementById(`player${index}`);
  if(!playerEl) return;

  const originalBg = playerEl.style.backgroundColor;
  playerEl.style.backgroundColor = color;

  setTimeout(() => playerEl.style.backgroundColor = originalBg || "", duration);
}

function randomEvent(){
  if(turn < 10) return;            
  if(Math.random() > 0.2) return;

  let events = [
    {text:"Crashed car", value:-300, weight:1},
    {text:"Gift", value:200, weight:3},
    {text:"Repairs", value:-100, weight:2},
    {text:"Clothes", value:-50, weight:4},
    {text:"Phone broken", value:-240, weight:2},
    {text:"Birthday", value:75, weight:3},
    {text:"Furniture", value:-300, weight:1},
    {text:"Flowers", value:-20, weight:5},
    {text:"Tax return", value:150, weight:3}
  ];

  let weightedEvents = [];
  events.forEach(e => { 
    for(let w=0; w<e.weight; w++) weightedEvents.push(e); 
  });

  let i = Math.floor(Math.random() * players.length);
  let player = players[i];
  let e = weightedEvents[Math.floor(Math.random() * weightedEvents.length)];

  player.money += e.value;

  flashPlayer(i, e.value >= 0 ? "#4caf50" : "#ff4c4c", 1000);
  popup(`Event for ${player.name}: ${e.text}<br>${e.value >= 0 ? "+" : ""}$${e.value}`);
}

// ===== WIN SYSTEM =====
function checkWin(){
  if(gameMode==="turns" && turn>modeValue) return endGame(true);
  if(gameMode==="money" && players.some(p=>p.money>=modeValue)) return endGame(true);
}

function endGame(force=false){
  if(force){
    let scores = players.map((p,i)=>{
      let total = p.money;
      stocks.forEach(s=> total += s.owned[i] * s.price);
      let earned = total - 1000;
      return { total, earned, name: p.name, color: p.color, history: p.history };
    });

    scores.sort((a,b)=>b.total-a.total);
    showPodium(scores);

  } else {
    resetGame();
  }
}

// ===== RESET =====
function resetGame(){
  document.getElementById('setup').classList.remove('hidden');
  document.getElementById('game').classList.add('hidden');

  players=[]; 
  currentPlayer=0; 
  turn=1; 
  actionTracker={};
}

// ===== FORCE SELL =====
function forceSell(){
  const p = players[currentPlayer];

  let totalStocks = stocks.reduce((acc,s)=> acc + s.owned[currentPlayer],0);
  if(totalStocks===0) return;

  popup(`${p.name} has negative money! Selling stocks to cover debt.`);

  stocks.forEach((s,i)=>{
    while(s.owned[currentPlayer]>0 && p.money<0){
      sell(i,1);
    }
  });
}
// ===== SHOW PODIUM =====
function showPodium(scores){
  // Hide game screen
  document.getElementById("game").classList.add("hidden");

  // Show podium
  document.getElementById("podium").classList.remove("hidden");

  const first = document.getElementById("firstPlace");
  const second = document.getElementById("secondPlace");
  const third = document.getElementById("thirdPlace");

  // Clear previous
  first.innerHTML = "";
  second.innerHTML = "";
  third.innerHTML = "";

  // Assign winners
  if(scores[0]){
    first.innerHTML = `
      🥇<br>
      <b>${scores[0].name}</b><br>
      $${scores[0].total.toFixed(2)}
    `;
    first.style.background = scores[0].color;
  }

  if(scores[1]){
    second.innerHTML = `
      🥈<br>
      <b>${scores[1].name}</b><br>
      $${scores[1].total.toFixed(2)}
    `;
    second.style.background = scores[1].color;
  }

  if(scores[2]){
    third.innerHTML = `
      🥉<br>
      <b>${scores[2].name}</b><br>
      $${scores[2].total.toFixed(2)}
    `;
    third.style.background = scores[2].color;
  }
}
