// ===== ADVANCED GAME FEATURES =====
// This file layers the new systems onto the cleaned core game engine.

const SAVE_KEY = "investCoSavedGameV2";
const MARKET_FEATURE_VERSION = 2;

let marketState = {
  sentiment: 0,
  trend: 0,
  sectorTrends: {},
  news: [],
  rounds: 0,
  bestStock: null
};

let featureStats = {
  transactions: [],
  events: 0,
  marketEvents: 0,
  personalEvents: 0,
  dividendsReceived: [],
  totalTradingVolume: [],
  realizedProfit: []
};

const SECTOR_MAP = {
  KEPL3: "Industrials", KLBN4: "Materials", ALUP4: "Utilities", SAPR4: "Utilities",
  TASA4: "Defense", POMO4: "Industrials", GRND3: "Consumer", ROMI3: "Industrials",
  SOJA3: "Agriculture", FIQE3: "Technology", BBSE3: "Finance", CXSE3: "Finance",
  BRBI11: "Finance", BMGB4: "Finance", CMIN3: "Materials", IFCM3: "Technology",
  PETR3: "Energy", PRIO3: "Energy"
};

const EVENT_DEFINITIONS = [
  { type: "market", title: "Global Risk-Off", text: "Investors become cautious and broad markets fall.", impact: -0.08, weight: 2 },
  { type: "market", title: "Bull Market", text: "Confidence rises and most sectors rally.", impact: 0.07, weight: 2 },
  { type: "sector", sector: "Energy", title: "Oil Surge", text: "Energy demand and prices jump.", impact: 0.18, weight: 2 },
  { type: "sector", sector: "Technology", title: "Tech Boom", text: "New technology spending boosts growth companies.", impact: 0.16, weight: 2 },
  { type: "sector", sector: "Agriculture", title: "Strong Harvest", text: "Excellent crop conditions help agriculture stocks.", impact: 0.15, weight: 2 },
  { type: "sector", sector: "Materials", title: "Commodity Rally", text: "Commodity prices improve the outlook for materials companies.", impact: 0.12, weight: 2 },
  { type: "sector", sector: "Finance", title: "Credit Expansion", text: "Improved lending conditions support financial stocks.", impact: 0.10, weight: 2 },
  { type: "personal", title: "Unexpected Bonus", text: "A bonus arrives at exactly the right time.", value: 180, weight: 3 },
  { type: "personal", title: "Repair Bill", text: "An expensive repair needs to be paid.", value: -140, weight: 2 },
  { type: "personal", title: "Gift", text: "A generous gift boosts your cash balance.", value: 120, weight: 3 },
  { type: "personal", title: "Tax Payment", text: "An unexpected tax payment reduces your cash.", value: -170, weight: 2 },
  { type: "personal", title: "Lucky Find", text: "You recover some forgotten money.", value: 75, weight: 4 }
];

function ensureFeatureState() {
  const sectors = [...new Set(Object.values(SECTOR_MAP))];
  sectors.forEach(sector => {
    if (!Number.isFinite(marketState.sectorTrends[sector])) marketState.sectorTrends[sector] = 0;
  });
  while (marketState.news.length > 8) marketState.news.pop();
  if (!Array.isArray(featureStats.transactions)) featureStats.transactions = [];
  if (!Array.isArray(featureStats.dividendsReceived)) featureStats.dividendsReceived = [];
  if (!Array.isArray(featureStats.totalTradingVolume)) featureStats.totalTradingVolume = [];
  if (!Array.isArray(featureStats.realizedProfit)) featureStats.realizedProfit = [];
}

function resetFeatureState() {
  marketState = { sentiment: 0, trend: 0, sectorTrends: {}, news: [], rounds: 0, bestStock: null };
  featureStats = {
    transactions: [],
    events: 0,
    marketEvents: 0,
    personalEvents: 0,
    dividendsReceived: [],
    totalTradingVolume: [],
    realizedProfit: []
  };
  ensureFeatureState();
}

