// ===== UPDATE 1-3: P/L + ROI CORRECTIONS =====
// Keeps realized and unrealized P/L separate and defines overall ROI
// from the player's actual change in total wealth relative to $1,000 starting cash.

(function () {
  const STARTING_CASH = 1000;

  function getRealizedPL(playerIndex) {
    return Number(featureStats?.realizedProfit?.[playerIndex] || 0);
  }

  function getDividendIncome(playerIndex) {
    return Number(featureStats?.dividendsReceived?.[playerIndex] || 0);
  }

  function getUnrealizedPL(playerIndex) {
    if (!players[playerIndex]) return 0;
    return stocks.reduce((total, stock) => {
      const owned = Number(stock.owned?.[playerIndex] || 0);
      const cost = Number(stock.totalSpent?.[playerIndex] || 0);
      return total + (owned * Number(stock.price || 0)) - cost;
    }, 0);
  }

  function getOverallROI(playerIndex) {
    const player = players[playerIndex];
    if (!player) return 0;
    const netWorth = typeof calculateNetWorth === "function" ? calculateNetWorth(playerIndex) : STARTING_CASH;
    return ((netWorth - STARTING_CASH) / STARTING_CASH) * 100;
  }

  // Expose the definitions so other UI code can use exactly the same calculations.
  window.getInvestCoRealizedPL = getRealizedPL;
  window.getInvestCoUnrealizedPL = getUnrealizedPL;
  window.getInvestCoOverallROI = getOverallROI;
  window.getInvestCoDividendIncome = getDividendIncome;

  // Update the portfolio leaderboard without changing its existing layout.
  window.renderPortfolioPanel = function () {
    const panel = document.getElementById("portfolioPanel");
    if (!panel || !players.length) return;

    const ranked = players.map((player, index) => {
      const cash = Number(player.money || 0);
      const stockValue = stocks.reduce((sum, stock) => sum + (Number(stock.owned?.[index] || 0) * Number(stock.price || 0)), 0);
      const netWorth = cash + stockValue;
      const unrealized = getUnrealizedPL(index);
      const realized = getRealizedPL(index);
      const roi = getOverallROI(index);

      return { index, name: player.name, color: player.color, cash, stockValue, netWorth, unrealized, realized, roi };
    }).sort((a, b) => b.netWorth - a.netWorth);

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
              <span>Unrealized P/L<br><b class="${row.unrealized >= 0 ? "green" : "red"}">${row.unrealized >= 0 ? "+" : ""}$${row.unrealized.toFixed(2)}</b></span>
              <span>Realized P/L<br><b class="${row.realized >= 0 ? "green" : "red"}">${row.realized >= 0 ? "+" : ""}$${row.realized.toFixed(2)}</b></span>
              <span>Overall ROI<br><b class="${row.roi >= 0 ? "green" : "red"}">${row.roi >= 0 ? "+" : ""}${row.roi.toFixed(1)}%</b></span>
            </div>
          </article>
        `).join("")}
      </div>
    `;
  };

  // Replace the end-game statistics renderer so its ROI is the actual overall
  // game return, not just unrealized stock return.
  window.showEndGameStatistics = function (scores) {
    const stockPerformance = stocks.map(stock => ({
      name: stock.name,
      changePct: ((stock.price / stock.initialPrice) - 1) * 100
    })).sort((a, b) => b.changePct - a.changePct);

    const totalEvents = Number(featureStats?.events || 0);
    const marketEvents = Number(featureStats?.marketEvents || 0);
    const personalEvents = Number(featureStats?.personalEvents || 0);
    const transactions = Array.isArray(featureStats?.transactions) ? featureStats.transactions.length : 0;
    const tradingVolume = Array.isArray(featureStats?.totalTradingVolume)
      ? featureStats.totalTradingVolume.reduce((sum, value) => sum + Number(value || 0), 0)
      : 0;
    const dividendTotal = Array.isArray(featureStats?.dividendsReceived)
      ? featureStats.dividendsReceived.reduce((sum, value) => sum + Number(value || 0), 0)
      : 0;

    const playerRows = scores.map((score, index) => {
      const originalIndex = players.findIndex(player => player.name === score.name && player.color === score.color);
      const playerIndex = originalIndex >= 0 ? originalIndex : index;
      const realized = getRealizedPL(playerIndex);
      const unrealized = getUnrealizedPL(playerIndex);
      const roi = getOverallROI(playerIndex);

      const holdings = stocks.map(stock => {
        const owned = Number(stock.owned?.[playerIndex] || 0);
        const cost = Number(stock.totalSpent?.[playerIndex] || 0);
        const value = owned * Number(stock.price || 0);
        return { name: stock.name, profit: value - cost, value };
      }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

      const bestHolding = holdings[0];
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHTML(score.name)}</td>
          <td>$${score.total.toFixed(2)}</td>
          <td class="${score.earned >= 0 ? "green" : "red"}">${score.earned >= 0 ? "+" : ""}$${score.earned.toFixed(2)}</td>
          <td class="${realized >= 0 ? "green" : "red"}">${realized >= 0 ? "+" : ""}$${realized.toFixed(2)}</td>
          <td class="${unrealized >= 0 ? "green" : "red"}">${unrealized >= 0 ? "+" : ""}$${unrealized.toFixed(2)}</td>
          <td class="${roi >= 0 ? "green" : "red"}">${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%</td>
          <td>${bestHolding ? `${escapeHTML(bestHolding.name)} (${bestHolding.profit >= 0 ? "+" : "-"}$${Math.abs(bestHolding.profit).toFixed(2)})` : "-"}</td>
        </tr>
      `;
    }).join("");

    const html = `
      <h2>Game Statistics</h2>
      <div class="stats-summary-grid">
        <div><small>Best stock</small><strong>${escapeHTML(stockPerformance[0]?.name || "-")}</strong><span class="green">${stockPerformance[0] ? "+" + stockPerformance[0].changePct.toFixed(1) + "%" : ""}</span></div>
        <div><small>Worst stock</small><strong>${escapeHTML(stockPerformance.at(-1)?.name || "-")}</strong><span class="red">${stockPerformance.at(-1) ? stockPerformance.at(-1).changePct.toFixed(1) + "%" : ""}</span></div>
        <div><small>Transactions</small><strong>${transactions}</strong></div>
        <div><small>Trading volume</small><strong>$${tradingVolume.toFixed(2)}</strong></div>
        <div><small>Dividends paid</small><strong>$${dividendTotal.toFixed(2)}</strong></div>
        <div><small>Events</small><strong>${totalEvents}</strong><span>${marketEvents} market / ${personalEvents} personal</span></div>
      </div>
      <div class="table-wrap stats-table-wrap">
        <table>
          <thead><tr><th>#</th><th>Player</th><th>Final worth</th><th>Overall gain</th><th>Realized P/L</th><th>Unrealized P/L</th><th>Overall ROI</th><th>Top holding</th></tr></thead>
          <tbody>${playerRows}</tbody>
        </table>
      </div>
    `;

    popup(html);
  };

  // If the feature system has already rendered once, refresh it immediately.
  if (typeof renderFeaturePanels === "function" && players.length) {
    renderFeaturePanels();
  }
})();
