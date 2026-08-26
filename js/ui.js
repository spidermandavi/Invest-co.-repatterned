// ===== POPUP =====
function popup(html, options = {}) {
  const popupEl = document.getElementById("popup");
  const popupContent = document.getElementById("popupContent");
  if (!popupEl || !popupContent) return;

  const showOk = options.showOk !== false;
  const onClose = typeof options.onClose === "function" ? options.onClose : null;
  const showGraph = options.showGraph === true;

  let extra = "";
  if (showGraph) {
    extra += '<canvas id="graphCanvas" aria-label="Game graph"></canvas>';
  }
  if (showOk) {
    extra += '<br><button id="popupOk" type="button">OK</button>';
  }

  popupContent.innerHTML = html + extra;
  popupEl.classList.remove("hidden");

  if (showOk) {
    const okButton = document.getElementById("popupOk");
    if (okButton) {
      okButton.onclick = () => {
        closePopup();
        if (onClose) onClose();
      };
    }
  }
}

function closePopup() {
  document.getElementById("popup")?.classList.add("hidden");
}

// ===== GRAPH DRAWER =====
function prepareCanvas(canvas) {
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(canvas.clientWidth, 260);
  const height = Math.max(canvas.clientHeight, 220);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function getNiceScale(values) {
  const validValues = values.filter(Number.isFinite);
  if (validValues.length === 0) return { min: 0, max: 1, step: 1 };

  let min = Math.min(...validValues);
  let max = Math.max(...validValues);
  if (min === max) {
    const padding = Math.max(1, Math.abs(min) * 0.05);
    min -= padding;
    max += padding;
  }

  const range = max - min;
  const magnitude = 10 ** Math.floor(Math.log10(range));
  const normalized = range / magnitude;
  let niceStep = magnitude;
  if (normalized < 2) niceStep = magnitude / 2;
  else if (normalized < 5) niceStep = magnitude;

  min = Math.floor(min / niceStep) * niceStep;
  max = Math.ceil(max / niceStep) * niceStep;
  if (min === max) max = min + niceStep;

  return { min, max, step: niceStep };
}

function drawAxes(ctx, width, height, min, max, step) {
  const padding = { left: 52, right: 16, top: 18, bottom: 28 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.20)";
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.font = "12px Arial";

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotHeight);
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.stroke();

  const count = 5;
  for (let i = 0; i <= count; i += 1) {
    const value = min + (i / count) * (max - min);
    const y = padding.top + plotHeight - (i / count) * plotHeight;

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotWidth, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.fillText(formatAxisValue(value, step), 6, y + 4);
  }

  return { padding, plotWidth, plotHeight };
}

function formatAxisValue(value, step) {
  if (step >= 1) return String(Math.round(value));
  if (step >= 0.1) return value.toFixed(1);
  return value.toFixed(2);
}

