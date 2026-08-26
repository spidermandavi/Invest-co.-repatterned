document.addEventListener("DOMContentLoaded", () => {
  initUI();

  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }
});
