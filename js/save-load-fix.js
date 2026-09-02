// ===== SAVE / LOAD UI RECOVERY =====
// Restores the trade controls after a saved game is loaded and guards against
// a stale/invalid current-player index preventing the stock table from rendering.

(function () {
  function installSaveLoadRecovery() {
    if (typeof window.loadSavedGame !== "function" || window.loadSavedGame.__uiRecovery) return;

    const originalLoadSavedGame = window.loadSavedGame;

    const recoveredLoadSavedGame = function (showMessage = true) {
      const result = originalLoadSavedGame.call(this, showMessage);
      if (!result || !Array.isArray(players) || players.length === 0) return result;

      if (!Number.isInteger(currentPlayer) || currentPlayer < 0 || currentPlayer >= players.length) {
        currentPlayer = 0;
      }

      // loadSavedGame restores gameplay state, but tradeMode is UI state.
      // Rebuild the toggle explicitly so BUY/SELL is always usable after resume.
      const restoredMode = tradeMode === "sell" ? "sell" : "buy";
      setTradeMode(restoredMode);
      render();
      if (typeof renderFeaturePanels === "function") renderFeaturePanels();

      return result;
    };

    recoveredLoadSavedGame.__uiRecovery = true;
    window.loadSavedGame = recoveredLoadSavedGame;
  }

  if (typeof window.loadSavedGame === "function") {
    installSaveLoadRecovery();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installSaveLoadRecovery, { once: true });
  } else {
    installSaveLoadRecovery();
  }
})();