function drawGraphMulti(playersToDraw) {
  const canvas = document.getElementById("graphCanvas");
  if (!canvas) return;

  const setup = prepareCanvas(canvas);
  if (!setup) return;

  const { ctx, width, height } = setup;
  const allValues = playersToDraw.flatMap(player => Array.isArray(player.history) ? player.history : []);
  const { min, max, step } = getNiceScale(allValues);
  const { padding, plotWidth, plotHeight } = drawAxes(ctx, width, height, min, max, step);

  playersToDraw.forEach(player => {
    const data = Array.isArray(player.history) ? player.history : [];
    if (data.length < 2) return;

    ctx.strokeStyle = player.color || "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding.left + (index / (data.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - ((value - min) / (max - min)) * plotHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  });
}

function drawGraphStock(history, color = "#2196f3") {
  const canvas = document.getElementById("graphCanvas");
  if (!canvas || !Array.isArray(history) || history.length < 2) return;

  const setup = prepareCanvas(canvas);
  if (!setup) return;

  const { ctx, width, height } = setup;
  const { min, max, step } = getNiceScale(history);
  const { padding, plotWidth, plotHeight } = drawAxes(ctx, width, height, min, max, step);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  history.forEach((value, index) => {
    const x = padding.left + (index / (history.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - ((value - min) / (max - min)) * plotHeight;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

// ===== SAFE INIT =====
function initUI() {
  const playerCountEl = document.getElementById("playerCount");
  const container = document.getElementById("playerNamesContainer");
  if (!playerCountEl || !container) return;

  if (container.dataset.initialized === "true") return;
  container.dataset.initialized = "true";

  const generateInputs = () => {
    const count = Number(playerCountEl.value);
    container.innerHTML = "";

    for (let i = 0; i < count; i += 1) {
      const wrapper = document.createElement("div");
      const label = document.createElement("label");
      label.textContent = `Player ${i + 1} Name: `;

      const input = document.createElement("input");
      input.id = `playerName${i}`;
      input.placeholder = `Player ${i + 1}`;
      input.maxLength = 30;
      input.autocomplete = "off";

      label.appendChild(input);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    }
  };

  playerCountEl.addEventListener("change", generateInputs);
  generateInputs();
}

// ===== TRADE MODE =====
let tradeMode = "buy";

function setTradeMode(mode) {
  if (mode !== "buy" && mode !== "sell") return;
  tradeMode = mode;

  const toggleContainer = document.getElementById("buySellToggle");
  if (!toggleContainer) return;

  toggleContainer.innerHTML = `
    <button type="button" class="${mode === "buy" ? "active" : "inactive"}" onclick="setTradeMode('buy')">BUY</button>
    <button type="button" class="${mode === "sell" ? "active" : "inactive"}" onclick="setTradeMode('sell')">SELL</button>
  `;

  renderStockTable();
}

// ===== INFO BAR =====
function renderInfoBar() {
  const infoBar = document.getElementById("infoBar");
  const player = players[currentPlayer];
  if (!infoBar || !player) return;

  const playerColor = player.color || "#ffffff";
  const nameColor = isColorDark(playerColor) ? "#ffffff" : playerColor;
  const totalWorth = calculateNetWorth(currentPlayer);

  infoBar.style.background = playerColor;
  infoBar.innerHTML = `
    Turn ${turn} | <span style="color:${nameColor}">${escapeHTML(player.name)}</span>
    | Cash: $${player.money.toFixed(2)} | Worth: $${totalWorth.toFixed(2)}
    <button id="infoBtn" type="button" style="margin-left:12px;">Info</button>
  `;

  document.getElementById("infoBtn")?.addEventListener("click", () => showPlayerInfo(currentPlayer));
}

// ===== STOCK TABLE =====
function renderStockTable() {
  const tbody = document.querySelector("#stockTable tbody");
  if (!tbody || !players[currentPlayer]) return;

  tbody.innerHTML = "";

  stocks.forEach((stock, index) => {
    const change = Number(stock.change ?? 0);
    const changeClass = change > 0 ? "green" : change < 0 ? "red" : "neutral";
    const buttonClass = tradeMode === "buy" ? "trade-buy" : "trade-sell";
    const sign = tradeMode === "buy" ? "+" : "-";

    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = stock.name;
    nameCell.className = "stock-name";
    nameCell.title = "Open stock information";
    nameCell.tabIndex = 0;
    nameCell.setAttribute("role", "button");
    nameCell.onclick = () => toggleInfo(index);
    nameCell.onkeydown = event => {
      if (event.key === "Enter" || event.key === " ") toggleInfo(index);
    };
    row.appendChild(nameCell);

    const priceCell = document.createElement("td");
    priceCell.id = `price${index}`;
    priceCell.textContent = `$${stock.price.toFixed(2)}`;
    row.appendChild(priceCell);

    const changeCell = document.createElement("td");
    changeCell.className = changeClass;
    changeCell.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;
    row.appendChild(changeCell);

    const ownedCell = document.createElement("td");
    ownedCell.textContent = String(stock.owned[currentPlayer] || 0);
    row.appendChild(ownedCell);

    const tradeCell = document.createElement("td");
    [1, 5, 10, 20, 100].forEach(amount => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = buttonClass;
      button.textContent = `${sign}${amount}`;
      button.onclick = () => trade(index, amount);
      tradeCell.appendChild(button);
    });
    row.appendChild(tradeCell);

    tbody.appendChild(row);
  });
}

// ===== RENDER =====
function render() {
  if (!players.length) return;
  renderInfoBar();
  renderStockTable();
}

// ===== HELPER =====
function isColorDark(color) {
  let value = String(color).replace("#", "");
  if (value.length === 3) value = value.split("").map(char => char + char).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return false;

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function escapeHTML(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

// ===== TRADE =====
function trade(stockIndex, amount) {
  if (!Number.isInteger(amount) || amount <= 0) return;
  if (tradeMode === "buy") buy(stockIndex, amount);
  else sell(stockIndex, amount);
}

// ===== STOCK INFO =====
function toggleInfo(index) {
  const stock = stocks[index];
  if (!stock) return;

  popup(
    `<b>${escapeHTML(stock.name)}</b><br>${escapeHTML(stock.desc)}<br><br><i>Price history:</i>`,
    { showOk: true, showGraph: true }
  );

  requestAnimationFrame(() => drawGraphStock(stock.history));
}

// ===== PLAYER INFO =====
function showPlayerInfo(playerIndex) {
  const player = players[playerIndex];
  if (!player) return;

  const total = calculateNetWorth(playerIndex);
  let stockDetails = "";

  stocks.forEach(stock => {
    const owned = stock.owned[playerIndex] || 0;
    if (owned <= 0) return;

    const spent = stock.totalSpent[playerIndex] || 0;
    const average = owned > 0 ? spent / owned : 0;
    const value = owned * stock.price;

    stockDetails += `${escapeHTML(stock.name)}: ${owned} shares, avg $${average.toFixed(2)}, current $${value.toFixed(2)}<br>`;
  });

  let changeText = "";
  if (player.history.length >= 2) {
    const previous = player.history[player.history.length - 2];
    const current = player.history[player.history.length - 1];
    const diff = current - previous;
    const percent = previous !== 0 ? (diff / previous) * 100 : 0;
    const color = diff > 0 ? "green" : diff < 0 ? "red" : "gray";

    changeText = `<br>Last recorded change: <span class="${color}">${diff >= 0 ? "+" : ""}$${diff.toFixed(2)} (${percent.toFixed(2)}%)</span>`;
  }

  let comparison = "<br><br><b>Comparison:</b><br>";
  players.forEach((other, index) => {
    if (index === playerIndex) return;
    const difference = total - calculateNetWorth(index);
    const color = difference > 0 ? "green" : difference < 0 ? "red" : "gray";
    comparison += `vs ${escapeHTML(other.name)}: <span class="${color}">${difference >= 0 ? "+" : ""}$${difference.toFixed(2)}</span><br>`;
  });

  popup(`
    <b>${escapeHTML(player.name)}</b><br>
    Total Worth: $${total.toFixed(2)}
    ${changeText}
    <br><br>
    ${stockDetails || "No stocks"}
    ${comparison}
  `, { showOk: true, showGraph: true });

  requestAnimationFrame(() => drawGraphMulti(players));
}

// ===== CONFIRM END =====
function confirmEndGame() {
  popup(`
    <b>End the game?</b><br><br>
    <button type="button" id="confirmEndYes">Yes</button>
    <button type="button" id="confirmEndNo">Cancel</button>
  `, { showOk: false });

  document.getElementById("confirmEndYes")?.addEventListener("click", () => {
    closePopup();
    endGame(true);
  });
  document.getElementById("confirmEndNo")?.addEventListener("click", closePopup);
}

// ===== DIVIDEND POPUPS =====
function showDividendPopup(playerIndex, callback) {
  const player = players[playerIndex];
  const dividends = lastDividends[playerIndex] || [];
  if (!player || dividends.length === 0) {
    if (typeof callback === "function") callback();
    return;
  }

  let total = 0;
  let html = `<h3>Dividends for ${escapeHTML(player.name)}</h3><table class="dividend-table"><thead><tr><th>Stock</th><th>Amount</th></tr></thead><tbody>`;

  dividends.forEach(dividend => {
    total += dividend.amount;
    html += `<tr><td>${escapeHTML(dividend.stock)}</td><td>$${dividend.amount.toFixed(2)}</td></tr>`;
  });

  html += `<tr><td><b>Total</b></td><td><b>$${total.toFixed(2)}</b></td></tr></tbody></table>`;

  popup(html, { onClose: callback });
}

function viewLastDividends() {
  const visibleDividends = lastDividends.filter(entries => entries.length > 0);
  if (visibleDividends.length === 0) {
    popup("No dividends have been paid yet.");
    return;
  }

  let html = "<h3>Last Dividends</h3>";
  lastDividends.forEach((entries, playerIndex) => {
    if (!entries.length || !players[playerIndex]) return;

    let total = 0;
    html += `<b>${escapeHTML(players[playerIndex].name)}</b><br>`;
    entries.forEach(entry => {
      total += entry.amount;
      html += `${escapeHTML(entry.stock)}: $${entry.amount.toFixed(2)}<br>`;
    });
    html += `<b>Total: $${total.toFixed(2)}</b><br><br>`;
  });

  popup(html);
}
