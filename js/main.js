document.addEventListener("DOMContentLoaded", () => {
  console.log("Game Ready");

  // ✅ FIX: initialize UI safely
  initUI();

  // ✅ Start button
  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startGame();
    });
  }

  // ===== ANIMATION HOOK: END TURN =====
  const originalEndTurn = endTurn;
  endTurn = function(){
    const oldPrices = stocks.map(s => s.price);

    originalEndTurn();

    stocks.forEach((s, i) => {
      const el = document.getElementById(`price${i}`);
      if(!el) return;

      const change = s.price - oldPrices[i];

      if(typeof animateNumber === "function"){
        animateNumber(el, oldPrices[i], s.price, 700);
      } else {
        el.textContent = `$${s.price.toFixed(2)}`;
      }

      if(typeof flashChange === "function"){
        flashChange(el, change>0);
      }
    });
  };

  // ===== DIVIDEND FLOATING TEXT =====
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
        if(playerEl && typeof floatingText === "function"){
          floatingText(playerEl, `+$${totalDiv.toFixed(2)}`, true);
        }
      }
    });
  };

  // ===== RANDOM EVENT FLOATING TEXT =====
  const originalRandomEvent = randomEvent;
  randomEvent = function(){
    const beforeMoney = players.map(p => p.money);

    originalRandomEvent();

    players.forEach((p, pi)=>{
      const diff = p.money - beforeMoney[pi];

      if(diff !== 0){
        const playerEl = document.getElementById(`player${pi}`);
        if(playerEl && typeof floatingText === "function"){
          floatingText(playerEl, `${diff>0?'+':'-'}$${Math.abs(diff)}`, diff>0);
        }
      }
    });
  };
});
