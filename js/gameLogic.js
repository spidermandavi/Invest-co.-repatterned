// ===== GAME STATE =====
let lastDividends = [];
let players = [];
let currentPlayer = 0;
let turn = 1;
let actionTracker = {};
let gameMode = "turns";
let modeValue = 20;
let gameOver = false;

const playerColors = ["#ff4c4c", "#4caf50", "#2196f3", "#ff9800"];

const stocks = [
  { name: "KEPL3", initialPrice: 8.21, price: 8.21, volatility: 0.20, dividend: 0.09, owned: {}, totalSpent: {}, desc: "Machinery, medium risk. 9% dividend", history: [] },
  { name: "KLBN4", initialPrice: 3.94, price: 3.94, volatility: 0.15, dividend: 0.06, owned: {}, totalSpent: {}, desc: "Paper, low risk. 6% dividend", history: [] },
  { name: "ALUP4", initialPrice: 10.99, price: 10.99, volatility: 0.12, dividend: 0.06, owned: {}, totalSpent: {}, desc: "Energy, low risk. 6% dividend", history: [] },
  { name: "SAPR4", initialPrice: 8.51, price: 8.51, volatility: 0.15, dividend: 0.05, owned: {}, totalSpent: {}, desc: "Water, low-medium risk. 5% dividend", history: [] },
  { name: "TASA4", initialPrice: 4.88, price: 4.88, volatility: 0.35, dividend: 0.06, owned: {}, totalSpent: {}, desc: "Defense, high volatility. 6% dividend", history: [] },
  { name: "POMO4", initialPrice: 6.20, price: 6.20, volatility: 0.15, dividend: 0.09, owned: {}, totalSpent: {}, desc: "Buses, low-medium risk. 9% dividend", history: [] },
  { name: "GRND3", initialPrice: 4.74, price: 4.74, volatility: 0.10, dividend: 0.10, owned: {}, totalSpent: {}, desc: "Shoes, low risk. 10% dividend", history: [] },
  { name: "ROMI3", initialPrice: 7.15, price: 7.15, volatility: 0.08, dividend: 0.10, owned: {}, totalSpent: {}, desc: "Machinery, low risk. 10% dividend", history: [] },
  { name: "SOJA3", initialPrice: 7.13, price: 7.13, volatility: 0.40, dividend: 0.02, owned: {}, totalSpent: {}, desc: "Seeds, high volatility. 2% dividend", history: [] },
  { name: "FIQE3", initialPrice: 7.01, price: 7.01, volatility: 0.25, dividend: 0.07, owned: {}, totalSpent: {}, desc: "Internet, medium risk. 7% dividend", history: [] },
  { name: "BBSE3", initialPrice: 34.81, price: 34.81, volatility: 0.10, dividend: 0.12, owned: {}, totalSpent: {}, desc: "Insurance, low-medium risk. 12% dividend", history: [] },
  { name: "CXSE3", initialPrice: 18.35, price: 18.35, volatility: 0.10, dividend: 0.08, owned: {}, totalSpent: {}, desc: "Insurance, low-medium risk. 8% dividend", history: [] },
  { name: "BRBI11", initialPrice: 19.50, price: 19.50, volatility: 0.28, dividend: 0.10, owned: {}, totalSpent: {}, desc: "Investment Bank, medium risk. 10% dividend", history: [] },
  { name: "BMGB4", initialPrice: 5.00, price: 5.00, volatility: 0.17, dividend: 0.10, owned: {}, totalSpent: {}, desc: "Bank, low-medium risk. 10% dividend", history: [] },
  { name: "CMIN3", initialPrice: 4.95, price: 4.95, volatility: 0.30, dividend: 0.08, owned: {}, totalSpent: {}, desc: "Mining, high-medium risk. 8% dividend", history: [] },
  { name: "IFCM3", initialPrice: 1.00, price: 1.00, volatility: 0.35, dividend: 0.00, owned: {}, totalSpent: {}, desc: "E-Commerce, high risk. 0% dividend", history: [] },
  { name: "PETR3", initialPrice: 53.91, price: 53.91, volatility: 0.50, dividend: 0.08, owned: {}, totalSpent: {}, desc: "Petroleum, ultra-high risk. 8% dividend", history: [] },
  { name: "PRIO3", initialPrice: 66.21, price: 66.21, volatility: 0.50, dividend: 0.00, owned: {}, totalSpent: {}, desc: "Petroleum, ultra-high risk. 0% dividend", history: [] }
];

