// ===== MAIN.JS =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("Game Ready");

  // Generate initial player inputs
  const playerCountSelect = document.getElementById("playerCount");
  const event = new Event("change");
  playerCountSelect.dispatchEvent(event);

  // Hook into endTurn to animate stock changes
  const originalEndTurn = endTurn;
  endTurn = function(){
    const oldPrices = stocks.map(s => s.price);
    originalEndTurn();

    // Animate price changes
    stocks.forEach((s, i) => {
      const el = document.getElementById(`price${i}`);
      if(!el) return;

      const change = s.price - oldPrices[i];
      animateNumber(el, oldPrices[i], s.price, 700);
      flashChange(el, change>0);
    });
  };

  // Automatically show floating text for dividends & random events
  const originalApplyDividends = applyDividends;
  applyDividends = function(){
    originalApplyDividends();
    players.forEach((p, pi)=>{
      let totalDiv = 0;
      stocks.forEach(s=>{
        const owned = s.owned[pi];
        if(!owned) return;
        let value = owned*s.price;
        let rate=0;
        if(owned>=2000) rate=0.2;
        else if(owned>=1000) rate=0.1;
        else if(owned>=500) rate=0.075;
        else if(owned>=100) rate=0.05;
        else if(owned>=50) rate=0.025;
        else if(owned>10) rate=0.005;
        totalDiv += value*rate;
      });
      if(totalDiv > 0){
        const playerEl = document.getElementById(`player${pi}`);
        if(playerEl) floatingText(playerEl, `+$${totalDiv.toFixed(2)}`, true);
      }
    });
  };

  const originalRandomEvent = randomEvent;
  randomEvent = function(){
    const beforeMoney = players.map(p => p.money);
    originalRandomEvent();
    // show floating text for money change
    players.forEach((p, pi)=>{
      const diff = p.money - beforeMoney[pi];
      if(diff !== 0){
        const playerEl = document.getElementById(`player${pi}`);
        if(playerEl) floatingText(playerEl, `${diff>0?'+':'-'}$${Math.abs(diff)}`, diff>0);
      }
    });
  };
});
