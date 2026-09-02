// ===== SAVE / LOAD UI RECOVERY =====
// Keeps gameplay state and trading controls in sync when a saved game is resumed.

(function () {
  function installSaveLoadRecovery() {
    if (typeof window.buildSaveData === "function" && !window.buildSaveData.__uiRecovery) {
      const originalBuildSaveData = window.buildSaveData;
      const recoveredBuildSaveData = function (...args) {
        const data = originalBuildSaveData.apply(this, args);
        if (data && typeof data === "object") data.tradeMode = tradeMode === "sell" ? "sell" : "buy";
        return data;
      };
      recoveredBuildSaveData.__uiRecovery = true;
      window.buildSaveData = recoveredBuildSaveData;
    }

    if (typeof window.loadSavedGame !== "function" || window.loadSavedGame.__uiRecovery) return;

    const originalLoadSavedGame = window.loadSavedGame;

    const recoveredLoadSavedGame = function (showMessage = true) {
      const result = originalLoadSavedGame.call(this, showMessage);
      if (!result || !Array.isArray(players) || players.length === 0) return result;

      if (!Number.isInteger(currentPlayer) || currentPlayer < 0 || currentPlayer >= players.length) {
        currentPlayer = 0;
      }

      // Older saves do not contain tradeMode, so default those saves to BUY.
      // Newer saves keep the mode the player was using when they saved.
      let restoredMode = "buy";
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        const savedData = raw ? JSON.parse(raw) : null;
        if (savedData?.tradeMode === "sell") restoredMode = "sell";
      } catch {
        // Keep the safe BUY default if the saved UI state cannot be read.
      }

      tradeMode = restoredMode;
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
