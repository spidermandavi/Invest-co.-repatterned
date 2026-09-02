// ===== UPDATE 2: INCLUDE FORCED SALES IN REALIZED P/L =====
// A forced sale caused by negative cash is still a realized gain/loss.
(function () {
  if (typeof window.endTurn !== "function" || window.endTurn.__update123ForcedSale) return;

  const originalEndTurn = window.endTurn;
  window.endTurn = function (...args) {
    const before = stocks.map(stock => ({
      owned: stock.owned?.[currentPlayer] || 0,
      spent: stock.totalSpent?.[currentPlayer] || 0,
      price: stock.price
    }));

    const result = originalEndTurn.apply(this, args);

    // forceSell() runs synchronously during endTurn(). Compare holdings immediately.
    before.forEach((snapshot, index) => {
      const stock = stocks[index];
      const afterOwned = stock?.owned?.[currentPlayer] || 0;
      const sold = snapshot.owned - afterOwned;
      if (sold <= 0 || !stock) return;

      const averageCost = snapshot.owned > 0 ? snapshot.spent / snapshot.owned : 0;
      const realized = (snapshot.price * sold) - (averageCost * sold);
      featureStats.realizedProfit[currentPlayer] = (featureStats.realizedProfit[currentPlayer] || 0) + realized;

      featureStats.transactions.push({
        player: currentPlayer,
        type: "forced-sell",
        stock: stock.name,
        amount: sold,
        value: snapshot.price * sold,
        turn
      });
      featureStats.totalTradingVolume[currentPlayer] = (featureStats.totalTradingVolume[currentPlayer] || 0) + snapshot.price * sold;
    });

    return result;
  };

  window.endTurn.__update123ForcedSale = true;
})();
