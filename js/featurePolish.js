// ===== FEATURE POLISH / NOTIFICATIONS =====
// Keeps the existing game feature engine intact while improving placement,
// portfolio presentation, and round-wide player notifications.

(function () {
  const ROUND_NOTICE_KEY = "investCoRoundNotices";
  let roundNotices = [];

  function ensureNoticeState() {
    if (!Array.isArray(roundNotices)) roundNotices = [];
  }

  function pushRoundNotice(type, playerIndex, title, text, amount = null) {
    ensureNoticeState();
    roundNotices.unshift({
      type,
      playerIndex,
      playerName: players[playerIndex]?.name || `Player ${playerIndex + 1}`,
      title,
      text,
      amount,
      turn
    });
    roundNotices = roundNotices.slice(0, 20);
  }

  function notificationButtonHTML() {
    const count = roundNotices.length;
    return `<button type="button" id="roundNoticesBtn" class="top-action-btn" aria-label="Open round notifications">🔔 Notifications${count ? ` <span class="notice-count">${count}</span>` : ""}</button>`;
  }

  function renderTopActions() {
    const infoBar = document.getElementById("infoBar");
    if (!infoBar || !players[currentPlayer]) return;

    const playerColor = players[currentPlayer].color || "#ffffff";
    const nameColor = typeof isColorDark === "function" && isColorDark(playerColor) ? "#ffffff" : playerColor;
    const worth = typeof calculateNetWorth === "function" ? calculateNetWorth(currentPlayer) : players[currentPlayer].money;

    infoBar.style.background = playerColor;
    infoBar.innerHTML = `
      <div class="info-main-line">
        <span>Turn ${turn} | <span style="color:${nameColor}">${escapeHTML(players[currentPlayer].name)}</span></span>
        <span>Cash: $${players[currentPlayer].money.toFixed(2)} | Worth: $${worth.toFixed(2)}</span>
      </div>
      <div class="info-action-row">
        <button id="infoBtn" type="button" class="top-action-btn">Info</button>
        <button id="portfolioBtn" type="button" class="top-action-btn">Portfolio</button>
        ${notificationButtonHTML()}
        <button id="viewDividendsBtn" type="button" class="top-action-btn" onclick="viewLastDividends()" aria-label="View last dividends">Dividends</button>
      </div>
    `;

    document.getElementById("infoBtn")?.addEventListener("click", () => showPlayerInfo(currentPlayer));
    document.getElementById("portfolioBtn")?.addEventListener("click", showPortfolioLeaderboard);
    document.getElementById("roundNoticesBtn")?.addEventListener("click", showRoundNotices);
  }

  function showPortfolioLeaderboard() {
    const source = document.getElementById("portfolioPanel");
    if (!source) {
      popup("Portfolio information is not available yet.");
      return;
    }

    popup(
      `<div class="portfolio-modal-heading"><h2>Portfolio Leaderboard</h2><span>Round ${turn}</span></div>${source.innerHTML}`,
      { showOk: true }
    );
  }

  function showRoundNotices() {
    ensureNoticeState();
    if (!roundNotices.length) {
      popup("No player-specific bonuses or dividend payments have been recorded yet.");
      return;
    }

    const html = `
      <div class="portfolio-modal-heading"><h2>Round Notifications</h2><span>${roundNotices.length} recent</span></div>
      <div class="round-notice-list">
        ${roundNotices.map(item => `
          <article class="round-notice ${item.type === "positive" ? "positive" : item.type === "negative" ? "negative" : "neutral"}">
            <div class="round-notice-title">
              <b>${escapeHTML(item.playerName)}</b>
              <span>Round ${item.turn}</span>
            </div>
            <strong>${escapeHTML(item.title)}</strong>
            <p>${escapeHTML(item.text)}</p>
            ${item.amount !== null ? `<div class="round-notice-amount ${item.amount >= 0 ? "green" : "red"}">${item.amount >= 0 ? "+" : "-"}$${Math.abs(item.amount).toFixed(2)}</div>` : ""}
          </article>
        `).join("")}
      </div>
    `;

    popup(html);
  }

  function installPortfolioLayout() {
    const panel = document.getElementById("portfolioPanel");
    if (panel) panel.classList.add("portfolio-panel-source");

    // The leaderboard is now accessed from the top action row instead of occupying the game screen.
    renderTopActions();
  }

  // Intercept the final dividend wrapper installed by gameFeatures.js.
  function installDividendNotificationHook() {
    if (typeof window.applyDividends !== "function" || window.applyDividends.__polished) return;

    const original = window.applyDividends;
    const wrapped = function (onComplete) {
      return original.call(this, function () {
        lastDividends.forEach((entries, playerIndex) => {
          const total = (entries || []).reduce((sum, entry) => sum + entry.amount, 0);
          if (total > 0) {
            pushRoundNotice(
              "positive",
              playerIndex,
              "Dividend payment",
              `${entries.length} dividend ${entries.length === 1 ? "payment" : "payments"} credited to ${players[playerIndex]?.name || "the player"}.`,
              total
            );
          }
        });
        renderTopActions();
        renderFeaturePanels?.();
        if (typeof onComplete === "function") onComplete();
      });
    };
    wrapped.__polished = true;
    window.applyDividends = wrapped;
  }

  // Intercept the final personal-event wrapper so every affected player gets a persistent notification,
  // regardless of whose turn it is when the round event occurs.
  function installPersonalEventHook() {
    if (typeof window.randomEvent !== "function" || window.randomEvent.__polished) return;

    const original = window.randomEvent;
    const wrapped = function (onComplete) {
      const before = players.map(player => player.money);

      return original.call(this, function () {
        players.forEach((player, index) => {
          const change = player.money - before[index];
          if (change === 0) return;

          const hadExistingNotice = roundNotices.some(item =>
            item.playerIndex === index && item.turn === turn && item.type !== "dividend"
          );
          if (!hadExistingNotice) {
            pushRoundNotice(
              change > 0 ? "positive" : "negative",
              index,
              change > 0 ? "Personal bonus" : "Personal expense",
              change > 0 ? "A player-specific bonus was credited this round." : "A player-specific expense was charged this round.",
              change
            );
          }
        });

        renderTopActions();
        renderFeaturePanels?.();
        if (typeof onComplete === "function") onComplete();
      });
    };
    wrapped.__polished = true;
    window.randomEvent = wrapped;
  }

  function installEndTurnRefresh() {
    if (typeof window.endTurn !== "function" || window.endTurn.__polished) return;
    const original = window.endTurn;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      window.setTimeout(() => renderTopActions(), 80);
      return result;
    };
    wrapped.__polished = true;
    window.endTurn = wrapped;
  }

  function initializePolish() {
    ensureNoticeState();
    installPortfolioLayout();
    installDividendNotificationHook();
    installPersonalEventHook();
    installEndTurnRefresh();
    renderTopActions();
  }

  window.__investFeaturePolishInit = initializePolish;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePolish, { once: true });
  } else {
    initializePolish();
  }
})();
