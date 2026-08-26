// Keep the polished top controls visible after normal game renders.
(function () {
  if (window.__investFeatureRefreshInstalled) return;
  window.__investFeatureRefreshInstalled = true;

  if (typeof window.renderInfoBar === "function") {
    const originalRenderInfoBar = window.renderInfoBar;
    window.renderInfoBar = function (...args) {
      const result = originalRenderInfoBar.apply(this, args);
      if (typeof window.__investFeaturePolishInit === "function") {
        window.__investFeaturePolishInit();
      }
      return result;
    };
  }

  if (typeof window.setTradeMode === "function") {
    const originalSetTradeMode = window.setTradeMode;
    window.setTradeMode = function (...args) {
      const result = originalSetTradeMode.apply(this, args);
      if (typeof window.__investFeaturePolishInit === "function") {
        window.__investFeaturePolishInit();
      }
      return result;
    };
  }
})();
