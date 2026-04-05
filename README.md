# 📈 Investment Game

A browser-based multiplayer stock market game where players trade stocks, earn dividends, and compete to build the highest net worth.

---

## 🎮 Features

* 👥 2–4 players
* 💰 Buy & sell stocks with dynamic prices
* 📊 Live price changes based on volatility
* 💸 Dividend system (scaled by investment size)
* 🎲 Random life events (gain/lose money)
* 📈 Portfolio & price history graphs
* 🏆 End-game podium with rankings
* 🎉 Confetti celebration

---

## 📁 Project Structure

```
investment-game/
│
├── index.html                # Main HTML file (UI structure)
│
├── css/
│   ├── main.css             # Core styling (layout, colors, UI)
│   └── animations.css       # Animations (background, podium, effects)
│
├── js/
│   ├── gameLogic.js         # Core game logic (players, stocks, turns)
│   ├── ui.js                # UI rendering & interactions
│   ├── animations.js        # Visual effects (numbers, flashes, floating text)
│   └── main.js              # Initialization & function overrides
│
└── README.md                # Project documentation
```

---

## 🧠 File Responsibilities

### `index.html`

* Defines the layout of the game
* Contains:

  * Setup screen
  * Game screen (table, buttons)
  * Podium screen
  * Popup system

---

### `css/main.css`

* Handles:

  * Layout (containers, tables)
  * Buttons & UI styling
  * Popup design
  * Buy/Sell toggle appearance

---

### `css/animations.css`

* Handles:

  * Background gradient animation
  * Podium animations (rise effect)
  * Visual polish

---

### `js/gameLogic.js`

Core mechanics of the game:

* Game state (players, stocks, turns)
* Buying & selling logic
* Market price updates
* Dividend system
* Random events
* Win conditions
* Game reset & force-sell system

---

### `js/ui.js`

Handles everything the player sees:

* Rendering:

  * Info bar
  * Stock table
* Popup system
* Graph drawing (canvas)
* Trade controls (Buy/Sell toggle)
* Player & stock info views
* End game confirmation

---

### `js/animations.js`

Adds visual feedback:

* Number animations (price changes)
* Flash effects (green/red)
* Floating text (profits, events)

---

### `js/main.js`

Startup & enhancements:

* Initializes player input fields
* Hooks into:

  * `endTurn()` → animate stock prices
  * `applyDividends()` → floating profit text
  * `randomEvent()` → floating gain/loss text

---

## 🚀 How to Run

1. Download or clone the project
2. Open `index.html` in your browser
3. Select:

   * Number of players
   * Game mode (turns or target money)
4. Click **Start Game**

---

## 🛠️ Future Improvements (Ideas)

* 🤖 AI players (bots)
* 🌐 Online multiplayer
* 💾 Save / load system
* 📱 Mobile optimization
* 📰 News-based market events
* 📊 Advanced charts (hover, labels)

---

## 👤 Author

Created by you — with some debugging help 😉

---

## 📄 License

Free to use and modify for personal projects.
