// ===== UPDATE 2: INCLUDE FORCED SALES IN REALIZED P/L =====
// A forced sale caused by negative cash is still a realized gain/loss.
(function () {
  if (typeof window.endTurn !== "function" || window.endTurn.__update123ForcedSale) return;

  const originalEndTurn = window.endTurn;
  window.endTurn = function (...args) {
    const before = stocks.map(stock => ({
      owned: { ...(stock.owned || {}) },
      spent: { ...(stock.totalSpent || {}) },
      price: stock.price
    }));

    const result = originalEndTurn.apply(this, args);

    // forceSell() runs synchronously during the round-ending part of endTurn().
    // Compare every player because endTurn() resets currentPlayer to 0 first.
    stocks.forEach((stock, index) => {
      if (!stock) return;

      players.forEach((_, playerIndex) => {
        const beforeOwned = Number(before[index]?.owned?.[playerIndex] || 0);
        const afterOwned = Number(stock.owned?.[playerIndex] || 0);
        const sold = beforeOwned - afterOwned;
        if (sold <= 0) return;

        const beforeSpent = Number(before[index]?.spent?.[playerIndex] || 0);
        const averageCost = beforeOwned > 0 ? beforeSpent / beforeOwned : 0;
        const proceeds = Number(before[index]?.price || stock.price || 0) * sold;
        const realized = proceeds - (averageCost * sold);

        featureStats.realizedProfit[playerIndex] = (featureStats.realizedProfit[playerIndex] || 0) + realized;
        featureStats.transactions.push({
          player: playerIndex,
          type: "forced-sell",
          stock: stock.name,
          amount: sold,
          value: proceeds,
          turn
        });
        featureStats.totalTradingVolume[playerIndex] = (featureStats.totalTradingVolume[playerIndex] || 0) + proceeds;
      });
    });

    if (typeof renderFeaturePanels === "function") renderFeaturePanels();
    return result;
  };

  window.endTurn.__update123ForcedSale = true;
})();