function calculateNetWorth(playerIndex) {
  if (!players[playerIndex]) return 0;
  let total = players[playerIndex].money;
  stocks.forEach(stock => {
    total += (stock.owned[playerIndex] || 0) * stock.price;
  });
  return total;
}

function resetStockState() {
  stocks.forEach(stock => {
    stock.price = stock.initialPrice;
    stock.change = 0;
    stock.history = [stock.price];
    stock.owned = {};
    stock.totalSpent = {};
  });
}

function resetGameState() {
  players = [];
  currentPlayer = 0;
  turn = 1;
  actionTracker = {};
  lastDividends = [];
  gameMode = "turns";
  modeValue = 20;
  gameOver = false;
  resetStockState();
}

// ===== START GAME =====
function startGame() {
  const playerCountEl = document.getElementById("playerCount");
  const gameModeEl = document.getElementById("gameMode");
  const modeValueEl = document.getElementById("modeValue");

  const count = Number(playerCountEl?.value);
  const selectedMode = gameModeEl?.value;
  const rawModeValue = Number(modeValueEl?.value);

  if (!Number.isInteger(count) || count < 2 || count > 4) {
    popup("Please choose between 2 and 4 players.");
    return false;
  }

  if (!["turns", "money"].includes(selectedMode)) {
    popup("Please choose a valid game mode.");
    return false;
  }

  if (!Number.isFinite(rawModeValue) || rawModeValue <= 0) {
    popup(selectedMode === "turns"
      ? "Please enter a number of turns greater than 0."
      : "Please enter a target amount greater than $0.");
    return false;
  }

  if (selectedMode === "turns" && !Number.isInteger(rawModeValue)) {
    popup("Turn mode requires a whole number of turns.");
    return false;
  }

  gameMode = selectedMode;
  modeValue = rawModeValue;
  players = [];
  currentPlayer = 0;
  turn = 1;
  gameOver = false;
  lastDividends = [];
  resetTurn();
  resetStockState();

  for (let i = 0; i < count; i++) {
    const nameInput = document.getElementById(`playerName${i}`);
    const enteredName = nameInput?.value?.trim() || `Player ${i + 1}`;
    const name = enteredName.slice(0, 30);

    players.push({
      money: 1000,
      name,
      color: playerColors[i] || "#ffffff",
      history: [1000]
    });
  }

  stocks.forEach(stock => {
    players.forEach((_, index) => {
      stock.owned[index] = 0;
      stock.totalSpent[index] = 0;
    });
  });

  document.getElementById("setup")?.classList.add("hidden");
  document.getElementById("podium")?.classList.add("hidden");
  document.getElementById("game")?.classList.remove("hidden");

  setTradeMode("buy");
  render();
  return true;
}

function resetTurn() {
  actionTracker = {};
}

// ===== BUY / SELL =====
function buy(stockIndex, amount) {
  if (gameOver) return;
  const stock = stocks[stockIndex];
  const player = players[currentPlayer];
  const quantity = Number(amount);

  if (!stock || !player || !Number.isInteger(quantity) || quantity <= 0) return;
  if (actionTracker[stockIndex] === "sell") {
    popup("You cannot buy and sell the same stock in one turn!");
    return;
  }

  const cost = stock.price * quantity;
  if (player.money < cost) {
    popup("Not enough money for that purchase.");
    return;
  }

  player.money -= cost;
  stock.owned[currentPlayer] += quantity;
  stock.totalSpent[currentPlayer] += cost;
  actionTracker[stockIndex] = "buy";
  render();
}

