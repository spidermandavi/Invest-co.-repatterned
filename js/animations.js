// ===== NUMBER ANIMATION =====
function animateNumber(element, from, to, duration = 500) {
  if (!element) return;

  const start = performance.now();
  const difference = to - from;

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = from + difference * eased;
    element.textContent = `$${value.toFixed(2)}`;

    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// ===== PRICE CHANGE FLASH =====
function flashChange(element, increased) {
  if (!element) return;

  element.classList.remove("price-up", "price-down");
  void element.offsetWidth;
  element.classList.add(increased ? "price-up" : "price-down");

  window.setTimeout(() => {
    element.classList.remove("price-up", "price-down");
  }, 700);
}

// ===== FLOATING TEXT =====
function floatingText(element, text, positive = true) {
  if (!element || !element.parentElement) return;

  const floating = document.createElement("span");
  floating.className = `floating-text ${positive ? "positive" : "negative"}`;
  floating.textContent = text;
  floating.setAttribute("aria-hidden", "true");

  element.parentElement.style.position = element.parentElement.style.position || "relative";
  element.parentElement.appendChild(floating);

  window.setTimeout(() => floating.remove(), 900);
}