function setInitialFeatureStats() {
  ensureFeatureState();
  featureStats.dividendsReceived = players.map(() => 0);
  featureStats.totalTradingVolume = players.map(() => 0);
  featureStats.realizedProfit = players.map(() => 0);
}

function pushNews(title, text, positive = null) {
  marketState.news.unshift({ title, text, positive, turn, time: Date.now() });
  marketState.news = marketState.news.slice(0, 8);
  renderFeaturePanels();
}

function randomWeighted(items) {
  const total = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight || 1;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculatePortfolio(playerIndex) {
  const player = players[playerIndex];
  if (!player) return { cash: 0, stockValue: 0, netWorth: 0, investedCost: 0, unrealized: 0, holdings: [] };

  let stockValue = 0;
  let investedCost = 0;
  const holdings = [];

  stocks.forEach(stock => {
    const owned = stock.owned[playerIndex] || 0;
    if (owned <= 0) return;
    const cost = stock.totalSpent[playerIndex] || 0;
    const value = owned * stock.price;
    stockValue += value;
    investedCost += cost;
    holdings.push({
      name: stock.name,
      sector: SECTOR_MAP[stock.name] || "Other",
      owned,
      price: stock.price,
      value,
      cost,
      profit: value - cost,
      returnPct: cost > 0 ? ((value - cost) / cost) * 100 : 0
    });
  });

  return {
    cash: player.money,
    stockValue,
    netWorth: player.money + stockValue,
    investedCost,
    unrealized: stockValue - investedCost,
    holdings: holdings.sort((a, b) => b.value - a.value)
  };
}

function renderPortfolioPanel() {
  const panel = document.getElementById("portfolioPanel");
  if (!panel || !players.length) return;

  const ranked = players.map((player, index) => ({
    index,
    name: player.name,
    color: player.color,
    ...calculatePortfolio(index)
  })).sort((a, b) => b.netWorth - a.netWorth);

  panel.innerHTML = `
    <div class="feature-panel-header">
      <h2>Portfolio Leaderboard</h2>
      <span>Round ${turn}</span>
    </div>
    <div class="portfolio-grid">
      ${ranked.map((row, rank) => `
        <article class="portfolio-card">
          <div class="portfolio-rank">#${rank + 1}</div>
          <div class="portfolio-name" style="border-left-color:${row.color}">${escapeHTML(row.name)}</div>
          <div class="portfolio-worth">$${row.netWorth.toFixed(2)}</div>
          <div class="portfolio-metrics">
            <span>Cash<br><b>$${row.cash.toFixed(2)}</b></span>
            <span>Stocks<br><b>$${row.stockValue.toFixed(2)}</b></span>
            <span>Invested P/L<br><b class="${row.unrealized >= 0 ? "green" : "red"}">${row.unrealized >= 0 ? "+" : ""}$${row.unrealized.toFixed(2)}</b></span>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderMarketPanel() {
  const panel = document.getElementById("marketPanel");
  if (!panel) return;

  const sentimentLabel = marketState.sentiment > 0.025 ? "Bullish" : marketState.sentiment < -0.025 ? "Bearish" : "Neutral";
  const sentimentClass = marketState.sentiment > 0.025 ? "green" : marketState.sentiment < -0.025 ? "red" : "neutral";

  const sectors = Object.entries(marketState.sectorTrends)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, value]) => `<span class="sector-chip"><b>${escapeHTML(sector)}</b> <em class="${value >= 0 ? "green" : "red"}">${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%</em></span>`)
    .join("");

  panel.innerHTML = `
    <div class="feature-panel-header">
      <h2>Market Outlook</h2>
      <span class="${sentimentClass}">${sentimentLabel}</span>
    </div>
    <div class="market-summary">
      <div><small>Market sentiment</small><strong>${(marketState.sentiment * 100).toFixed(1)}%</strong></div>
      <div><small>Market trend</small><strong>${marketState.trend >= 0 ? "+" : ""}${(marketState.trend * 100).toFixed(1)}%</strong></div>
      <div><small>Rounds played</small><strong>${marketState.rounds}</strong></div>
    </div>
    <div class="sector-list">${sectors}</div>
  `;
}