function sell(stockIndex, amount = 1) {
  if (gameOver) return;
  const stock = stocks[stockIndex];
  const player = players[currentPlayer];
  const quantity = Number(amount);

  if (!stock || !player || !Number.isInteger(quantity) || quantity <= 0) return;
  if (actionTracker[stockIndex] === "buy") {
    popup("You cannot buy and sell the same stock in one turn!");
    return;
  }

  const ownedAmount = Math.min(quantity, stock.owned[currentPlayer] || 0);
  if (ownedAmount <= 0) {
    popup("You do not own enough shares to sell that amount.");
    return;
  }

  const previousOwned = stock.owned[currentPlayer];
  const averageCost = previousOwned > 0
    ? stock.totalSpent[currentPlayer] / previousOwned
    : 0;

  stock.owned[currentPlayer] -= ownedAmount;
  stock.totalSpent[currentPlayer] = Math.max(
    0,
    stock.totalSpent[currentPlayer] - averageCost * ownedAmount
  );
  player.money += stock.price * ownedAmount;
  actionTracker[stockIndex] = "sell";
  render();
}

// ===== PLAYER HISTORY =====
function updatePlayerHistory(playerIndex) {
  if (!players[playerIndex]) return;
  const total = calculateNetWorth(playerIndex);
  const history = players[playerIndex].history;

  if (history.length === 0 || history[history.length - 1] !== total) {
    history.push(total);
  }
}

function updateAllPlayerHistory() {
  players.forEach((_, index) => updatePlayerHistory(index));
}

// ===== TURN SYSTEM =====
function endTurn() {
  if (gameOver || players.length === 0) return;

  currentPlayer += 1;

  if (currentPlayer < players.length) {
    resetTurn();
    render();
    return;
  }

  currentPlayer = 0;
  turn += 1;
  resetTurn();
  updateMarket();

  // End-of-round events are deliberately sequenced so one popup cannot overwrite another.
  applyDividends(() => {
    randomEvent(() => {
      players.forEach((_, index) => {
        if (players[index].money < 0) forceSell(index);
      });

      updateAllPlayerHistory();

      if (checkWin()) return;
      render();
    });
  });
}

// ===== MARKET =====
function updateMarket() {
  stocks.forEach(stock => {
    const change = (Math.random() * 2 - 1) * stock.volatility * stock.price;
    const nextPrice = stock.price + change;

    stock.price = Math.max(1, Math.min(500, nextPrice));
    stock.change = stock.price - (stock.history[stock.history.length - 1] ?? stock.price);
    stock.history.push(stock.price);
  });
}

// ===== DIVIDENDS =====
function applyDividends(onComplete) {
  lastDividends = players.map(() => []);

  players.forEach((player, playerIndex) => {
    stocks.forEach(stock => {
      const owned = stock.owned[playerIndex] || 0;
      if (owned <= 0 || stock.dividend <= 0) return;

      const amount = owned * stock.price * stock.dividend;
      player.money += amount;
      lastDividends[playerIndex].push({ stock: stock.name, amount });
    });
  });

  let playerIndex = 0;
  const showNext = () => {
    while (playerIndex < players.length && lastDividends[playerIndex].length === 0) {
      playerIndex += 1;
    }

    if (playerIndex >= players.length) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const index = playerIndex;
    playerIndex += 1;
    showDividendPopup(index, showNext);
  };

  showNext();
}

// ===== RANDOM EVENTS =====
function flashPlayer(index, color = "#ffff00", duration = 800) {
  const playerEl = document.getElementById(`player${index}`);
  if (!playerEl) return;

  const originalBackground = playerEl.style.backgroundColor;
  playerEl.style.backgroundColor = color;
  setTimeout(() => {
    playerEl.style.backgroundColor = originalBackground || "";
  }, duration);
}

