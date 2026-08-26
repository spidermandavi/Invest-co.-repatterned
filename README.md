# 📈 Investment Game

A browser-based multiplayer stock market game where players trade stocks, earn dividends, react to market news, and compete to build the highest net worth.

---

## 🎮 Features

* 👥 2–4 local players
* 💰 Buy & sell stocks with dynamic prices
* 📊 Market movement influenced by volatility, trends, market sentiment, and sectors
* 📰 Market and personal news/events that can affect prices or cash
* 💸 Dividend system
* 🏦 Live portfolio leaderboard with cash, stock value, and net worth
* 💾 Save, continue, and delete saved games using browser local storage
* 📈 Portfolio & stock price history graphs
* 🏆 End-game podium and detailed game statistics
* 🎉 Animated visual feedback
* 📱 Responsive mobile layout

---

## 📁 Project Structure

```
investment-game/
│
├── index.html                # Main HTML file (UI structure)
│
├── css/
│   ├── main.css             # Core styling and feature panels
│   └── animations.css       # Background, podium, and visual animations
│
├── js/
│   ├── gameLogic.js         # Core game mechanics
│   ├── ui.js                # UI rendering, graphs, popups, and trade controls
│   ├── animations.js        # Number, price, and floating-text effects
│   ├── gameFeatures.js      # Portfolio, market/news, save/load, and end-game systems
│   └── main.js              # Startup initialization
│
└── README.md                # Project documentation
```

---

## 🧠 New Systems

### Portfolio dashboard

During a game, players can see a live leaderboard showing:

* Cash
* Stock value
* Total net worth
* Current invested profit/loss
* Ranking against the other players

### Market simulation

Prices are no longer driven only by isolated random volatility. The market now tracks:

* Overall market sentiment
* A general market trend
* Sector trends
* Individual stock volatility
* A small mean-reversion effect toward the starting price

Stocks are grouped into sectors such as Energy, Finance, Technology, Materials, Agriculture, Industrials, Consumer, Utilities, and Defense.

### News and events

Events can affect individual players, the entire market, or a specific sector. Recent news is visible during the game and a full news history can be opened at any time.

### Save / load

Games can be saved in the browser and continued later on the same device/browser. The saved state includes players, positions, stock prices, price history, turn information, market state, dividends, and feature statistics.

### End-game statistics

After the podium, players can open a detailed statistics screen containing:

* Final net worth and gain for every player
* Portfolio ROI
* Best holding
* Best and worst-performing stock
* Trading volume
* Number of transactions
* Dividends paid
* Market and personal event counts

---

## 🚀 How to Run

1. Download or clone the project.
2. Open `index.html` in a browser.
3. Select the number of players and game mode.
4. Enter the target number of turns or target net worth.
5. Click **Start Game**.

A **Continue Saved Game** button appears when a saved game exists on that browser/device.

---

## 🛠️ Future Ideas

* 🤖 AI players (bots)
* 🌐 Online multiplayer
* 💳 Loans and interest
* 🎚️ Difficulty levels
* 📊 Advanced interactive charts

---

## 👤 Author

Created by you — with some debugging help 😉

---

## 📄 License

Free to use and modify for personal projects.
