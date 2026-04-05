// ===== POPUP =====
function popup(html) {
  const popupEl = document.getElementById("popup");
  const popupContent = document.getElementById("popupContent");

  popupContent.innerHTML = html + '<br><button id="popupOk">OK</button>';

  popupEl.classList.remove("hidden");

  document.getElementById("popupOk").onclick = () => {
    popupEl.classList.add("hidden");
  };
}

// ===== GRAPH =====
function drawGraph(data, color = "#4caf50") {
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "200px";

  document.getElementById("popupContent").prepend(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  const padding = 40;
  const w = canvas.clientWidth - padding*2;
  const h = canvas.clientHeight - padding*2;

  let max = Math.max(...data);
  let min = Math.min(...data);
  if(max===min){ max+=1; min-=1; }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  data.forEach((v,i)=>{
    const x = padding + (i/(data.length-1))*w;
    const y = padding + h - ((v-min)/(max-min))*h;
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });

  ctx.stroke();
}

// ===== PLAYER INPUTS =====
document.getElementById("playerCount").addEventListener("change",()=>{
  const count = Number(document.getElementById("playerCount").value);
  const container = document.getElementById("playerNamesContainer");
  container.innerHTML = "";

  for(let i=0;i<count;i++){
    const div = document.createElement("div");
    div.innerHTML = `<input id="playerName${i}" placeholder="Player ${i+1}"/>`;
    container.appendChild(div);
  }
});

// ===== TRADE MODE =====
let tradeMode = "buy";

function setTradeMode(mode){
  tradeMode = mode;

  const toggle = document.getElementById("buySellToggle");

  toggle.innerHTML = `
    <button class="${mode==='buy'?'active':'inactive'}" onclick="setTradeMode('buy')">BUY</button>
    <button class="${mode==='sell'?'active':'inactive'}" onclick="setTradeMode('sell')">SELL</button>
  `;

  renderStockTable();
}

// ===== INFO BAR =====
function renderInfoBar(){
  const infoBar = document.getElementById("infoBar");
  const p = players[currentPlayer];

  infoBar.innerHTML = `
    Turn ${turn} | ${p.name} | $${p.money.toFixed(2)}
    <button onclick="showPlayerInfo(${currentPlayer})">Info</button>
  `;

  infoBar.style.background = p.color;
}

// ===== STOCK TABLE =====
function renderStockTable(){
  const tbody = document.querySelector("#stockTable tbody");
  tbody.innerHTML = "";

  stocks.forEach((s,i)=>{
    const change = s.change ?? 0;
    const btnColor = tradeMode==="buy"?"#4caf50":"#f44336";
    const sign = tradeMode==="buy"?"+":"-";

    const row = document.createElement("tr");

    row.innerHTML = `
      <td onclick="toggleInfo(${i})">${s.name}</td>
      <td>$${s.price.toFixed(2)}</td>
      <td>${change.toFixed(2)}</td>
      <td>${s.owned[currentPlayer]}</td>
      <td>
        ${[1,5,10,20].map(n=>`<button style="background:${btnColor}" onclick="trade(${i},${n})">${sign}${n}</button>`).join("")}
      </td>
    `;

    tbody.appendChild(row);
  });
}

// ===== MAIN RENDER =====
function render(){
  renderInfoBar();
  renderStockTable();
}

// ===== TRADE =====
function trade(i, amount){
  if(tradeMode==="buy") buy(i,amount);
  else sell(i,amount);
}

// ===== INFO =====
function toggleInfo(i){
  popup(`<b>${stocks[i].name}</b><br>${stocks[i].desc}`);
  setTimeout(()=>drawGraph(stocks[i].history),50);
}

function showPlayerInfo(i){
  const p = players[i];
  popup(`<b>${p.name}</b><br>Money: $${p.money}`);
  setTimeout(()=>drawGraph(p.history,p.color),50);
}

// ===== CONFIRM END =====
function confirmEndGame(){
  popup(`
    End game?<br><br>
    <button onclick="endGame(true)">Yes</button>
  `);
}
