// ===== UPDATES 4-6 =====
// Dividend accounting, end-game statistics, and portfolio dashboard improvements.

(function () {
  function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  function pct(value) {
    const n = Number(value || 0);
    return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
  }

  function getRealized(playerIndex) {
    return Number(featureStats?.realizedProfit?.[playerIndex] || 0);
  }

  function getDividends(playerIndex) {
    return Number(featureStats?.dividendsReceived?.[playerIndex] || 0);
  }

  // The existing dividend calculation is retained: at the end of each round,
  // each share held receives stock.price * stock.dividend.
  // This wrapper only makes missing/invalid dividend totals safe after a load.
  const previousApplyDividends = window.applyDividends;
  window.applyDividends = function (onComplete) {
    return previousApplyDividends.call(this, function () {
      ensureFeatureState();
      players.forEach((_, playerIndex) => {
        if (!Number.isFinite(featureStats.dividendsReceived[playerIndex])) {
          featureStats.dividendsReceived[playerIndex] = 0;
        }
      });
      if (typeof onComplete === 'function') onComplete();
    });
  };

  function calculateDashboardPortfolio(playerIndex) {
    const base = calculatePortfolio(playerIndex);
    const realized = getRealized(playerIndex);
    const dividends = getDividends(playerIndex);
    const totalReturn = base.unrealized + realized + dividends;
    const startingCapital = 1000;
    const roi = startingCapital > 0 ? (totalReturn / startingCapital) * 100 : 0;
    return { ...base, realized, dividends, totalReturn, roi };
  }

  window.renderPortfolioPanel = function () {
    const panel = document.getElementById('portfolioPanel');
    if (!panel || !players.length) return;

    const ranked = players.map((player, index) => ({
      index,
      name: player.name,
      color: player.color,
      ...calculateDashboardPortfolio(index)
    })).sort((a, b) => b.netWorth - a.netWorth);

    const current = ranked.find(row => row.index === currentPlayer) || ranked[0];

    panel.innerHTML = `
      <div class="feature-panel-header">
        <h2>Portfolio Dashboard</h2>
        <span>Round ${turn}</span>
      </div>

      <div class="portfolio-focus">
        <div class="portfolio-focus-title">
          <span style="border-left-color:${current.color}">${escapeHTML(current.name)}</span>
          <strong>${money(current.netWorth)}</strong>
        </div>
        <div class="portfolio-dashboard-grid">
          <div><small>Cash</small><b>${money(current.cash)}</b></div>
          <div><small>Stock value</small><b>${money(current.stockValue)}</b></div>
          <div><small>Unrealized P/L</small><b class="${current.unrealized >= 0 ? 'green' : 'red'}">${money(current.unrealized)}</b></div>
          <div><small>Realized P/L</small><b class="${current.realized >= 0 ? 'green' : 'red'}">${money(current.realized)}</b></div>
          <div><small>Dividends</small><b class="green">${money(current.dividends)}</b></div>
          <div><small>Total return</small><b class="${current.totalReturn >= 0 ? 'green' : 'red'}">${money(current.totalReturn)}</b></div>
          <div><small>Overall return</small><b class="${current.roi >= 0 ? 'green' : 'red'}">${pct(current.roi)}</b></div>
        </div>
      </div>

      <div class="portfolio-section-title">Players</div>
      <div class="portfolio-grid">
        ${ranked.map((row, rank) => `
          <article class="portfolio-card ${row.index === currentPlayer ? 'current-player-card' : ''}">
            <div class="portfolio-rank">#${rank + 1}</div>
            <div class="portfolio-name" style="border-left-color:${row.color}">${escapeHTML(row.name)}</div>
            <div class="portfolio-worth">${money(row.netWorth)}</div>
            <div class="portfolio-metrics">
              <span>Cash<br><b>${money(row.cash)}</b></span>
              <span>Stocks<br><b>${money(row.stockValue)}</b></span>
              <span>Unrealized P/L<br><b class="${row.unrealized >= 0 ? 'green' : 'red'}">${money(row.unrealized)}</b></span>
            </div>
            <div class="portfolio-mini-stats">
              <span>Realized ${money(row.realized)}</span>
              <span>Dividends ${money(row.dividends)}</span>
              <span>ROI ${pct(row.roi)}</span>
            </div>
          </article>
        `).join('')}
      </div>

      <div class="portfolio-section-title">Current holdings</div>
      ${current.holdings.length ? `
        <div class="table-wrap portfolio-holdings-wrap">
          <table class="portfolio-holdings-table">
            <thead><tr><th>Stock</th><th>Shares</th><th>Avg cost</th><th>Price</th><th>P/L</th><th>Return</th></tr></thead>
            <tbody>
              ${current.holdings.map(h => `
                <tr>
                  <td><b>${escapeHTML(h.name)}</b><small>${escapeHTML(h.sector)}</small></td>
                  <td>${h.owned}</td>
                  <td>${money(h.cost / h.owned)}</td>
                  <td>${money(h.price)}</td>
                  <td class="${h.profit >= 0 ? 'green' : 'red'}">${money(h.profit)}</td>
                  <td class="${h.returnPct >= 0 ? 'green' : 'red'}">${pct(h.returnPct)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state">No stocks are currently held.</div>'}
    `;
  };

  window.buildEndGameStats = function (scores) {
    const stockPerformance = stocks.map(stock => ({
      name: stock.name,
      changePct: stock.initialPrice > 0 ? ((stock.price / stock.initialPrice) - 1) * 100 : 0
    })).sort((a, b) => b.changePct - a.changePct);

    const playerStats = scores.map(score => {
      const index = players.findIndex(player => player.name === score.name && player.color === score.color);
      const portfolio = calculateDashboardPortfolio(Math.max(0, index));
      return {
        name: score.name,
        index,
        finalWorth: score.total,
        realized: portfolio.realized,
        unrealized: portfolio.unrealized,
        dividends: portfolio.dividends,
        totalReturn: portfolio.totalReturn,
        roi: portfolio.roi
      };
    });

    const topReturn = [...playerStats].sort((a, b) => b.totalReturn - a.totalReturn)[0];

    return {
      topStock: stockPerformance[0] || null,
      worstStock: stockPerformance[stockPerformance.length - 1] || null,
      topTrader: topReturn?.index ?? 0,
      topHolder: scores[0]?.name || '-',
      totalEvents: Number(featureStats.events || 0),
      marketEvents: Number(featureStats.marketEvents || 0),
      personalEvents: Number(featureStats.personalEvents || 0),
      transactions: Array.isArray(featureStats.transactions) ? featureStats.transactions.length : 0,
      tradingVolume: (featureStats.totalTradingVolume || []).reduce((a, b) => a + Number(b || 0), 0),
      dividendTotal: (featureStats.dividendsReceived || []).reduce((a, b) => a + Number(b || 0), 0),
      playerStats
    };
  };

  window.showEndGameStatistics = function (scores) {
    const stats = buildEndGameStats(scores);

    const rows = stats.playerStats.map((player, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(player.name)}</td>
        <td>${money(player.finalWorth)}</td>
        <td class="${player.realized >= 0 ? 'green' : 'red'}">${money(player.realized)}</td>
        <td class="${player.unrealized >= 0 ? 'green' : 'red'}">${money(player.unrealized)}</td>
        <td class="green">${money(player.dividends)}</td>
        <td class="${player.totalReturn >= 0 ? 'green' : 'red'}">${money(player.totalReturn)}</td>
        <td class="${player.roi >= 0 ? 'green' : 'red'}">${pct(player.roi)}</td>
      </tr>
    `).join('');

    popup(`
      <h2>Game Statistics</h2>
      <div class="stats-summary-grid">
        <div><small>Best stock</small><strong>${escapeHTML(stats.topStock?.name || '-')}</strong><span class="green">${stats.topStock ? pct(stats.topStock.changePct) : ''}</span></div>
        <div><small>Worst stock</small><strong>${escapeHTML(stats.worstStock?.name || '-')}</strong><span class="red">${stats.worstStock ? pct(stats.worstStock.changePct) : ''}</span></div>
        <div><small>Transactions</small><strong>${stats.transactions}</strong></div>
        <div><small>Trading volume</small><strong>${money(stats.tradingVolume)}</strong></div>
        <div><small>Total dividends</small><strong>${money(stats.dividendTotal)}</strong></div>
        <div><small>Events</small><strong>${stats.totalEvents}</strong><span>${stats.marketEvents} market / ${stats.personalEvents} personal</span></div>
      </div>
      <div class="table-wrap stats-table-wrap">
        <table>
          <thead><tr><th>#</th><th>Player</th><th>Final worth</th><th>Realized P/L</th><th>Unrealized P/L</th><th>Dividends</th><th>Total return</th><th>ROI</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="stats-note">Final worth = cash + current market value of remaining shares. Realized P/L, unrealized P/L and dividends are shown separately so they are not counted as the same profit.</p>
    `);
  };

  // Replace the normal feature refresh with the improved portfolio renderer.
  window.renderFeaturePanels = function () {
    ensureFeatureState();
    renderPortfolioPanel();
    renderMarketPanel();
    renderNewsPanel();
    updateSaveButtons();
  };

  if (players.length) window.renderFeaturePanels();
})();