function randomEvent(onComplete) {
  if (turn < 10 || Math.random() > 0.2 || players.length === 0) {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  const events = [
    { text: "Crashed car", value: -300, weight: 1 },
    { text: "Gift", value: 200, weight: 3 },
    { text: "Repairs", value: -100, weight: 2 },
    { text: "Clothes", value: -50, weight: 4 },
    { text: "Phone broken", value: -240, weight: 2 },
    { text: "Birthday", value: 75, weight: 3 },
    { text: "Furniture", value: -300, weight: 1 },
    { text: "Flowers", value: -20, weight: 5 },
    { text: "Tax return", value: 150, weight: 3 }
  ];

  const weightedEvents = [];
  events.forEach(event => {
    for (let weight = 0; weight < event.weight; weight += 1) weightedEvents.push(event);
  });

  const playerIndex = Math.floor(Math.random() * players.length);
  const player = players[playerIndex];
  const event = weightedEvents[Math.floor(Math.random() * weightedEvents.length)];

  player.money += event.value;
  flashPlayer(playerIndex, event.value >= 0 ? "#4caf50" : "#ff4c4c", 1000);

  popup(
    `Event for <b>${escapeHTML(player.name)}</b>: ${escapeHTML(event.text)}<br>` +
    `${event.value >= 0 ? "+" : ""}$${event.value.toFixed(2)}`,
    {
      onClose: typeof onComplete === "function" ? onComplete : undefined
    }
  );
}

// ===== WIN SYSTEM =====
function checkWin() {
  if (gameOver || players.length === 0) return false;

  if (gameMode === "turns" && turn >= modeValue) {
    endGame(true);
    return true;
  }

  if (gameMode === "money" && players.some((_, index) => calculateNetWorth(index) >= modeValue)) {
    endGame(true);
    return true;
  }

  return false;
}

function endGame(force = false) {
  if (!force) {
    resetGame();
    return;
  }

  gameOver = true;

  const scores = players.map((player, index) => {
    const total = calculateNetWorth(index);
    return {
      total,
      earned: total - 1000,
      name: player.name,
      color: player.color,
      history: [...player.history]
    };
  }).sort((a, b) => b.total - a.total);

  showPodium(scores);
}

// ===== RESET =====
function resetGame() {
  document.getElementById("setup")?.classList.remove("hidden");
  document.getElementById("game")?.classList.add("hidden");
  document.getElementById("podium")?.classList.add("hidden");
  resetGameState();
  if (typeof initUI === "function") initUI();
}

// ===== FORCE SELL =====
function forceSell(playerIndex = currentPlayer) {
  const player = players[playerIndex];
  if (!player || player.money >= 0) return;

  for (const stock of stocks) {
    while ((stock.owned[playerIndex] || 0) > 0 && player.money < 0) {
      const owned = stock.owned[playerIndex];
      const averageCost = owned > 0 ? stock.totalSpent[playerIndex] / owned : 0;
      stock.owned[playerIndex] -= 1;
      stock.totalSpent[playerIndex] = Math.max(0, stock.totalSpent[playerIndex] - averageCost);
      player.money += stock.price;
    }

    if (player.money >= 0) break;
  }

  if (player.money < 0) {
    popup(`${escapeHTML(player.name)} still owes $${Math.abs(player.money).toFixed(2)} after selling all available shares.`);
  }
}

// ===== SHOW PODIUM =====
function showPodium(scores) {
  document.getElementById("game")?.classList.add("hidden");
  document.getElementById("podium")?.classList.remove("hidden");

  const positions = [
    { id: "firstPlace", medal: "🥇" },
    { id: "secondPlace", medal: "🥈" },
    { id: "thirdPlace", medal: "🥉" }
  ];

  positions.forEach(({ id }) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = "";
    element.style.background = "";
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "";
  });

  positions.forEach(({ id, medal }, index) => {
    const score = scores[index];
    const element = document.getElementById(id);
    if (!score || !element) return;

    element.innerHTML = `
      ${medal}<br>
      <b>${escapeHTML(score.name)}</b><br>
      $${score.total.toFixed(2)}
    `;
    element.style.background = score.color;
  });
}

// ===== RESET PODIUM / BACK TO MENU =====
function resetPodium() {
  document.getElementById("podium")?.classList.add("hidden");
  document.getElementById("game")?.classList.add("hidden");
  document.getElementById("setup")?.classList.remove("hidden");
  resetGameState();
  if (typeof initUI === "function") initUI();
}