function renderNewsPanel() {
  const panel = document.getElementById("newsPanel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="feature-panel-header">
      <h2>Market & Life News</h2>
      <button type="button" id="newsDetailsBtn">Full History</button>
    </div>
    <div class="news-list">
      ${marketState.news.length
        ? marketState.news.slice(0, 5).map(item => `
          <article class="news-item ${item.positive === true ? "positive" : item.positive === false ? "negative" : ""}">
            <div><b>${escapeHTML(item.title)}</b><small>Round ${item.turn}</small></div>
            <p>${escapeHTML(item.text)}</p>
          </article>
        `).join("")
        : '<div class="empty-state">No news yet. The market is waiting for its first big story.</div>'}
    </div>
  `;

  document.getElementById("newsDetailsBtn")?.addEventListener("click", showNewsHistory);
}

function renderFeaturePanels() {
  ensureFeatureState();
  renderPortfolioPanel();
  renderMarketPanel();
  renderNewsPanel();
  updateSaveButtons();
}

function showNewsHistory() {
  const html = marketState.news.length
    ? `<h2>News History</h2>${marketState.news.map(item => `
      <div class="news-history-entry"><b>Round ${item.turn}: ${escapeHTML(item.title)}</b><br>${escapeHTML(item.text)}</div>
    `).join("")}`
    : "No market or life news yet.";
  popup(html);
}

// ===== BETTER MARKET MODEL =====
function updateMarket() {
  ensureFeatureState();
  marketState.rounds += 1;

  const globalShock = (Math.random() - 0.5) * 0.06;
  marketState.sentiment = clamp(marketState.sentiment * 0.72 + globalShock, -0.12, 0.12);
  marketState.trend = clamp(marketState.trend * 0.82 + marketState.sentiment * 0.32, -0.12, 0.12);

  Object.keys(marketState.sectorTrends).forEach(sector => {
    marketState.sectorTrends[sector] = clamp(
      marketState.sectorTrends[sector] * 0.68 + marketState.sentiment * 0.18 + (Math.random() - 0.5) * 0.045,
      -0.15,
      0.15
    );
  });

  stocks.forEach(stock => {
    const sector = SECTOR_MAP[stock.name] || "Other";
    const sectorTrend = marketState.sectorTrends[sector] || 0;
    const meanReversion = ((stock.initialPrice - stock.price) / stock.initialPrice) * 0.018;
    const noise = (Math.random() - 0.5) * stock.volatility * 0.65;
    const expected = marketState.trend * 0.45 + sectorTrend * 0.50 + meanReversion + noise;
    const change = clamp(expected, -stock.volatility * 0.9, stock.volatility * 0.9);
    const oldPrice = stock.price;

    stock.price = clamp(stock.price * (1 + change), 1, 500);
    stock.change = stock.price - oldPrice;
    stock.history.push(stock.price);
  });

  const leaders = [...stocks].sort((a, b) => ((b.price / b.initialPrice) - 1) - ((a.price / a.initialPrice) - 1));
  marketState.bestStock = leaders[0]?.name || null;
}

// ===== EVENTS / NEWS SYSTEM =====
function randomEvent(onComplete) {
  ensureFeatureState();
  if (players.length === 0 || Math.random() > 0.32) {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  const event = randomWeighted(EVENT_DEFINITIONS);
  featureStats.events += 1;

  if (event.type === "personal") {
    const playerIndex = Math.floor(Math.random() * players.length);
    const player = players[playerIndex];
    player.money += event.value;
    featureStats.personalEvents += 1;
    pushNews(event.title, `${player.name}: ${event.text} ${event.value >= 0 ? "+" : "-"}$${Math.abs(event.value).toFixed(2)}.`, event.value >= 0);

    popup(
      `<h2>${escapeHTML(event.title)}</h2><p>${escapeHTML(event.text)}</p><strong>${escapeHTML(player.name)}: ${event.value >= 0 ? "+" : "-"}$${Math.abs(event.value).toFixed(2)}</strong>`,
      { onClose: onComplete }
    );
    return;
  }

  featureStats.marketEvents += 1;
  if (event.type === "market") {
    marketState.sentiment = clamp(marketState.sentiment + event.impact, -0.20, 0.20);
    pushNews(event.title, event.text, event.impact > 0);
    popup(`<h2>${escapeHTML(event.title)}</h2><p>${escapeHTML(event.text)}</p><strong>Market impact: ${event.impact >= 0 ? "+" : ""}${(event.impact * 100).toFixed(1)}%</strong>`, { onClose: onComplete });
    return;
  }

  marketState.sectorTrends[event.sector] = clamp((marketState.sectorTrends[event.sector] || 0) + event.impact, -0.25, 0.25);
  const affected = stocks.filter(stock => (SECTOR_MAP[stock.name] || "Other") === event.sector);
  affected.forEach(stock => {
    const oldPrice = stock.price;
    stock.price = clamp(stock.price * (1 + event.impact), 1, 500);
    stock.change = stock.price - oldPrice;
    stock.history.push(stock.price);
  });
  pushNews(event.title, `${event.text} ${affected.map(stock => stock.name).join(", ")} react immediately.`, event.impact > 0);
  popup(`<h2>${escapeHTML(event.title)}</h2><p>${escapeHTML(event.text)}</p><strong>${escapeHTML(event.sector)}: ${event.impact >= 0 ? "+" : ""}${(event.impact * 100).toFixed(1)}%</strong>`, { onClose: onComplete });
}

// ===== SAVE / LOAD =====
function buildSaveData() {
  ensureFeatureState();
  return {
    version: MARKET_FEATURE_VERSION,
    savedAt: new Date().toISOString(),
    players,
    currentPlayer,
    turn,
    actionTracker,
    gameMode,
    modeValue,
    gameOver,
    stocks: stocks.map(stock => ({
      name: stock.name,
      price: stock.price,
      change: stock.change || 0,
      owned: stock.owned,
      totalSpent: stock.totalSpent,
      history: stock.history
    })),
    lastDividends,
    marketState,
    featureStats
  };
}

function saveGame(showMessage = false) {
  if (!players.length || gameOver) return false;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveData()));
    updateSaveButtons();
    if (showMessage) popup("Game saved successfully.");
    return true;
  } catch (error) {
    console.error("Could not save game:", error);
    if (showMessage) popup("Could not save the game in this browser.");
    return false;
  }
}

function loadSavedGame(showMessage = true) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      popup("There is no saved game on this device.");
      return false;
    }

    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.players) || !Array.isArray(data.stocks)) throw new Error("Invalid save data");

    players = data.players;
    currentPlayer = Number(data.currentPlayer) || 0;
    turn = Number(data.turn) || 1;
    actionTracker = data.actionTracker || {};
    gameMode = data.gameMode === "money" ? "money" : "turns";
    modeValue = Number(data.modeValue) || 20;
    gameOver = false;
    lastDividends = Array.isArray(data.lastDividends) ? data.lastDividends : [];
    marketState = data.marketState || marketState;
    featureStats = data.featureStats || featureStats;
    ensureFeatureState();

    data.stocks.forEach(saved => {
      const stock = stocks.find(item => item.name === saved.name);
      if (!stock) return;
      stock.price = Number(saved.price) || stock.initialPrice;
      stock.change = Number(saved.change) || 0;
      stock.owned = saved.owned || {};
      stock.totalSpent = saved.totalSpent || {};
      stock.history = Array.isArray(saved.history) && saved.history.length ? saved.history : [stock.price];
    });

    document.getElementById("setup")?.classList.add("hidden");
    document.getElementById("podium")?.classList.add("hidden");
    document.getElementById("game")?.classList.remove("hidden");
    render();
    renderFeaturePanels();

    if (showMessage) popup(`<h2>Game loaded</h2><p>Saved ${new Date(data.savedAt || Date.now()).toLocaleString()}.</p>`);
    return true;
  } catch (error) {
    console.error("Could not load saved game:", error);
    localStorage.removeItem(SAVE_KEY);
    popup("The saved game was invalid or corrupted and has been removed.");
    updateSaveButtons();
    return false;
  }
}

function clearSavedGame() {
  localStorage.removeItem(SAVE_KEY);
  updateSaveButtons();
}

function updateSaveButtons() {
  const continueBtn = document.getElementById("continueGameBtn");
  const hasSave = !!localStorage.getItem(SAVE_KEY);
  if (continueBtn) continueBtn.classList.toggle("hidden", !hasSave);
}

function showSaveDetails() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return popup("No saved game exists on this device.");
    const data = JSON.parse(raw);
    popup(`<h2>Saved Game</h2><p>Players: ${data.players.length}<br>Round: ${data.turn}<br>Mode: ${escapeHTML(data.gameMode)}<br>Saved: ${new Date(data.savedAt).toLocaleString()}</p>`);
  } catch {
    popup("The saved game could not be read.");
  }
}

// ===== END-GAME STATS =====
function buildEndGameStats(scores) {
  const stockPerformance = stocks.map(stock => ({
    name: stock.name,
    changePct: ((stock.price / stock.initialPrice) - 1) * 100
  })).sort((a, b) => b.changePct - a.changePct);

  return {
    topStock: stockPerformance[0],
    worstStock: stockPerformance[stockPerformance.length - 1],
    topTrader: [...featureStats.realizedProfit.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0,
    topHolder: scores[0]?.name || "-",
    totalEvents: featureStats.events,
    marketEvents: featureStats.marketEvents,
    personalEvents: featureStats.personalEvents,
    transactions: featureStats.transactions.length,
    tradingVolume: featureStats.totalTradingVolume.reduce((a, b) => a + b, 0),
    dividendTotal: featureStats.dividendsReceived.reduce((a, b) => a + b, 0)
  };
}

function showEndGameStatistics(scores) {
  const stats = buildEndGameStats(scores);
  const perPlayer = scores.map(score => {
    const originalIndex = players.findIndex(player => player.name === score.name && player.color === score.color);
    const portfolio = calculatePortfolio(Math.max(0, originalIndex));
    const invested = portfolio.investedCost;
    const roi = invested > 0 ? (portfolio.unrealized / invested) * 100 : 0;
    return { ...score, roi, holdings: portfolio.holdings, realized: featureStats.realizedProfit[originalIndex] || 0 };
  });

  const playerRows = perPlayer.map((player, index) => {
    const bestHolding = player.holdings[0];
    return `<tr><td>${index + 1}</td><td>${escapeHTML(player.name)}</td><td>$${player.total.toFixed(2)}</td><td>${player.earned >= 0 ? "+" : ""}$${player.earned.toFixed(2)}</td><td class="${player.roi >= 0 ? "green" : "red"}">${player.roi >= 0 ? "+" : ""}${player.roi.toFixed(1)}%</td><td>${bestHolding ? `${escapeHTML(bestHolding.name)} (${bestHolding.profit >= 0 ? "+" : "-"}$${Math.abs(bestHolding.profit).toFixed(2)})` : "-"}</td></tr>`;
  }).join("");

  const html = `
    <h2>Game Statistics</h2>
    <div class="stats-summary-grid">
      <div><small>Best stock</small><strong>${escapeHTML(stats.topStock?.name || "-")}</strong><span class="green">${stats.topStock ? "+" + stats.topStock.changePct.toFixed(1) + "%" : ""}</span></div>
      <div><small>Worst stock</small><strong>${escapeHTML(stats.worstStock?.name || "-")}</strong><span class="red">${stats.worstStock ? stats.worstStock.changePct.toFixed(1) + "%" : ""}</span></div>
      <div><small>Transactions</small><strong>${stats.transactions}</strong></div>
      <div><small>Trading volume</small><strong>$${stats.tradingVolume.toFixed(2)}</strong></div>
      <div><small>Dividends paid</small><strong>$${stats.dividendTotal.toFixed(2)}</strong></div>
      <div><small>Events</small><strong>${stats.totalEvents}</strong><span>${stats.marketEvents} market / ${stats.personalEvents} personal</span></div>
    </div>
    <div class="table-wrap stats-table-wrap">
      <table><thead><tr><th>#</th><th>Player</th><th>Final worth</th><th>Gain</th><th>Portfolio ROI</th><th>Top holding</th></tr></thead><tbody>${playerRows}</tbody></table>
    </div>
  `;

  popup(html);
}

// Replace podium rendering with a richer end screen while keeping the original structure.
function showPodium(scores) {
  document.getElementById("game")?.classList.add("hidden");
  document.getElementById("podium")?.classList.remove("hidden");

  const positions = [
    { id: "firstPlace", medal: "🥇" },
    { id: "secondPlace", medal: "🥈" },
    { id: "thirdPlace", medal: "🥉" }
  ];

  positions.forEach(({ id, medal }) => {
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
    element.innerHTML = `${medal}<br><b>${escapeHTML(score.name)}</b><br>$${score.total.toFixed(2)}<small>${score.earned >= 0 ? "+" : ""}$${score.earned.toFixed(2)}</small>`;
    element.style.background = score.color;
  });

  const panel = document.getElementById("gameStats");
  if (panel) {
    panel.innerHTML = `<button type="button" id="openStatsBtn">View Full Game Statistics</button>`;
    document.getElementById("openStatsBtn")?.addEventListener("click", () => showEndGameStatistics(scores));
  }

  clearSavedGame();
}

// ===== HOOKS =====
function installFeatureHooks() {
  resetFeatureState();

  const originalStartGame = window.startGame;
  const originalBuy = window.buy;
  const originalSell = window.sell;
  const originalEndTurn = window.endTurn;
  const originalResetPodium = window.resetPodium;

  window.startGame = function(...args) {
    const result = originalStartGame.apply(this, args);
    if (result !== false) {
      resetFeatureState();
      setInitialFeatureStats();
      renderFeaturePanels();
      clearSavedGame();
    }
    return result;
  };

  window.buy = function(stockIndex, amount) {
    const before = players[currentPlayer]?.money ?? 0;
    const beforeOwned = stocks[stockIndex]?.owned[currentPlayer] || 0;
    originalBuy(stockIndex, amount);
    const afterOwned = stocks[stockIndex]?.owned[currentPlayer] || 0;
    if (afterOwned > beforeOwned) {
      const spent = before - (players[currentPlayer]?.money ?? before);
      featureStats.transactions.push({ player: currentPlayer, type: "buy", stock: stocks[stockIndex].name, amount: afterOwned - beforeOwned, value: spent, turn });
      featureStats.totalTradingVolume[currentPlayer] = (featureStats.totalTradingVolume[currentPlayer] || 0) + spent;
      saveGame();
      renderFeaturePanels();
    }
  };

  window.sell = function(stockIndex, amount = 1) {
    const playerIndex = currentPlayer;
    const stock = stocks[stockIndex];
    const beforeOwned = stock?.owned[playerIndex] || 0;
    const beforeSpent = stock?.totalSpent[playerIndex] || 0;
    const beforeCash = players[playerIndex]?.money ?? 0;
    originalSell(stockIndex, amount);
    const afterOwned = stock?.owned[playerIndex] || 0;
    const sold = beforeOwned - afterOwned;
    if (sold > 0) {
      const proceeds = (players[playerIndex]?.money ?? beforeCash) - beforeCash;
      const averageCost = beforeOwned > 0 ? beforeSpent / beforeOwned : 0;
      featureStats.transactions.push({ player: playerIndex, type: "sell", stock: stock.name, amount: sold, value: proceeds, turn });
      featureStats.totalTradingVolume[playerIndex] = (featureStats.totalTradingVolume[playerIndex] || 0) + proceeds;
      featureStats.realizedProfit[playerIndex] = (featureStats.realizedProfit[playerIndex] || 0) + proceeds - (averageCost * sold);
      saveGame();
      renderFeaturePanels();
    }
  };

  window.endTurn = function(...args) {
    const result = originalEndTurn.apply(this, args);
    window.setTimeout(() => {
      renderFeaturePanels();
      if (players.length && !gameOver) saveGame();
    }, 50);
    return result;
  };

  window.resetPodium = function(...args) {
    clearSavedGame();
    resetFeatureState();
    return originalResetPodium.apply(this, args);
  };

  // Core dividend function already calculates the payment. Track the resulting total without replacing it.
  const originalApplyDividends = window.applyDividends;
  window.applyDividends = function(onComplete) {
    return originalApplyDividends.call(this, () => {
      lastDividends.forEach((entries, playerIndex) => {
        const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
        featureStats.dividendsReceived[playerIndex] = (featureStats.dividendsReceived[playerIndex] || 0) + total;
      });
      renderFeaturePanels();
      if (typeof onComplete === "function") onComplete();
    });
  };
}

function installFeatureUI() {
  const setup = document.getElementById("setup");
  if (setup && !document.getElementById("continueGameBtn")) {
    const row = document.createElement("div");
    row.className = "save-actions";
    row.innerHTML = `
      <button type="button" id="continueGameBtn" class="hidden">Continue Saved Game</button>
      <button type="button" id="saveDetailsBtn">Saved Game Details</button>
    `;
    setup.appendChild(row);
    document.getElementById("continueGameBtn")?.addEventListener("click", () => loadSavedGame(true));
    document.getElementById("saveDetailsBtn")?.addEventListener("click", showSaveDetails);
  }

  const game = document.getElementById("game");
  if (game && !document.getElementById("portfolioPanel")) {
    const actions = game.querySelector(".buttons");
    const featureArea = document.createElement("div");
    featureArea.id = "featureArea";
    featureArea.innerHTML = `
      <section id="portfolioPanel" class="feature-panel"></section>
      <section id="marketPanel" class="feature-panel"></section>
      <section id="newsPanel" class="feature-panel"></section>
    `;
    if (actions) actions.after(featureArea);
    else game.appendChild(featureArea);

    const saveRow = document.createElement("div");
    saveRow.className = "save-game-row";
    saveRow.innerHTML = `
      <button type="button" id="saveGameBtn">Save Game</button>
      <button type="button" id="deleteSaveBtn" class="danger-secondary">Delete Saved Game</button>
    `;
    featureArea.before(saveRow);
    document.getElementById("saveGameBtn")?.addEventListener("click", () => saveGame(true));
    document.getElementById("deleteSaveBtn")?.addEventListener("click", () => {
      clearSavedGame();
      popup("Saved game deleted.");
    });
  }

  const podium = document.getElementById("podium");
  if (podium && !document.getElementById("gameStats")) {
    const stats = document.createElement("div");
    stats.id = "gameStats";
    podium.appendChild(stats);
  }

  updateSaveButtons();
}

function initializeGameFeatures() {
  installFeatureHooks();
  installFeatureUI();
  renderFeaturePanels();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGameFeatures, { once: true });
} else {
  initializeGameFeatures();
}
