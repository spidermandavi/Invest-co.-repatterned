// ===== POPUP =====
function popup(html, options = {}) {
  const popupEl = document.getElementById("popup");
  const popupContent = document.getElementById("popupContent");

  const showOk = options.showOk ?? true;
  const showGraph = options.showGraph ?? false;

  let extra = "";

  if (showGraph) {
    extra += '<canvas id="graphCanvas" style="width:100%;height:200px;"></canvas><br>';
  }

  if (showOk) {
    extra += '<button id="popupOk">OK</button>';
  }

  popupContent.innerHTML = html + extra;
  popupEl.classList.remove("hidden");

  if (showOk) {
    document.getElementById("popupOk").onclick = () => {
      popupEl.classList.add("hidden");
    };
  }
}

// ===== GRAPH DRAWER =====
function drawGraphMulti(players) {
  const canvas = document.getElementById("graphCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(dpr,dpr);

  const padding = 40;
  const w = canvas.clientWidth - padding*2;
  const h = canvas.clientHeight - padding*2;

  // ===== COLLECT ALL VALUES =====
  let allValues = [];
  players.forEach(p => {
    if (p.history) allValues.push(...p.history);
  });

  let min = Math.min(...allValues);
  let max = Math.max(...allValues);

  if (min === max) {
    min -= 1;
    max += 1;
  }

  // ===== NICE ROUNDING =====
  const range = max - min;
  const step = Math.pow(10, Math.floor(Math.log10(range))) / 2;

  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;

  // ===== AXES =====
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding, padding + h);
  ctx.lineTo(padding + w, padding + h);
  ctx.stroke();

  // ===== GRID + LABELS =====
  ctx.fillStyle = "#aaa";
  ctx.font = "12px Arial";

  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const value = min + (i / steps) * (max - min);
    const y = padding + h - (i / steps) * h;

    // Rounded labels
    ctx.fillText(Math.round(value / step) * step, 5, y + 3);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + w, y);
    ctx.stroke();
  }

  // ===== DRAW LINES =====
  players.forEach(p => {
    const data = p.history;
    if (!data || data.length < 2) return;

    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((val, i) => {
      const x = padding + (i / (data.length - 1)) * w;
      const y = padding + h - ((val - min) / (max - min)) * h;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  });
}

// ===== SAFE INIT (FIXED BUG HERE) =====
function initUI() {
  const playerCountEl = document.getElementById("playerCount");
  const container = document.getElementById("playerNamesContainer");

  if (!playerCountEl || !container) return;

  function generateInputs(){
    const count = Number(playerCountEl.value);
    container.innerHTML = "";

    for(let i=0;i<count;i++){
      const div = document.createElement("div");
      div.innerHTML = `<label>Player ${i+1} Name: <input id="playerName${i}" placeholder="Player ${i+1}"/></label>`;
      container.appendChild(div);
    }
  }

  playerCountEl.addEventListener("change", generateInputs);

  // initial run
  generateInputs();
}

// ===== TRADE MODE TOGGLE =====
let tradeMode = "buy";

function setTradeMode(mode){
  tradeMode = mode;
  const toggleContainer = document.getElementById("buySellToggle");
  if(!toggleContainer) return;

  toggleContainer.innerHTML = `
    <button class="${mode==='buy'?'active':'inactive'}" onclick="setTradeMode('buy')">BUY</button>
    <button class="${mode==='sell'?'active':'inactive'}" onclick="setTradeMode('sell')">SELL</button>
  `;

  renderStockTable();
}

// ===== INFO BAR =====
function renderInfoBar(){
  const infoBar = document.getElementById("infoBar");
  const playerColor = players[currentPlayer].color;
  const nameColor = isColorDark(playerColor) ? "#ffffff" : playerColor;

  infoBar.innerHTML = `
    Turn ${turn} | <span style="color:${nameColor}">${players[currentPlayer].name}</span> | Money: $${players[currentPlayer].money.toFixed(2)}
    <button id="infoBtn" style="margin-left:20px;">Info</button>
  `;
  infoBar.style.background = playerColor;

  document.getElementById("infoBtn").onclick = ()=>showPlayerInfo(currentPlayer);
}

// ===== STOCK TABLE =====
function renderStockTable(){
  const tbody = document.querySelector("#stockTable tbody");
  tbody.innerHTML = "";

  stocks.forEach((s,i)=>{
    const change = s.change ?? 0;
    const changeClass = change>0?"green":change<0?"red":"neutral";

    const btnColor = tradeMode==="buy"?"#4caf50":"#f44336";
    const sign = tradeMode==="buy"?"+":"-";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td onclick="toggleInfo(${i})" style="cursor:pointer;text-decoration:underline;">${s.name}</td>
      <td id="price${i}">$${s.price.toFixed(2)}</td>
      <td class="${changeClass}">${change.toFixed(2)}</td>
      <td>${s.owned[currentPlayer]}</td>
      <td>
        ${[1,5,10,20,100].map(n=>`<button style="background:${btnColor};color:#fff;" onclick="trade(${i},${n})">${sign}${n}</button>`).join("")}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ===== RENDER =====
function render(){
  renderInfoBar();
  renderStockTable();
}

// ===== HELPER =====
function isColorDark(color){
  let c = color.replace("#","");
  if(c.length===3) c=c.split("").map(x=>x+x).join("");
  const r=parseInt(c.substr(0,2),16);
  const g=parseInt(c.substr(2,2),16);
  const b=parseInt(c.substr(4,2),16);
  const brightness = (r*299+g*587+b*114)/1000;
  return brightness<140;
}

// ===== TRADE =====
function trade(stockIndex, amount){
  const stock = stocks[stockIndex];
  if(tradeMode==="buy") buy(stockIndex,amount);
  else{
    let sellAmount = Math.min(amount,stock.owned[currentPlayer]);
    if(sellAmount>0) sell(stockIndex,sellAmount);
    else popup("You don't own enough shares.");
  }
  renderStockTable();
}

// ===== STOCK INFO =====
function toggleInfo(i){
  const s = stocks[i];
  popup(`<b>${s.name}</b><br>${s.desc}<br><br><i>Price History:</i>`, { showOk: true, showGraph: true });
  setTimeout(()=>drawGraphStock(s.history,"#2196f3"),50);
}

// ===== PLAYER INFO =====
function showPlayerInfo(playerIndex){
  const p = players[playerIndex];

  let total = p.money;
  let stockDetails = "";

  stocks.forEach(s=>{
    total += s.owned[playerIndex]*s.price;

    if(s.owned[playerIndex]>0){
      const avg = (s.totalSpent[playerIndex]/s.owned[playerIndex]).toFixed(2);
      const value = (s.owned[playerIndex]*s.price).toFixed(2);

      stockDetails += `${s.name}: ${s.owned[playerIndex]} shares, avg $${avg}, current $${value}<br>`;
    }
  });

  // ===== CHANGE CALCULATION =====
  let changeText = "";
  if (p.history && p.history.length >= 2) {
    const prev = p.history[p.history.length - 2];
    const curr = p.history[p.history.length - 1];

    const diff = curr - prev;
    const percent = (diff / prev) * 100;

    const color = diff > 0 ? "green" : diff < 0 ? "red" : "gray";

    changeText = `<br>Change: <span style="color:${color}">
      ${diff >= 0 ? "+" : ""}$${diff.toFixed(2)} (${percent.toFixed(2)}%)
    </span>`;
  }

  // ===== DIFFERENCE VS OTHERS =====
  let comparison = "<br><br><b>Comparison:</b><br>";

  players.forEach((other, i)=>{
    if(i === playerIndex) return;

    let otherTotal = other.money;
    stocks.forEach(s=>{
      otherTotal += s.owned[i]*s.price;
    });

    const diff = total - otherTotal;
    const color = diff > 0 ? "green" : diff < 0 ? "red" : "gray";

    comparison += `
      vs ${other.name}: 
      <span style="color:${color}">
        ${diff >= 0 ? "+" : ""}$${diff.toFixed(2)}
      </span><br>
    `;
  });

  popup(`
    <b>${p.name}</b><br>
    Total Worth: $${total.toFixed(2)}
    ${changeText}
    <br><br>
    ${stockDetails || "No stocks"}
    ${comparison}
  `, { showOk: true, showGraph: true });

  setTimeout(()=>drawGraphMulti(players), 50);
}

// ===== CONFIRM END =====
function confirmEndGame() {
  popup(`
    <b>End the game?</b><br><br>
    <button onclick="endGame(true)">Yes</button>
    <button onclick="document.getElementById('popup').classList.add('hidden')">Cancel</button>
  `, { showOk: false });
}
