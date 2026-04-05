// ===== POPUP =====
function popup(html, showOk = true) {
  const popupEl = document.getElementById("popup");
  const popupContent = document.getElementById("popupContent");

  let extra = "";

  // Only add default OK + canvas if wanted
  if (showOk) {
    extra = '<canvas id="graphCanvas" style="width:100%;height:200px;"></canvas><br><button id="popupOk">OK</button>';
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
function drawGraph(data, color = "#4caf50") {
  const canvas = document.getElementById("graphCanvas");
  if (!canvas || !data || data.length < 2) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(dpr,dpr);

  const padding = 40;
  const w = canvas.clientWidth - padding*2;
  const h = canvas.clientHeight - padding*2;

  let max = Math.max(...data);
  let min = Math.min(...data);
  if(max===min){ max+=1; min-=1; }

  // axes
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding+h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding, padding+h);
  ctx.lineTo(padding+w, padding+h);
  ctx.stroke();

  // y labels
  ctx.fillStyle = "#aaa";
  ctx.font = "12px Arial";
  const steps = 4;
  for(let i=0;i<=steps;i++){
    const value = min + (i/steps)*(max-min);
    const y = padding+h-(i/steps)*h;
    ctx.fillText(value.toFixed(0), 2, y+3);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding+w, y);
    ctx.stroke();
  }

  // animated line
  let progress = 0;
  function animate(){
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const maxIndex = Math.floor(progress*(data.length-1));
    for(let i=0;i<=maxIndex;i++){
      const x = padding + (i/(data.length-1))*w;
      const y = padding + h - ((data[i]-min)/(max-min))*h;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    progress += 0.04;
    if(progress<=1) requestAnimationFrame(animate);
  }
  animate();
}

// ===== PLAYER INPUT GENERATOR =====
document.getElementById("playerCount").addEventListener("change",()=>{
  const count = Number(document.getElementById("playerCount").value);
  const container = document.getElementById("playerNamesContainer");
  container.innerHTML = "";
  for(let i=0;i<count;i++){
    const div = document.createElement("div");
    div.innerHTML = `<label>Player ${i+1} Name: <input id="playerName${i}" placeholder="Player ${i+1}"/></label>`;
    container.appendChild(div);
  }
});

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

// ===== TRADE FUNCTION =====
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
  popup(`<b>${s.name}</b><br>${s.desc}<br><br><i>Price History:</i>`);
  setTimeout(()=>drawGraph(s.history,"#2196f3"),50);
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

  const lastWorth = p.history[p.history.length-1];
  const changePercent = (((total-lastWorth)/lastWorth)*100).toFixed(2);

  popup(`<b>${p.name}</b><br><br>Total Worth: $${total.toFixed(2)}<br>Change: ${changePercent}%<br><br><b>Stocks:</b><br>${stockDetails||"None"}<br><br><b>Worth History:</b>`);
  setTimeout(()=>drawGraph(p.history,p.color),50);
}

// ===== CONFIRM END =====
function confirmEndGame() {
  const popupHtml = `
    <b>Are you sure you want to end the game?</b><br><br>
    <button onclick="endGame(true)">Yes, End Game</button>
    <button onclick="document.getElementById('popup').classList.add('hidden')">Cancel</button>
  `;

  popup(popupHtml, false); // ✅ FIXED
}
